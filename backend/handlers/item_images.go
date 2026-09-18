package handlers

import (
	"fazbrike-backend/models"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const maxItemImages = 8

func nextImageSortOrder(db *gorm.DB, itemID uint) (int, error) {
	var maxOrder *int
	err := db.Model(&models.ItemImage{}).
		Where("item_id = ?", itemID).
		Select("MAX(sort_order)").
		Scan(&maxOrder).Error
	if err != nil {
		return 0, err
	}
	if maxOrder == nil {
		return 0, nil
	}
	return *maxOrder + 1, nil
}

func countItemImages(db *gorm.DB, itemID uint) (int64, error) {
	var n int64
	err := db.Model(&models.ItemImage{}).Where("item_id = ?", itemID).Count(&n).Error
	return n, err
}

func syncItemCover(db *gorm.DB, itemID uint) error {
	var first models.ItemImage
	err := db.Where("item_id = ?", itemID).Order("sort_order asc, id asc").First(&first).Error
	cover := ""
	if err == nil {
		cover = first.URL
	} else if err != gorm.ErrRecordNotFound {
		return err
	}
	return db.Model(&models.Item{}).Where("id = ?", itemID).Updates(map[string]interface{}{
		"image_url":  cover,
		"updated_at": time.Now(),
	}).Error
}

func loadOwnedItem(db *gorm.DB, c *gin.Context) (*models.Item, bool) {
	idParam := c.Param("id")
	itemID, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID do item inválido"})
		return nil, false
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
		return nil, false
	}
	var item models.Item
	if err := db.First(&item, itemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
		return nil, false
	}
	if item.UserID != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Não autorizado a atualizar este anúncio"})
		return nil, false
	}
	return &item, true
}

func appendItemImage(db *gorm.DB, itemID uint, imageURL string) (*models.ItemImage, error) {
	n, err := countItemImages(db, itemID)
	if err != nil {
		return nil, err
	}
	if n >= maxItemImages {
		return nil, fmt.Errorf("limite de %d fotos por anúncio", maxItemImages)
	}
	order, err := nextImageSortOrder(db, itemID)
	if err != nil {
		return nil, err
	}
	img := models.ItemImage{
		ItemID:    itemID,
		URL:       imageURL,
		SortOrder: order,
		CreatedAt: time.Now(),
	}
	if err := db.Create(&img).Error; err != nil {
		return nil, err
	}
	if err := syncItemCover(db, itemID); err != nil {
		return nil, err
	}
	return &img, nil
}

// UploadItemImages accepts one or more files (fields "files" and/or "file").
func UploadItemImages(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		item, ok := loadOwnedItem(db, c)
		if !ok {
			return
		}

		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formulário multipart inválido"})
			return
		}

		headers := form.File["files"]
		if len(headers) == 0 {
			headers = form.File["file"]
		}
		if len(headers) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nenhum arquivo enviado"})
			return
		}

		current, err := countItemImages(db, item.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao verificar fotos"})
			return
		}
		if current+int64(len(headers)) > maxItemImages {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Máximo de %d fotos. Você tem %d e tentou enviar %d.", maxItemImages, current, len(headers)),
			})
			return
		}

		created := make([]models.ItemImage, 0, len(headers))
		for _, fh := range headers {
			url, err := SaveSecureImageHeader(fh, "uploads")
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			img, err := appendItemImage(db, item.ID, url)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			created = append(created, *img)
		}

		var cover models.Item
		_ = db.Select("image_url").First(&cover, item.ID)
		c.JSON(http.StatusOK, gin.H{
			"images":    created,
			"image_url": cover.ImageURL,
		})
	}
}

// DeleteItemImage removes one gallery photo (owner only).
func DeleteItemImage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		item, ok := loadOwnedItem(db, c)
		if !ok {
			return
		}
		imageID, err := strconv.Atoi(c.Param("imageId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID da imagem inválido"})
			return
		}
		var img models.ItemImage
		if err := db.Where("id = ? AND item_id = ?", imageID, item.ID).First(&img).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Foto não encontrada"})
			return
		}
		if err := db.Delete(&img).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao remover foto"})
			return
		}
		if err := syncItemCover(db, item.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar capa"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// BackfillItemImages copies legacy item.image_url into item_images when empty.
func BackfillItemImages(db *gorm.DB) error {
	var items []models.Item
	if err := db.Where("image_url <> '' AND image_url IS NOT NULL").Find(&items).Error; err != nil {
		return err
	}
	for _, item := range items {
		var n int64
		if err := db.Model(&models.ItemImage{}).Where("item_id = ?", item.ID).Count(&n).Error; err != nil {
			return err
		}
		if n > 0 {
			continue
		}
		img := models.ItemImage{
			ItemID:    item.ID,
			URL:       item.ImageURL,
			SortOrder: 0,
			CreatedAt: time.Now(),
		}
		if err := db.Create(&img).Error; err != nil {
			return err
		}
	}
	return nil
}
