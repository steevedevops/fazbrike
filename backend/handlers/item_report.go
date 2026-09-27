package handlers

import (
	"fazbrike-backend/config"
	"fazbrike-backend/models"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var itemReportReasons = map[string]struct{}{
	"prohibited_item": {},
	"fraud":           {},
	"misleading":      {},
	"duplicate":       {},
	"offensive":       {},
	"other":           {},
}

// CreateItemReport registra uma única denúncia por usuário e anúncio.
func CreateItemReport(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		itemID, ok := parseItemID(c)
		if !ok {
			return
		}

		var req struct {
			Reason  string `json:"reason"`
			Details string `json:"details"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dados da denúncia inválidos"})
			return
		}
		req.Reason = strings.ToLower(strings.TrimSpace(req.Reason))
		req.Details = strings.TrimSpace(req.Details)
		if _, valid := itemReportReasons[req.Reason]; !valid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Selecione um motivo válido para a denúncia"})
			return
		}
		if req.Reason == "other" && req.Details == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Descreva o problema ao selecionar outro motivo"})
			return
		}
		if utf8.RuneCountInString(req.Details) > 1000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Os detalhes devem ter no máximo 1000 caracteres"})
			return
		}

		var item models.Item
		if err := db.Select("id", "user_id", "status").Where("id = ? AND status = ?", itemID, "active").First(&item).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Anúncio não encontrado"})
			return
		}
		if item.UserID == uid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Você não pode denunciar o próprio anúncio"})
			return
		}

		now := time.Now()
		report := models.ItemReport{
			ItemID:     item.ID,
			ReporterID: uid,
			Reason:     req.Reason,
			Details:    req.Details,
			Status:     "open",
			CreatedAt:  now,
			UpdatedAt:  now,
		}
		result := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "item_id"}, {Name: "reporter_id"}},
			TargetWhere: clause.Where{Exprs: []clause.Expression{
				clause.Eq{Column: clause.Column{Name: "status"}, Value: "open"},
			}},
			DoNothing: true,
		}).Create(&report)
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível enviar a denúncia"})
			return
		}
		if result.RowsAffected == 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "Você já denunciou este anúncio"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"id":      report.ID,
			"message": "Denúncia enviada. Nossa equipe fará a análise.",
		})
	}
}

// ApplyItemModerationAfterChange recoloca anúncios alterados na fila quando a
// moderação está ligada. Com a moderação desligada, pendências deixam de bloquear
// a publicação assim que o proprietário salva uma alteração.
func ApplyItemModerationAfterChange(db *gorm.DB, itemID uint) error {
	updates := map[string]interface{}{
		"rejection_reason": "",
		"moderated_at":     nil,
		"moderated_by_id":  nil,
		"updated_at":       time.Now(),
	}
	if config.ItemModerationEnabled() {
		updates["status"] = "pending"
		return db.Model(&models.Item{}).Where("id = ?", itemID).Updates(updates).Error
	}
	return db.Model(&models.Item{}).
		Where("id = ? AND status IN ?", itemID, []string{"pending", "rejected"}).
		Updates(map[string]interface{}{
			"status":           "active",
			"rejection_reason": "",
			"moderated_at":     nil,
			"moderated_by_id":  nil,
			"updated_at":       time.Now(),
		}).Error
}

// EnsureItemReportSchema acrescenta constraints e índices usados pelas filas
// de denúncias e moderação. Todas as instruções são idempotentes.
func EnsureItemReportSchema(db *gorm.DB) error {
	statements := []string{
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_item_reports_open_reporter
			ON item_reports (item_id, reporter_id) WHERE status = 'open'`,
		`CREATE INDEX IF NOT EXISTS idx_item_reports_status_created ON item_reports (status, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_items_status_created ON items (status, created_at DESC)`,
		`DO $$ BEGIN
			ALTER TABLE item_reports ADD CONSTRAINT item_reports_status_check
				CHECK (status IN ('open', 'resolved', 'dismissed'));
		EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
		`DO $$ BEGIN
			ALTER TABLE item_reports ADD CONSTRAINT item_reports_reason_check
				CHECK (reason IN ('prohibited_item', 'fraud', 'misleading', 'duplicate', 'offensive', 'other'));
		EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
	}
	for _, statement := range statements {
		if err := db.Exec(statement).Error; err != nil {
			return err
		}
	}
	return nil
}
