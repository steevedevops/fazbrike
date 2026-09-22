package models

import (
	"fmt"
	"math"
	"strings"
	"time"

	"gorm.io/gorm"
)

// AffiliateProduct is an externally purchased offer promoted by Fazbrike.
// AffiliateURL is intentionally omitted by public handlers, which expose only
// the tracked redirect endpoint.
type AffiliateProduct struct {
	ID            uint             `gorm:"primaryKey" json:"id"`
	PartnerID     uint             `gorm:"not null;index" json:"partner_id" admin:"label:Parceiro"`
	Partner       AffiliatePartner `gorm:"foreignKey:PartnerID" json:"-"`
	Title         string           `gorm:"type:text;not null" json:"title" admin:"label:Título"`
	Description   string           `gorm:"type:text" json:"description" admin:"label:Descrição;list:hidden"`
	Price         float64          `gorm:"type:numeric(12,2);not null" json:"price" admin:"label:Preço atual"`
	OriginalPrice *float64         `gorm:"type:numeric(12,2)" json:"original_price,omitempty" admin:"label:Preço original"`
	ImageURL      string           `gorm:"type:text;not null" json:"image_url" admin:"label:URL da imagem;list:hidden"`
	AffiliateURL  string           `gorm:"type:text;not null" json:"affiliate_url" admin:"label:Link afiliado;list:hidden"`
	Category      string           `gorm:"type:text;index" json:"category" admin:"label:Categoria"`
	CouponCode    string           `gorm:"type:text" json:"coupon_code" admin:"label:Cupom"`
	IsFeatured    bool             `gorm:"not null;default:false" json:"is_featured" admin:"label:Destaque"`
	IsActive      bool             `gorm:"not null;default:true" json:"is_active" admin:"label:Ativo"`
	SortOrder     int              `gorm:"not null;default:0" json:"sort_order" admin:"label:Ordem de exibição"`
	ClickCount    int64            `gorm:"type:bigint;not null;default:0" json:"click_count" admin:"label:Cliques;readonly"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
}

func (AffiliateProduct) TableName() string { return "affiliate_products" }

func (product *AffiliateProduct) BeforeSave(_ *gorm.DB) error {
	product.Title = strings.TrimSpace(product.Title)
	product.Description = strings.TrimSpace(product.Description)
	product.ImageURL = strings.TrimSpace(product.ImageURL)
	product.AffiliateURL = strings.TrimSpace(product.AffiliateURL)
	product.Category = strings.TrimSpace(product.Category)
	product.CouponCode = strings.TrimSpace(product.CouponCode)

	if product.PartnerID == 0 {
		return fmt.Errorf("selecione o parceiro da oferta")
	}
	if product.Title == "" {
		return fmt.Errorf("o título da oferta é obrigatório")
	}
	if product.Price < 0 || math.IsNaN(product.Price) || math.IsInf(product.Price, 0) {
		return fmt.Errorf("o preço da oferta é inválido")
	}
	if product.OriginalPrice != nil {
		if *product.OriginalPrice < product.Price || math.IsNaN(*product.OriginalPrice) || math.IsInf(*product.OriginalPrice, 0) {
			return fmt.Errorf("o preço original deve ser igual ou maior que o preço atual")
		}
	}
	if !isAffiliateImageURL(product.ImageURL) {
		return fmt.Errorf("a URL da imagem deve ser HTTP(S) ou um caminho de upload válido")
	}
	if !IsHTTPURL(product.AffiliateURL) {
		return fmt.Errorf("o link afiliado deve começar com http:// ou https://")
	}
	return nil
}

func isAffiliateImageURL(raw string) bool {
	if IsHTTPURL(raw) {
		return true
	}
	return strings.HasPrefix(raw, "/api/uploads/") || strings.HasPrefix(raw, "/uploads/")
}
