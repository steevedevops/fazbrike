package models

import (
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Promotion é um banner de campanha exibido no slider da home do app. É
// conteúdo editorial cadastrado no admin — diferente de AffiliateProduct, que
// é uma oferta de produto de parceiro.
type Promotion struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Title     string     `gorm:"type:text;not null" json:"title" admin:"label:Título"`
	Subtitle  string     `gorm:"type:text" json:"subtitle" admin:"label:Subtítulo"`
	ImageURL  string     `gorm:"type:text;not null" json:"image_url" admin:"label:URL da imagem;list:hidden"`
	LinkURL   string     `gorm:"type:text" json:"link_url" admin:"label:Destino;list:hidden"`
	CtaLabel  string     `gorm:"type:text" json:"cta_label" admin:"label:Texto do botão"`
	StartsAt  *time.Time `json:"starts_at,omitempty" admin:"label:Exibir a partir de"`
	EndsAt    *time.Time `json:"ends_at,omitempty" admin:"label:Exibir até"`
	IsActive  bool       `gorm:"not null;default:true" json:"is_active" admin:"label:Ativo"`
	SortOrder int        `gorm:"not null;default:0" json:"sort_order" admin:"label:Ordem de exibição"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (Promotion) TableName() string { return "promotions" }

func (promotion *Promotion) BeforeSave(_ *gorm.DB) error {
	promotion.Title = strings.TrimSpace(promotion.Title)
	promotion.Subtitle = strings.TrimSpace(promotion.Subtitle)
	promotion.ImageURL = strings.TrimSpace(promotion.ImageURL)
	promotion.LinkURL = strings.TrimSpace(promotion.LinkURL)
	promotion.CtaLabel = strings.TrimSpace(promotion.CtaLabel)

	if promotion.Title == "" {
		return fmt.Errorf("o título da promoção é obrigatório")
	}
	if len([]rune(promotion.Title)) > 80 {
		return fmt.Errorf("o título deve ter no máximo 80 caracteres")
	}
	if len([]rune(promotion.Subtitle)) > 160 {
		return fmt.Errorf("o subtítulo deve ter no máximo 160 caracteres")
	}
	if !IsPublicImageURL(promotion.ImageURL) {
		return fmt.Errorf("a URL da imagem deve ser HTTP(S) ou um caminho de upload válido")
	}
	// Rota interna ("/categoria/eletronicos") ou link http(s) — nunca outro
	// esquema, que abriria portas para javascript:/data: no app.
	if promotion.LinkURL != "" && !strings.HasPrefix(promotion.LinkURL, "/") && !IsHTTPURL(promotion.LinkURL) {
		return fmt.Errorf("o destino deve ser uma rota interna (/...) ou uma URL http(s)")
	}
	if promotion.StartsAt != nil && promotion.EndsAt != nil && !promotion.EndsAt.After(*promotion.StartsAt) {
		return fmt.Errorf("a data final deve ser maior que a data inicial")
	}
	return nil
}

// IsPublicImageURL aceita imagem hospedada fora (http/https) ou servida pelo
// próprio backend em /api/uploads.
func IsPublicImageURL(raw string) bool {
	value := strings.TrimSpace(raw)
	if IsHTTPURL(value) {
		return true
	}
	return strings.HasPrefix(value, "/api/uploads/") || strings.HasPrefix(value, "/uploads/")
}
