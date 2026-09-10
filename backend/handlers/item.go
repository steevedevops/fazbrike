package handlers

import (
	"fazbrike-backend/models"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateItem cria um novo item
func CreateItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		var item models.Item
		if err := c.ShouldBindJSON(&item); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		item.UserID = userID.(uint) // Middleware sets it as uint
		item.CreatedAt = time.Now()
		item.UpdatedAt = time.Now()

		if err := db.Create(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create item"})
			return
		}

		c.JSON(http.StatusCreated, item)
	}
}

// GetItems lista todos os itens com filtros e ordenação
func GetItems(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var items []models.Item
		query := db.Model(&models.Item{}).Preload("User") // Carregar dados do usuário

		// Filtro de busca (título ou descrição)
		if search := c.Query("search"); search != "" {
			searchLike := "%" + search + "%"
			query = query.Where("title LIKE ? OR description LIKE ?", searchLike, searchLike)
		}

		// Filtro de preço mínimo
		if minPrice := c.Query("min_price"); minPrice != "" {
			query = query.Where("price >= ?", minPrice)
		}

		// Filtro de preço máximo
		if maxPrice := c.Query("max_price"); maxPrice != "" {
			query = query.Where("price <= ?", maxPrice)
		}

		// Filtro de Categoria
		if category := c.Query("category"); category != "" {
			query = query.Where("category = ?", category)
		}

		// Filtro de Localização
		if location := c.Query("location"); location != "" {
			query = query.Where("location LIKE ?", "%"+location+"%")
		}

		// Filtro de Condição
		if condition := c.Query("condition"); condition != "" {
			query = query.Where("condition = ?", condition)
		}

		// Ordenação
		sortBy := c.Query("sort_by")
		order := c.Query("order")
		if order != "desc" {
			order = "asc"
		}

		switch sortBy {
		case "price":
			query = query.Order("price " + order)
		case "date":
			query = query.Order("created_at " + order)
		default:
			query = query.Order("created_at desc") // Padrão: mais recentes primeiro
		}

		if err := query.Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch items"})
			return
		}
		c.JSON(http.StatusOK, items)
	}
}

// GetUserItems lista os itens do usuário logado
func GetUserItems(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		var items []models.Item
		if err := db.Where("user_id = ?", userID).Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user items"})
			return
		}
		c.JSON(http.StatusOK, items)
	}
}

// UploadItemImage faz upload da imagem do item
func UploadItemImage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		itemID, err := strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item ID"})
			return
		}

		// Verificar se o item existe e pertence ao usuário
		userID, _ := c.Get("user_id")
		var item models.Item
		if err := db.First(&item, itemID).Error; err != nil {
			fmt.Printf("Item not found: ID %d\n", itemID) // Debug log
			c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
			return
		}

		if item.UserID != userID.(uint) {
			fmt.Printf("Unauthorized: User %v tries to update Item %d (Owner: %d)\n", userID, itemID, item.UserID) // Debug log
			c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this item"})
			return
		}

		// Processar arquivo
		file, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
			return
		}

		// Criar diretório de uploads se não existir
		uploadDir := "uploads"
		if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
			os.Mkdir(uploadDir, 0755)
		}

		// Gerar nome único para o arquivo
		filename := fmt.Sprintf("%d_%d_%s", item.ID, time.Now().Unix(), filepath.Base(file.Filename))
		filepath := filepath.Join(uploadDir, filename)

		if err := c.SaveUploadedFile(file, filepath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// Atualizar URL da imagem no banco
		imageURL := fmt.Sprintf("/api/uploads/%s", filename)
		item.ImageURL = imageURL
		db.Save(&item)

		c.JSON(http.StatusOK, gin.H{"image_url": imageURL})
	}
}
