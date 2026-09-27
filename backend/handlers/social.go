package handlers

import (
	"fazbrike-backend/models"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// FollowUser creates a follow edge (auth required).
func FollowUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		followerID := userID.(uint)
		targetID, err := strconv.Atoi(c.Param("id"))
		if err != nil || targetID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		if uint(targetID) == followerID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Você não pode seguir a si mesmo"})
			return
		}
		var user models.User
		if err := db.First(&user, targetID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			return
		}
		var already int64
		if err := db.Model(&models.Follow{}).
			Where("follower_id = ? AND following_id = ?", followerID, targetID).
			Count(&already).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao seguir"})
			return
		}
		follow := models.Follow{
			FollowerID:  followerID,
			FollowingID: uint(targetID),
		}
		if err := db.Where("follower_id = ? AND following_id = ?", followerID, targetID).
			FirstOrCreate(&follow).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao seguir"})
			return
		}
		// Só avisa quando o vínculo é novo: refollow não gera notificação nova.
		if already == 0 {
			actor := followerID
			NotifyUser(db, models.Notification{
				UserID:  uint(targetID),
				Type:    models.NotificationTypeFollow,
				Title:   actorDisplayName(db, followerID) + " começou a seguir você",
				Body:    "Veja o perfil e os anúncios dessa pessoa.",
				Link:    fmt.Sprintf("/usuario/%d", followerID),
				ActorID: &actor,
			})
		}
		c.JSON(http.StatusOK, gin.H{"following": true})
	}
}

// UnfollowUser removes a follow edge.
func UnfollowUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		followerID := userID.(uint)
		targetID, err := strconv.Atoi(c.Param("id"))
		if err != nil || targetID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		if err := db.Where("follower_id = ? AND following_id = ?", followerID, targetID).
			Delete(&models.Follow{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao deixar de seguir"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"following": false})
	}
}

type followUserDTO struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

func listFollowUsers(db *gorm.DB, userIDs []uint) []followUserDTO {
	if len(userIDs) == 0 {
		return []followUserDTO{}
	}
	var users []models.User
	_ = db.Where("id IN ?", userIDs).Find(&users).Error
	profiles := map[uint]string{}
	var ps []models.UserProfile
	_ = db.Where("user_id IN ?", userIDs).Find(&ps).Error
	for _, p := range ps {
		profiles[p.UserID] = p.AvatarURL
	}
	out := make([]followUserDTO, 0, len(users))
	for _, u := range users {
		out = append(out, followUserDTO{ID: u.ID, Name: u.Name, AvatarURL: profiles[u.ID]})
	}
	return out
}

func requirePublicProfile(db *gorm.DB, c *gin.Context, targetID uint) bool {
	profile, err := EnsureUserProfile(db, targetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar perfil"})
		return false
	}
	var viewerID *uint
	if raw, ok := c.Get("user_id"); ok {
		uid := raw.(uint)
		viewerID = &uid
	}
	if !profile.IsPublic && !canViewPrivateProfile(viewerID, targetID) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Perfil não encontrado"})
		return false
	}
	return true
}

// GetFollowers lists users who follow :id.
func GetFollowers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		targetID, err := strconv.Atoi(c.Param("id"))
		if err != nil || targetID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		if !requirePublicProfile(db, c, uint(targetID)) {
			return
		}
		var follows []models.Follow
		if err := db.Where("following_id = ?", targetID).Order("created_at desc").Find(&follows).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar seguidores"})
			return
		}
		ids := make([]uint, 0, len(follows))
		for _, f := range follows {
			ids = append(ids, f.FollowerID)
		}
		c.JSON(http.StatusOK, listFollowUsers(db, ids))
	}
}

// GetFollowing lists users that :id follows.
func GetFollowing(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		targetID, err := strconv.Atoi(c.Param("id"))
		if err != nil || targetID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		if !requirePublicProfile(db, c, uint(targetID)) {
			return
		}
		var follows []models.Follow
		if err := db.Where("follower_id = ?", targetID).Order("created_at desc").Find(&follows).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar seguindo"})
			return
		}
		ids := make([]uint, 0, len(follows))
		for _, f := range follows {
			ids = append(ids, f.FollowingID)
		}
		c.JSON(http.StatusOK, listFollowUsers(db, ids))
	}
}

