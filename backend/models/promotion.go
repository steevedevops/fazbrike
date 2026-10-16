package models

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Tipos de destino de um banner. O clique nunca é uma URL solta: o banner diz
// *o que* ele aponta e o backend monta a rota interna correspondente.
const (
	PromotionTargetNone     = "none"     // banner só informativo, sem clique
	PromotionTargetProfile  = "profile"  // loja/perfil do anunciante
	PromotionTargetItem     = "item"     // um anúncio do anunciante
	PromotionTargetCategory = "category" // vitrine de uma categoria
	PromotionTargetSearch   = "search"   // busca por um termo
	PromotionTargetPage     = "page"     // página fixa da plataforma
	PromotionTargetExternal = "external" // link de fora (só admin)
)

var promotionTargetTypes = map[string]struct{}{
	PromotionTargetNone:     {},
	PromotionTargetProfile:  {},
	PromotionTargetItem:     {},
	PromotionTargetCategory: {},
	PromotionTargetSearch:   {},
	PromotionTargetPage:     {},
	PromotionTargetExternal: {},
}

// PromotionAllowedPages são as páginas fixas que um banner pode apontar. Só
// entram rotas que existem **no app e no site** — uma rota que só existe num
// deles viraria tela de erro no outro.
var PromotionAllowedPages = map[string]string{
	"/novidades": "Novidades",
	"/promocoes": "Promoções",
	"/marcas":    "Marcas",
}

var promotionSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

const (
	promotionSearchMinLen = 2
	promotionSearchMaxLen = 60
)

