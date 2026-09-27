package handlers

import (
	"fazbrike-backend/models"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const promotionListLimit = 10

type publicPromotion struct {
	ID       uint   `json:"id"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle,omitempty"`
	ImageURL string `json:"image_url"`
	LinkURL  string `json:"link_url,omitempty"`
	CtaLabel string `json:"cta_label,omitempty"`
}

// EnsurePromotionIndexes cobre a consulta do slider: ativas, dentro da janela
// de exibição e na ordem definida no admin.
func EnsurePromotionIndexes(db *gorm.DB) error {
	statements := []string{
		`CREATE INDEX IF NOT EXISTS idx_promotions_public ON promotions (sort_order ASC, created_at DESC) WHERE is_active = TRUE`,
	}
	for _, statement := range statements {
		if err := db.Exec(statement).Error; err != nil {
			return err
		}
	}
	return nil
}

// GetPromotions lista os banners de campanha visíveis agora.
func GetPromotions(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit := promotionListLimit
		if raw := c.Query("limit"); raw != "" {
			if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
				limit = parsed
			}
		}
		if limit > 20 {
			limit = 20
		}

		now := time.Now()
		var promotions []models.Promotion
		if err := db.Model(&models.Promotion{}).
			Where("is_active = TRUE").
			Where("starts_at IS NULL OR starts_at <= ?", now).
			Where("ends_at IS NULL OR ends_at > ?", now).
			Order("sort_order ASC, created_at DESC").
			Limit(limit).
			Find(&promotions).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar promoções"})
			return
		}

		out := make([]publicPromotion, 0, len(promotions))
		for _, promotion := range promotions {
			out = append(out, publicPromotion{
				ID:       promotion.ID,
				Title:    promotion.Title,
				Subtitle: promotion.Subtitle,
				ImageURL: promotion.ImageURL,
				LinkURL:  promotion.LinkURL,
				CtaLabel: promotion.CtaLabel,
			})
		}
		c.JSON(http.StatusOK, out)
	}
}
