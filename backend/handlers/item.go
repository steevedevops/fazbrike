package handlers

import (
	"fazbrike-backend/models"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateItem cria um novo item
func CreateItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}

		var req struct {
			Title       string  `json:"title"`
			Description string  `json:"description"`
			Price       float64 `json:"price"`
			Category    string  `json:"category"`
			ListingType string  `json:"listing_type"`
			Location    string  `json:"location"`
			CityID      *int64  `json:"city_id"`
			Condition   string  `json:"condition"`
			Attrs       string  `json:"attrs"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
			return
		}

		item := models.Item{
			UserID:      userID.(uint),
			Title:       strings.TrimSpace(req.Title),
			Description: strings.TrimSpace(req.Description),
			Price:       req.Price,
			Category:    strings.TrimSpace(req.Category),
			Location:    strings.TrimSpace(req.Location),
			Condition:   strings.TrimSpace(req.Condition),
			ListingType: strings.TrimSpace(req.ListingType),
			Attrs:       req.Attrs,
			Status:      "active",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}
		if item.ListingType == "" {
			item.ListingType = "item"
		}
		if item.Title == "" || item.Description == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Título e descrição são obrigatórios"})
			return
		}
		if item.Price < 0 || math.IsNaN(item.Price) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Preço inválido"})
			return
		}
		if req.CityID == nil || *req.CityID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Selecione a cidade do anúncio"})
			return
		}
		if err := ApplyCityToItem(db, &item, *req.CityID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar anúncio"})
			return
		}

		_ = db.Preload("User").Preload("City.State").First(&item, item.ID)
		SanitizeItemPublic(&item)
		c.JSON(http.StatusCreated, item)
	}
}

// GetItems lista todos os itens com filtros e ordenação
func GetItems(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var items []models.Item
		query := db.Model(&models.Item{}).Preload("User") // Carregar dados do usuário

		// Marketplace público: só anúncios ativos (ignora status do cliente)
		query = query.Where("status = ?", "active")

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

		// Filtro de Categoria (inclui subcategorias quando o slug é pai)
		if category := c.Query("category"); category != "" {
			slugs := CategorySlugsForFilter(db, category)
			query = query.Where("category IN ?", slugs)
		}

		// Filtro de tipo de anúncio
		if listingType := c.Query("listing_type"); listingType != "" {
			query = query.Where("listing_type = ?", listingType)
		}

		// Filtro de Localização (cidade catalogada ou texto legado)
		if cityID := c.Query("city_id"); cityID != "" {
			query = query.Where("city_id = ?", cityID)
		} else if stateID := c.Query("state_id"); stateID != "" {
			query = query.Where("state_id = ?", stateID)
		} else if location := c.Query("location"); location != "" {
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar anúncios"})
			return
		}
		enrichItemsSocial(db, items, currentViewerID(c))
		SanitizeItemsPublic(items)
		c.JSON(http.StatusOK, items)
	}
}

// GetUserItems lista os itens do usuário logado
func GetUserItems(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}

		var items []models.Item
		if err := db.Where("user_id = ?", userID).Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar seus anúncios"})
			return
		}
		uid := userID.(uint)
		enrichItemsSocial(db, items, &uid)
		c.JSON(http.StatusOK, items)
	}
}

// UploadItemImage faz upload de uma imagem do item (compatível; adiciona à galeria).
func UploadItemImage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		item, ok := loadOwnedItem(db, c)
		if !ok {
			return
		}

		imageURL, err := SaveSecureImage(c, "file", "uploads")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		img, err := appendItemImage(db, item.ID, imageURL)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"image_url": imageURL, "image": img})
	}
}

// UpdateItem atualiza um item existente (apenas o dono)
func UpdateItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		itemID, err := strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID do item inválido"})
			return
		}

		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}

		var item models.Item
		if err := db.First(&item, itemID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			return
		}

		if item.UserID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não pode editar este anúncio"})
			return
		}

		var req struct {
			Title       *string  `json:"title"`
			Description *string  `json:"description"`
			Price       *float64 `json:"price"`
			Category    *string  `json:"category"`
			ListingType *string  `json:"listing_type"`
			Location    *string  `json:"location"`
			CityID      *int64   `json:"city_id"`
			Condition   *string  `json:"condition"`
			Attrs       *string  `json:"attrs"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Title != nil {
			title := strings.TrimSpace(*req.Title)
			if title == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Título é obrigatório"})
				return
			}
			item.Title = title
		}
		if req.Description != nil {
			desc := strings.TrimSpace(*req.Description)
			if desc == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Descrição é obrigatória"})
				return
			}
			item.Description = desc
		}
		if req.Price != nil {
			if *req.Price < 0 || math.IsNaN(*req.Price) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Preço inválido"})
				return
			}
			item.Price = *req.Price
		}
		if req.Category != nil {
			item.Category = strings.TrimSpace(*req.Category)
		}
		if req.Condition != nil {
			item.Condition = strings.TrimSpace(*req.Condition)
		}
		if req.ListingType != nil {
			lt := strings.TrimSpace(*req.ListingType)
			if lt == "" {
				lt = "item"
			}
			item.ListingType = lt
		}
		if req.Attrs != nil {
			item.Attrs = *req.Attrs
		}
		if req.CityID != nil {
			if *req.CityID <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Selecione a cidade do anúncio"})
				return
			}
			if err := ApplyCityToItem(db, &item, *req.CityID); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
		} else if req.Location != nil && item.CityID == nil {
			// Legacy free-text only when no catalog city is set
			item.Location = strings.TrimSpace(*req.Location)
		}
		item.UpdatedAt = time.Now()

		if err := db.Save(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar item"})
			return
		}

		if err := db.Preload("User").Preload("City.State").First(&item, item.ID).Error; err != nil {
			c.JSON(http.StatusOK, item)
			return
		}
		SanitizeItemPublic(&item)
		c.JSON(http.StatusOK, item)
	}
}