// Promotion é um banner de campanha exibido na home do app e do site. Pode ser
// institucional (UserID nulo, criado no admin) ou de um anunciante, que escolhe
// um destino dentro da própria plataforma.
type Promotion struct {
	ID     uint  `gorm:"primaryKey" json:"id"`
	UserID *uint `gorm:"index" json:"user_id,omitempty" admin:"label:Anunciante"`

	Title    string `gorm:"type:text;not null" json:"title" admin:"label:Título"`
	Subtitle string `gorm:"type:text" json:"subtitle" admin:"label:Subtítulo"`
	ImageURL string `gorm:"type:text;not null" json:"image_url" admin:"label:URL da imagem;list:hidden"`
	CtaLabel string `gorm:"type:text" json:"cta_label" admin:"label:Texto do botão"`

	TargetType  string `gorm:"type:text;not null;default:none;index" json:"target_type" admin:"label:Tipo de destino"`
	TargetID    *uint  `gorm:"index" json:"target_id,omitempty" admin:"label:ID do destino"`
	TargetValue string `gorm:"type:text" json:"target_value" admin:"label:Valor do destino;list:hidden"`

	StartsAt  *time.Time `json:"starts_at,omitempty" admin:"label:Exibir a partir de"`
	EndsAt    *time.Time `json:"ends_at,omitempty" admin:"label:Exibir até"`
	IsActive  bool       `gorm:"not null;default:true" json:"is_active" admin:"label:Ativo"`
	SortOrder int        `gorm:"not null;default:0" json:"sort_order" admin:"label:Ordem de exibição"`

	ClickCount      int64 `gorm:"type:bigint;not null;default:0" json:"click_count" admin:"label:Cliques;readonly"`
	ImpressionCount int64 `gorm:"type:bigint;not null;default:0" json:"impression_count" admin:"label:Exibições;readonly"`

	// Freio do admin: o dono liga/desliga pelo IsActive, mas não desfaz um
	// bloqueio.
	BlockedAt     *time.Time `json:"blocked_at,omitempty" admin:"label:Bloqueado em"`
	BlockedReason string     `gorm:"type:text" json:"blocked_reason" admin:"label:Motivo do bloqueio;list:hidden"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Promotion) TableName() string { return "promotions" }

// IsOwnedBy diz se o banner pertence a um anunciante específico.
func (promotion Promotion) IsOwnedBy(userID uint) bool {
	return promotion.UserID != nil && *promotion.UserID == userID
}

func (promotion *Promotion) BeforeSave(_ *gorm.DB) error {
	promotion.Title = strings.TrimSpace(promotion.Title)
	promotion.Subtitle = strings.TrimSpace(promotion.Subtitle)
	promotion.ImageURL = strings.TrimSpace(promotion.ImageURL)
	promotion.CtaLabel = strings.TrimSpace(promotion.CtaLabel)
	promotion.TargetType = strings.ToLower(strings.TrimSpace(promotion.TargetType))
	promotion.TargetValue = strings.TrimSpace(promotion.TargetValue)
	promotion.BlockedReason = strings.TrimSpace(promotion.BlockedReason)

	if promotion.Title == "" {
		return fmt.Errorf("o título da promoção é obrigatório")
	}
	if len([]rune(promotion.Title)) > 80 {
		return fmt.Errorf("o título deve ter no máximo 80 caracteres")
	}
	if len([]rune(promotion.Subtitle)) > 160 {
		return fmt.Errorf("o subtítulo deve ter no máximo 160 caracteres")
	}
	if len([]rune(promotion.CtaLabel)) > 24 {
		return fmt.Errorf("o texto do botão deve ter no máximo 24 caracteres")
	}
	if !IsPublicImageURL(promotion.ImageURL) {
		return fmt.Errorf("a URL da imagem deve ser HTTP(S) ou um caminho de upload válido")
	}
	if promotion.StartsAt != nil && promotion.EndsAt != nil && !promotion.EndsAt.After(*promotion.StartsAt) {
		return fmt.Errorf("a data final deve ser maior que a data inicial")
	}
	return promotion.validateTarget()
}

// validateTarget checa o formato do destino. Se o alvo *existe* (anúncio ativo,
// perfil público) é decidido na hora de exibir, porque isso muda com o tempo —
// um anúncio vendido não pode invalidar a edição do banner.
func (promotion *Promotion) validateTarget() error {
	if promotion.TargetType == "" {
		// Sem destino é um estado válido: banner que só comunica algo.
		promotion.TargetType = PromotionTargetNone
	}
	if _, ok := promotionTargetTypes[promotion.TargetType]; !ok {
		return fmt.Errorf("tipo de destino inválido: %s", promotion.TargetType)
	}

	switch promotion.TargetType {
	case PromotionTargetNone:
		promotion.TargetID = nil
		promotion.TargetValue = ""

	case PromotionTargetProfile:
		if promotion.UserID == nil {
			return fmt.Errorf("um banner que leva ao perfil precisa de um anunciante")
		}
		promotion.TargetID = nil
		promotion.TargetValue = ""

	case PromotionTargetItem:
		if promotion.TargetID == nil || *promotion.TargetID == 0 {
			return fmt.Errorf("selecione o anúncio de destino")
		}
		promotion.TargetValue = ""

	case PromotionTargetCategory:
		promotion.TargetValue = strings.ToLower(promotion.TargetValue)
		if !promotionSlugPattern.MatchString(promotion.TargetValue) {
			return fmt.Errorf("selecione a categoria de destino")
		}
		promotion.TargetID = nil

	case PromotionTargetSearch:
		length := len([]rune(promotion.TargetValue))
		if length < promotionSearchMinLen || length > promotionSearchMaxLen {
			return fmt.Errorf("o termo de busca deve ter entre %d e %d caracteres", promotionSearchMinLen, promotionSearchMaxLen)
		}
		promotion.TargetID = nil

	case PromotionTargetPage:
		if _, ok := PromotionAllowedPages[promotion.TargetValue]; !ok {
			return fmt.Errorf("página de destino inválida")
		}
		promotion.TargetID = nil

	case PromotionTargetExternal:
		if !IsHTTPURL(promotion.TargetValue) {
			return fmt.Errorf("o link externo deve começar com http:// ou https://")
		}
		promotion.TargetID = nil
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
