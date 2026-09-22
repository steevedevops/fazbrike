package handlers

import (
	"fazbrike-backend/models"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type publicAffiliatePartner struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type publicAffiliateProduct struct {
	ID            uint                   `json:"id"`
	Title         string                 `json:"title"`
	Description   string                 `json:"description"`
	Price         float64                `json:"price"`
	OriginalPrice *float64               `json:"original_price,omitempty"`
	ImageURL      string                 `json:"image_url"`
	Category      string                 `json:"category"`
	CouponCode    string                 `json:"coupon_code,omitempty"`
	IsFeatured    bool                   `json:"is_featured"`
	Partner       publicAffiliatePartner `json:"partner"`
}

// EnsureAffiliateProductIndexes creates indexes that match the public offer
// listing and redirect access paths. PostgreSQL does not index FKs itself.
func EnsureAffiliateProductIndexes(db *gorm.DB) error {
	statements := []string{
		`CREATE INDEX IF NOT EXISTS idx_affiliate_products_partner_id ON affiliate_products (partner_id)`,
		`CREATE INDEX IF NOT EXISTS idx_affiliate_products_public ON affiliate_products (is_featured DESC, sort_order ASC, created_at DESC) WHERE is_active = TRUE`,
		`CREATE INDEX IF NOT EXISTS idx_affiliate_partners_active_slug ON affiliate_partners (slug) WHERE is_active = TRUE`,
	}
	for _, statement := range statements {
		if err := db.Exec(statement).Error; err != nil {
			return err
		}
	}
	return nil
}

// GetAffiliateProducts lists active offers without exposing their destination
// URLs or internal click counters.
func GetAffiliateProducts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var products []models.AffiliateProduct
		query := db.Model(&models.AffiliateProduct{}).
			Joins("JOIN affiliate_partners ON affiliate_partners.id = affiliate_products.partner_id").
			Preload("Partner").
			Where("affiliate_products.is_active = TRUE").
			Where("affiliate_partners.is_active = TRUE")

		if search := strings.TrimSpace(c.Query("search")); search != "" {
			like := "%" + search + "%"
			query = query.Where("affiliate_products.title ILIKE ? OR affiliate_products.description ILIKE ?", like, like)
		}
		if category := strings.TrimSpace(c.Query("category")); category != "" {
			query = query.Where("affiliate_products.category IN ?", CategorySlugsForFilter(db, category))
		}
		if partner := strings.TrimSpace(c.Query("partner")); partner != "" {
			query = query.Where("affiliate_partners.slug = ?", strings.ToLower(partner))
		}
		if c.Query("featured") == "true" {
			query = query.Where("affiliate_products.is_featured = TRUE")
		}

		switch c.Query("sort") {
		case "price_asc":
			query = query.Order("affiliate_products.price ASC")
		case "price_desc":
			query = query.Order("affiliate_products.price DESC")
		case "recent":
			query = query.Order("affiliate_products.created_at DESC")
		default:
			query = query.Order("affiliate_products.is_featured DESC, affiliate_products.sort_order ASC, affiliate_products.created_at DESC")
		}

		limit := 48
		if rawLimit := c.Query("limit"); rawLimit != "" {
			if parsed, err := strconv.Atoi(rawLimit); err == nil && parsed > 0 {
				limit = parsed
			}
		}
		if limit > 100 {
			limit = 100
		}

		if err := query.Limit(limit).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar ofertas de parceiros"})
			return
		}

		response := make([]publicAffiliateProduct, 0, len(products))
		for _, product := range products {
			response = append(response, publicAffiliateProduct{
				ID:            product.ID,
				Title:         product.Title,
				Description:   product.Description,
				Price:         product.Price,
				OriginalPrice: product.OriginalPrice,
				ImageURL:      product.ImageURL,
				Category:      product.Category,
				CouponCode:    product.CouponCode,
				IsFeatured:    product.IsFeatured,
				Partner: publicAffiliatePartner{
					ID:   product.Partner.ID,
					Name: product.Partner.Name,
					Slug: product.Partner.Slug,
				},
			})
		}
		c.JSON(http.StatusOK, response)
	}
}

// RedirectAffiliateProduct validates the stored destination on every click,
// increments its counter atomically, and then sends the visitor to the partner.
func RedirectAffiliateProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Oferta inválida"})
			return
		}

		var product models.AffiliateProduct
		if err := db.Model(&models.AffiliateProduct{}).
			Joins("JOIN affiliate_partners ON affiliate_partners.id = affiliate_products.partner_id").
			Where("affiliate_products.id = ?", id).
			Where("affiliate_products.is_active = TRUE").
			Where("affiliate_partners.is_active = TRUE").
			First(&product).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Oferta não encontrada"})
			return
		}

		if !models.IsHTTPURL(product.AffiliateURL) {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "O link desta oferta está indisponível"})
			return
		}

		if err := db.Model(&models.AffiliateProduct{}).
			Where("id = ?", product.ID).
			UpdateColumn("click_count", gorm.Expr("click_count + 1")).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível abrir esta oferta"})
			return
		}

		c.Header("Cache-Control", "no-store")
		c.Redirect(http.StatusFound, product.AffiliateURL)
	}
}
