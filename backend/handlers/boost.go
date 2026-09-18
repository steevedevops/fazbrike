package handlers

import (
	"fazbrike-backend/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RequestBoost registra uma solicitação de impulsionamento (destaque) para um
// anúncio do próprio dono. Sem cobrança: fica pendente até um admin aprovar
// manualmente pelo painel admin.
func RequestBoost(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		item, ok := loadOwnedItem(db, c)
		if !ok {
			return
		}

		var existing models.Boost
		err := db.Where("item_id = ? AND status = ?", item.ID, "pending").First(&existing).Error
		if err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Já existe uma solicitação de impulsionamento pendente para este anúncio"})
			return
		}
		if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao verificar impulsionamentos"})
			return
		}

		boost := models.Boost{
			ItemID:      item.ID,
			UserID:      item.UserID,
			Status:      "pending",
			RequestedAt: time.Now(),
		}
		if err := db.Create(&boost).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao solicitar impulsionamento"})
			return
		}

		c.JSON(http.StatusCreated, boost)
	}
}