// CreateReview posts a seller review.
func CreateReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		reviewerID := userID.(uint)

		var req struct {
			RevieweeID uint   `json:"reviewee_id"`
			ItemID     *uint  `json:"item_id"`
			Rating     int    `json:"rating"`
			Comment    string `json:"comment"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if req.RevieweeID == 0 || req.RevieweeID == reviewerID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Vendedor inválido"})
			return
		}
		if req.Rating < 1 || req.Rating > 5 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nota deve ser entre 1 e 5"})
			return
		}
		var reviewee models.User
		if err := db.First(&reviewee, req.RevieweeID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			return
		}
		if req.ItemID != nil {
			var item models.Item
			if err := db.First(&item, *req.ItemID).Error; err != nil || item.UserID != req.RevieweeID {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Item inválido para esta avaliação"})
				return
			}
		}

		review := models.Review{
			ReviewerID: reviewerID,
			RevieweeID: req.RevieweeID,
			ItemID:     req.ItemID,
			Rating:     req.Rating,
			Comment:    strings.TrimSpace(req.Comment),
		}
		if err := db.Create(&review).Error; err != nil {
			msg := "Você já avaliou este vendedor"
			if req.ItemID != nil {
				msg += " neste anúncio"
			}
			c.JSON(http.StatusConflict, gin.H{"error": msg})
			return
		}
		_ = db.Preload("Reviewer").First(&review, review.ID)
		actor := reviewerID
		body := strings.TrimSpace(review.Comment)
		if body == "" {
			body = fmt.Sprintf("Nota %d de 5", review.Rating)
		}
		NotifyUser(db, models.Notification{
			UserID:  review.RevieweeID,
			Type:    models.NotificationTypeReview,
			Title:   actorDisplayName(db, reviewerID) + " avaliou você",
			Body:    body,
			Link:    fmt.Sprintf("/usuario/%d", review.RevieweeID),
			ActorID: &actor,
			ItemID:  review.ItemID,
		})
		c.JSON(http.StatusCreated, toPublicReview(review, buildReviewAvatars(db, []uint{reviewerID})))
	}
}

// UpdateReview lets the author edit their own review.
func UpdateReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		reviewID, err := strconv.Atoi(c.Param("id"))
		if err != nil || reviewID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		var review models.Review
		if err := db.Preload("Reviewer").First(&review, reviewID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Avaliação não encontrada"})
			return
		}
		if review.ReviewerID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não pode editar esta avaliação"})
			return
		}
		var req struct {
			Rating  int    `json:"rating"`
			Comment string `json:"comment"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if req.Rating < 1 || req.Rating > 5 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nota deve ser entre 1 e 5"})
			return
		}
		review.Rating = req.Rating
		review.Comment = strings.TrimSpace(req.Comment)
		if err := db.Save(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar avaliação"})
			return
		}
		c.JSON(http.StatusOK, toPublicReview(review, buildReviewAvatars(db, []uint{review.ReviewerID})))
	}
}

