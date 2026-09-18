package handlers

import (
	"fazbrike-backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetItemDetails retorna os detalhes de um item específico (só ativos publicamente).
func GetItemDetails(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		itemID, err := strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}

		var item models.Item
		if err := db.Preload("User").Preload("City.State").Preload("Images", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("sort_order asc, id asc")
		}).First(&item, itemID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			return
		}

		// Não ativos: só o dono (se autenticado) pode ver
		if item.Status != "active" {
			uid, ok := c.Get("user_id")
			if !ok || uid.(uint) != item.UserID {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
				return
			}
		}

		// Legacy: single image_url with empty gallery
		if len(item.Images) == 0 && item.ImageURL != "" {
			item.Images = []models.ItemImage{{
				ItemID:    item.ID,
				URL:       item.ImageURL,
				SortOrder: 0,
			}}
		}

		enrichItemSocial(db, &item, currentViewerID(c))
		SanitizeItemPublic(&item)
		c.JSON(http.StatusOK, item)
	}
}
