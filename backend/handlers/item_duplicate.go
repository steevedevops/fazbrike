package handlers

import (
	"fazbrike-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// DuplicateItem cria uma cópia de um anúncio do próprio dono (título, descrição,
// preço, categoria, localização e fotos), publicada como um novo anúncio ativo.
func DuplicateItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		source, ok := loadOwnedItem(db, c)
		if !ok {
			return
		}

		var images []models.ItemImage
		if err := db.Where("item_id = ?", source.ID).Order("sort_order asc, id asc").Find(&images).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar fotos do anúncio"})
			return
		}

		clone := models.Item{
			UserID:      source.UserID,
			Title:       source.Title + " (cópia)",
			Description: source.Description,
			Price:       source.Price,
			ImageURL:    source.ImageURL,
			Category:    source.Category,
			ListingType: source.ListingType,
			Location:    source.Location,
			CityID:      source.CityID,
			StateID:     source.StateID,
			Condition:   source.Condition,
			Attrs:       source.Attrs,
			Status:      "active",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		if err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Create(&clone).Error; err != nil {
				return err
			}
			for _, img := range images {
				imgCopy := models.ItemImage{
					ItemID:    clone.ID,
					URL:       img.URL,
					SortOrder: img.SortOrder,
					CreatedAt: time.Now(),
				}
				if err := tx.Create(&imgCopy).Error; err != nil {
					return err
				}
			}
			return nil
		}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao duplicar anúncio"})
			return
		}

		_ = db.Preload("User").Preload("City.State").First(&clone, clone.ID)
		SanitizeItemPublic(&clone)
		c.JSON(http.StatusCreated, clone)
	}
}
