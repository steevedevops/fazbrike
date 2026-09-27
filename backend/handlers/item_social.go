package handlers

import (
	"fazbrike-backend/models"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const itemCommentMaxLength = 300

type itemCommentResponse struct {
	ID        uint        `json:"id"`
	ItemID    uint        `json:"item_id"`
	UserID    uint        `json:"user_id"`
	Content   string      `json:"content"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
	User      models.User `json:"user"`
}

func enrichItemsSocial(db *gorm.DB, items []models.Item, viewerID *uint) {
	if len(items) == 0 {
		return
	}
	ids := make([]uint, 0, len(items))
	for _, item := range items {
		ids = append(ids, item.ID)
	}

	comments := countByItem(db, &models.ItemComment{}, ids)
	views := countByItem(db, &models.ItemView{}, ids)
	favorites := countByItem(db, &models.ItemFavorite{}, ids)
	var favorited map[uint]bool
	if viewerID != nil {
		favorited = favoritedByViewer(db, ids, *viewerID)
	}

	for i := range items {
		items[i].CommentsCount = comments[items[i].ID]
		items[i].ViewsCount = views[items[i].ID]
		items[i].FavoritesCount = favorites[items[i].ID]
		if viewerID != nil {
			items[i].IsFavorited = favorited[items[i].ID]
		}
	}
}

func enrichItemSocial(db *gorm.DB, item *models.Item, viewerID *uint) {
	if item == nil || item.ID == 0 {
		return
	}
	items := []models.Item{*item}
	enrichItemsSocial(db, items, viewerID)
	*item = items[0]
}

func currentViewerID(c *gin.Context) *uint {
	raw, ok := c.Get("user_id")
	if !ok {
		return nil
	}
	uid, ok := raw.(uint)
	if !ok {
		return nil
	}
	return &uid
}

func countByItem(db *gorm.DB, model interface{}, itemIDs []uint) map[uint]int64 {
	type row struct {
		ItemID uint
		Count  int64
	}
	out := make(map[uint]int64, len(itemIDs))
	var rows []row
	if err := db.Model(model).
		Select("item_id, count(*) as count").
		Where("item_id IN ?", itemIDs).
		Group("item_id").
		Scan(&rows).Error; err != nil {
		return out
	}
	for _, r := range rows {
		out[r.ItemID] = r.Count
	}
	return out
}

func favoritedByViewer(db *gorm.DB, itemIDs []uint, userID uint) map[uint]bool {
	out := make(map[uint]bool, len(itemIDs))
	var favs []models.ItemFavorite
	if err := db.Select("item_id").
		Where("user_id = ? AND item_id IN ?", userID, itemIDs).
		Find(&favs).Error; err != nil {
		return out
	}
	for _, fav := range favs {
		out[fav.ItemID] = true
	}
	return out
}

func GetItemComments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemID, ok := parseItemID(c)
		if !ok {
			return
		}
		if !publicItemExists(db, c, itemID) {
			return
		}

		var comments []models.ItemComment
		if err := db.Where("item_id = ?", itemID).
			Preload("User").
			Order("created_at desc, id desc").
			Find(&comments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar comentários"})
			return
		}

		out := make([]itemCommentResponse, 0, len(comments))
		for _, comment := range comments {
			SanitizePublicUser(&comment.User)
			out = append(out, itemCommentResponse{
				ID:        comment.ID,
				ItemID:    comment.ItemID,
				UserID:    comment.UserID,
				Content:   comment.Content,
				CreatedAt: comment.CreatedAt,
				UpdatedAt: comment.UpdatedAt,
				User:      comment.User,
			})
		}
		c.JSON(http.StatusOK, out)
	}
}

func CreateItemComment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		itemID, ok := parseItemID(c)
		if !ok {
			return
		}
		if !publicItemExists(db, c, itemID) {
			return
		}

		var req struct {
			Content string `json:"content"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Comentário inválido"})
			return
		}
		content := strings.TrimSpace(req.Content)
		if content == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Escreva uma pergunta ou comentário"})
			return
		}
		if len([]rune(content)) > itemCommentMaxLength {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Comentário deve ter no máximo 300 caracteres"})
			return
		}

		comment := models.ItemComment{ItemID: itemID, UserID: uid, Content: content}
		if err := db.Create(&comment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao publicar comentário"})
			return
		}
		_ = db.Preload("User").First(&comment, comment.ID)
		SanitizePublicUser(&comment.User)
		notifyItemOwner(db, itemID, uid, models.NotificationTypeComment, "comentou no seu anúncio", content)
		c.JSON(http.StatusCreated, itemCommentResponse{
			ID:        comment.ID,
			ItemID:    comment.ItemID,
			UserID:    comment.UserID,
			Content:   comment.Content,
			CreatedAt: comment.CreatedAt,
			UpdatedAt: comment.UpdatedAt,
			User:      comment.User,
		})
	}
}

func DeleteItemComment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		itemID, ok := parseItemID(c)
		if !ok {
			return
		}
		commentID, err := strconv.Atoi(c.Param("commentId"))
		if err != nil || commentID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID do comentário inválido"})
			return
		}

		var comment models.ItemComment
		if err := db.First(&comment, "id = ? AND item_id = ?", commentID, itemID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Comentário não encontrado"})
			return
		}
		var item models.Item
		if err := db.First(&item, itemID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			return
		}
		if comment.UserID != uid && item.UserID != uid && !isCurrentUserAdmin(db, uid) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não pode remover este comentário"})
			return
		}
		if err := db.Delete(&comment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao remover comentário"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}

func RegisterItemView(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		itemID, ok := parseItemID(c)
		if !ok {
			return
		}
		if !publicItemExists(db, c, itemID) {
			return
		}

		view := models.ItemView{ItemID: itemID, UserID: uid}
		if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&view).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao registrar visualização"})
			return
		}
		var count int64
		_ = db.Model(&models.ItemView{}).Where("item_id = ?", itemID).Count(&count).Error
		c.JSON(http.StatusOK, gin.H{"viewed": true, "views_count": count})
	}
}

func parseItemID(c *gin.Context) (uint, bool) {
	itemID, err := strconv.Atoi(c.Param("id"))
	if err != nil || itemID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return 0, false
	}
	return uint(itemID), true
}

func requireUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return 0, false
	}
	uid, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return 0, false
	}
	return uid, true
}

func publicItemExists(db *gorm.DB, c *gin.Context, itemID uint) bool {
	var item models.Item
	if err := db.Select("id").Where("id = ? AND status = ?", itemID, "active").First(&item).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
		return false
	}
	return true
}

func isCurrentUserAdmin(db *gorm.DB, userID uint) bool {
	var user models.User
	if err := db.Select("role").First(&user, userID).Error; err != nil {
		return false
	}
	return user.Role == "admin"
}