// DeleteReview lets the author remove their own review.
func DeleteReview(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		reviewID, err := strconv.Atoi(c.Param("id"))
		if err != nil || reviewID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		var review models.Review
		if err := db.First(&review, reviewID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Avaliação não encontrada"})
			return
		}
		if review.ReviewerID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não pode remover esta avaliação"})
			return
		}
		if err := db.Delete(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao remover avaliação"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}

type publicReviewDTO struct {
	ID         uint          `json:"id"`
	ReviewerID uint          `json:"reviewer_id"`
	RevieweeID uint          `json:"reviewee_id"`
	ItemID     *uint         `json:"item_id,omitempty"`
	Rating     int           `json:"rating"`
	Comment    string        `json:"comment"`
	CreatedAt  time.Time     `json:"created_at"`
	Reviewer   followUserDTO `json:"reviewer,omitempty"`
}

func buildReviewAvatars(db *gorm.DB, reviewerIDs []uint) map[uint]string {
	avatar := map[uint]string{}
	if len(reviewerIDs) == 0 {
		return avatar
	}
	var profiles []models.UserProfile
	_ = db.Where("user_id IN ?", reviewerIDs).Find(&profiles).Error
	for _, p := range profiles {
		avatar[p.UserID] = p.AvatarURL
	}
	return avatar
}

func toPublicReview(r models.Review, avatar map[uint]string) publicReviewDTO {
	return publicReviewDTO{
		ID:         r.ID,
		ReviewerID: r.ReviewerID,
		RevieweeID: r.RevieweeID,
		ItemID:     r.ItemID,
		Rating:     r.Rating,
		Comment:    r.Comment,
		CreatedAt:  r.CreatedAt,
		Reviewer:   followUserDTO{ID: r.Reviewer.ID, Name: r.Reviewer.Name, AvatarURL: avatar[r.Reviewer.ID]},
	}
}

// GetUserReviews lists reviews received by a user.
func GetUserReviews(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		targetID, err := strconv.Atoi(c.Param("id"))
		if err != nil || targetID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		if !requirePublicProfile(db, c, uint(targetID)) {
			return
		}
		var reviews []models.Review
		if err := db.Where("reviewee_id = ?", targetID).
			Preload("Reviewer").
			Order("created_at desc").
			Find(&reviews).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar avaliações"})
			return
		}
		ids := make([]uint, 0, len(reviews))
		for _, r := range reviews {
			ids = append(ids, r.ReviewerID)
		}
		avatar := buildReviewAvatars(db, ids)
		out := make([]publicReviewDTO, 0, len(reviews))
		for _, r := range reviews {
			out = append(out, toPublicReview(r, avatar))
		}
		c.JSON(http.StatusOK, out)
	}
}

// GetUserFavorites lists items favorited by a user (owner or public profile only).
func GetUserFavorites(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		targetID, err := strconv.Atoi(c.Param("id"))
		if err != nil || targetID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		var viewerID *uint
		if raw, ok := c.Get("user_id"); ok {
			uid := raw.(uint)
			viewerID = &uid
		}
		// Favoritos: só o dono vê (privacidade)
		if !canViewPrivateProfile(viewerID, uint(targetID)) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Não encontrado"})
			return
		}
		var favs []models.ItemFavorite
		if err := db.Where("user_id = ?", targetID).
			Preload("Item").Preload("Item.User").
			Order("created_at desc").
			Find(&favs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar favoritos"})
			return
		}
		items := make([]models.Item, 0, len(favs))
		for _, f := range favs {
			if f.Item.ID != 0 {
				items = append(items, f.Item)
			}
		}
		enrichItemsSocial(db, items, currentViewerID(c))
		SanitizeItemsPublic(items)
		c.JSON(http.StatusOK, items)
	}
}

// FavoriteItem adds an item to the current user's favorites.
func FavoriteItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		uid := userID.(uint)
		itemID, err := strconv.Atoi(c.Param("id"))
		if err != nil || itemID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		var item models.Item
		if err := db.First(&item, itemID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			return
		}
		var already int64
		if err := db.Model(&models.ItemFavorite{}).
			Where("user_id = ? AND item_id = ?", uid, itemID).
			Count(&already).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao favoritar"})
			return
		}
		fav := models.ItemFavorite{UserID: uid, ItemID: uint(itemID)}
		if err := db.Where("user_id = ? AND item_id = ?", uid, itemID).FirstOrCreate(&fav).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao favoritar"})
			return
		}
		// Refavoritar o mesmo anúncio não repete o aviso para o vendedor.
		if already == 0 {
			notifyItemOwner(db, uint(itemID), uid, models.NotificationTypeFavorite, "salvou seu anúncio nos favoritos", item.Title)
		}
		var count int64
		_ = db.Model(&models.ItemFavorite{}).Where("item_id = ?", itemID).Count(&count).Error
		c.JSON(http.StatusOK, gin.H{"favorited": true, "favorites_count": count})
	}
}

// UnfavoriteItem removes an item from favorites.
func UnfavoriteItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		uid := userID.(uint)
		itemID, err := strconv.Atoi(c.Param("id"))
		if err != nil || itemID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		if err := db.Where("user_id = ? AND item_id = ?", uid, itemID).Delete(&models.ItemFavorite{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao remover favorito"})
			return
		}
		var count int64
		_ = db.Model(&models.ItemFavorite{}).Where("item_id = ?", itemID).Count(&count).Error
		c.JSON(http.StatusOK, gin.H{"favorited": false, "favorites_count": count})
	}
}
