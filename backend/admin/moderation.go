package admin

import (
	"fazbrike-backend/config"
	"fazbrike-backend/models"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type moderationItemRow struct {
	ID          uint      `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	ImageURL    string    `json:"image_url"`
	Status      string    `json:"status"`
	SellerName  string    `json:"seller_name"`
	CreatedAt   time.Time `json:"created_at"`
}

type moderationReportRow struct {
	ID           uint      `json:"id"`
	ItemID       uint      `json:"item_id"`
	ItemTitle    string    `json:"item_title"`
	ItemStatus   string    `json:"item_status"`
	ReporterName string    `json:"reporter_name"`
	Reason       string    `json:"reason"`
	Details      string    `json:"details"`
	CreatedAt    time.Time `json:"created_at"`
}

func moderationPage(c *gin.Context) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("perPage", "20"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	if perPage > 100 {
		perPage = 100
	}
	return page, perPage
}

func HandleModerationSummary(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pendingItems, openReports int64
		if err := db.Model(&models.Item{}).Where("status = ?", "pending").Count(&pendingItems).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao contar anúncios pendentes"})
			return
		}
		if err := db.Model(&models.ItemReport{}).Where("status = ?", "open").Count(&openReports).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao contar denúncias"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"moderation_enabled": config.ItemModerationEnabled(),
			"pending_items":      pendingItems,
			"open_reports":       openReports,
			"total":              pendingItems + openReports,
		})
	}
}

func HandleModerationQueue(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, perPage := moderationPage(c)
		offset := (page - 1) * perPage
		kind := c.Query("kind")

		switch kind {
		case "items":
			var total int64
			if err := db.Model(&models.Item{}).Where("status = ?", "pending").Count(&total).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar fila de anúncios"})
				return
			}
			var rows []moderationItemRow
			if err := db.Table("items").
				Select("items.id, items.title, items.description, items.price, items.image_url, items.status, users.name AS seller_name, items.created_at").
				Joins("JOIN users ON users.id = items.user_id").
				Where("items.status = ?", "pending").
				Order("items.created_at ASC, items.id ASC").
				Limit(perPage).Offset(offset).Scan(&rows).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar fila de anúncios"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"data": rows, "total": total, "page": page, "perPage": perPage})
		case "reports":
			var total int64
			if err := db.Model(&models.ItemReport{}).Where("status = ?", "open").Count(&total).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar denúncias"})
				return
			}
			var rows []moderationReportRow
			if err := db.Table("item_reports").
				Select("item_reports.id, item_reports.item_id, items.title AS item_title, items.status AS item_status, users.name AS reporter_name, item_reports.reason, item_reports.details, item_reports.created_at").
				Joins("JOIN items ON items.id = item_reports.item_id").
				Joins("JOIN users ON users.id = item_reports.reporter_id").
				Where("item_reports.status = ?", "open").
				Order("item_reports.created_at ASC, item_reports.id ASC").
				Limit(perPage).Offset(offset).Scan(&rows).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar denúncias"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"data": rows, "total": total, "page": page, "perPage": perPage})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Fila de moderação inválida"})
		}
	}
}

func HandleModerationSettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Enabled *bool `json:"enabled"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.Enabled == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Informe se a moderação deve ficar ativada"})
			return
		}
		value := strconv.FormatBool(*req.Enabled)
		row := models.Configuration{Key: "ITEM_MODERATION_ENABLED", Value: value}
		var publishedPending int64
		if err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "key"}},
				DoUpdates: clause.Assignments(map[string]interface{}{"value": value, "updated_at": time.Now()}),
			}).Create(&row).Error; err != nil {
				return err
			}
			if !*req.Enabled {
				result := tx.Model(&models.Item{}).Where("status = ?", "pending").Updates(map[string]interface{}{
					"status":           "active",
					"rejection_reason": "",
					"moderated_at":     time.Now(),
					"moderated_by_id":  c.MustGet("user_id"),
					"updated_at":       time.Now(),
				})
				publishedPending = result.RowsAffected
				return result.Error
			}
			return nil
		}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao salvar configuração de moderação"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"moderation_enabled": *req.Enabled,
			"published_pending":  publishedPending,
		})
	}
}

func HandleModerateItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemID, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || itemID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Anúncio inválido"})
			return
		}
		var req struct {
			Action string `json:"action"`
			Reason string `json:"reason"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de moderação inválidos"})
			return
		}
		req.Action = strings.ToLower(strings.TrimSpace(req.Action))
		req.Reason = strings.TrimSpace(req.Reason)
		if req.Action != "approve" && req.Action != "reject" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ação de moderação inválida"})
			return
		}
		if req.Action == "reject" && req.Reason == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Informe o motivo da rejeição"})
			return
		}
		if utf8.RuneCountInString(req.Reason) > 1000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "O motivo deve ter no máximo 1000 caracteres"})
			return
		}

		var item models.Item
		if err := db.Where("id = ? AND status = ?", itemID, "pending").First(&item).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Anúncio pendente não encontrado"})
			return
		}
		adminID, _ := c.Get("user_id")
		now := time.Now()
		status := "active"
		if req.Action == "reject" {
			status = "rejected"
		}
		if err := db.Model(&item).Updates(map[string]interface{}{
			"status":           status,
			"rejection_reason": req.Reason,
			"moderated_at":     now,
			"moderated_by_id":  adminID,
			"updated_at":       now,
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao moderar anúncio"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": status})
	}
}

func HandleModerateReport(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		reportID, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || reportID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Denúncia inválida"})
			return
		}
		var req struct {
			Action     string `json:"action"`
			Resolution string `json:"resolution"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dados de resolução inválidos"})
			return
		}
		req.Action = strings.ToLower(strings.TrimSpace(req.Action))
		req.Resolution = strings.TrimSpace(req.Resolution)
		if req.Action != "resolve" && req.Action != "dismiss" && req.Action != "reject_item" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ação de resolução inválida"})
			return
		}
		if req.Action == "reject_item" && req.Resolution == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Informe o motivo para retirar o anúncio"})
			return
		}
		if utf8.RuneCountInString(req.Resolution) > 1000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "A resolução deve ter no máximo 1000 caracteres"})
			return
		}

		var report models.ItemReport
		if err := db.Where("id = ? AND status = ?", reportID, "open").First(&report).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Denúncia aberta não encontrada"})
			return
		}
		adminIDValue, _ := c.Get("user_id")
		adminID, _ := adminIDValue.(uint)
		now := time.Now()
		status := "resolved"
		if req.Action == "dismiss" {
			status = "dismissed"
		}
		if req.Resolution == "" {
			if req.Action == "dismiss" {
				req.Resolution = "Denúncia não procedente."
			} else {
				req.Resolution = "Denúncia analisada."
			}
		}

		if err := db.Transaction(func(tx *gorm.DB) error {
			if req.Action == "reject_item" {
				if err := tx.Model(&models.Item{}).Where("id = ?", report.ItemID).Updates(map[string]interface{}{
					"status":           "rejected",
					"rejection_reason": req.Resolution,
					"moderated_at":     now,
					"moderated_by_id":  adminID,
					"updated_at":       now,
				}).Error; err != nil {
					return err
				}
			}
			return tx.Model(&report).Updates(map[string]interface{}{
				"status":         status,
				"resolution":     req.Resolution,
				"reviewed_by_id": adminID,
				"reviewed_at":    now,
				"updated_at":     now,
			}).Error
		}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao resolver denúncia"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": status})
	}
}