// UpdateItemStatus sets item status (active|reserved|sold|inactive) for the owner.
// Optionally records the seller's sale-feedback survey (channel/final price/comment).
func UpdateItemStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		itemID, err := strconv.Atoi(idParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID do item inválido"})
			return
		}
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		var req struct {
			Status     string   `json:"status"`
			Channel    string   `json:"channel"`
			FinalPrice *float64 `json:"final_price"`
			Comment    string   `json:"comment"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		status := strings.TrimSpace(req.Status)
		if status != "active" && status != "reserved" && status != "sold" && status != "inactive" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status inválido"})
			return
		}
		channel := strings.TrimSpace(req.Channel)
		if channel != "" && channel != "platform" && channel != "off_platform" && channel != "not_sold" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Canal de venda inválido"})
			return
		}
		var item models.Item
		if err := db.First(&item, itemID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
			return
		}
		if item.UserID != userID.(uint) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Você não pode alterar este anúncio"})
			return
		}
		item.Status = status
		now := time.Now()
		item.UpdatedAt = now
		if status == "sold" {
			item.SoldAt = &now
		} else {
			item.SoldAt = nil
		}
		if err := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Save(&item).Error; err != nil {
				return err
			}
			if channel != "" {
				feedback := models.ItemSaleFeedback{
					ItemID:     item.ID,
					UserID:     userID.(uint),
					Channel:    channel,
					FinalPrice: req.FinalPrice,
					Comment:    strings.TrimSpace(req.Comment),
					CreatedAt:  now,
				}
				if err := tx.Create(&feedback).Error; err != nil {
					return err
				}
			}
			return nil
		}); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar status"})
			return
		}
		_ = db.Preload("User").First(&item, item.ID)
		c.JSON(http.StatusOK, item)
	}
}
