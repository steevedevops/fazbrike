package handlers

import (
	"fazbrike-backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetCategories lists active categories. Optional ?listing_type=item|vehicle|property
// Returns nested tree (top-level with children).
func GetCategories(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		listingType := c.Query("listing_type")
		var cats []models.Category
		q := db.Model(&models.Category{}).Where("is_active = ? AND parent_id IS NULL", true)
		if listingType != "" {
			q = q.Where("listing_type = ? OR listing_type = ?", listingType, "all")
		}
		if err := q.Order("sort_order asc, name asc").
			Preload("Children", func(db *gorm.DB) *gorm.DB {
				child := db.Where("is_active = ?", true).Order("sort_order asc, name asc")
				if listingType != "" {
					child = child.Where("listing_type = ? OR listing_type = ?", listingType, "all")
				}
				return child
			}).
			Find(&cats).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar categorias"})
			return
		}
		c.JSON(http.StatusOK, cats)
	}
}

// CategorySlugsForFilter returns the slug plus all active child slugs (for parent filters).
func CategorySlugsForFilter(db *gorm.DB, slug string) []string {
	if slug == "" {
		return nil
	}
	slugs := []string{slug}
	var cat models.Category
	if err := db.Where("slug = ?", slug).First(&cat).Error; err != nil {
		return slugs
	}
	var children []models.Category
	if err := db.Where("parent_id = ? AND is_active = ?", cat.ID, true).Find(&children).Error; err != nil {
		return slugs
	}
	for _, ch := range children {
		slugs = append(slugs, ch.Slug)
	}
	return slugs
}
