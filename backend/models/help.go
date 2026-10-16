package models

import (
	"fmt"
	"strings"
	"time"
	"unicode/utf8"

	"gorm.io/gorm"
)

// Categorias da central de ajuda. O site e o app usam o slug para agrupar as
// perguntas; o rótulo exibido fica nos clientes.
var HelpArticleCategories = map[string]struct{}{
	"conta":       {},
	"anuncios":    {},
	"compras":     {},
	"seguranca":   {},
	"denuncias":   {},
	"privacidade": {},
}

// HelpArticle é uma pergunta frequente da central de ajuda, editável no admin.
type HelpArticle struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Category  string    `gorm:"type:text;not null;index:idx_help_articles_listing,priority:2" json:"category" admin:"label:Categoria"`
	Title     string    `gorm:"type:text;not null" json:"title" admin:"label:Pergunta"`
	Body      string    `gorm:"type:text;not null" json:"body" admin:"label:Resposta;form:textarea"`
	Position  int       `gorm:"not null;default:0;index:idx_help_articles_listing,priority:3" json:"position" admin:"label:Ordem"`
	Published bool      `gorm:"not null;default:true;index:idx_help_articles_listing,priority:1" json:"published" admin:"label:Publicado"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (article *HelpArticle) BeforeSave(_ *gorm.DB) error {
	article.Category = strings.ToLower(strings.TrimSpace(article.Category))
	article.Title = strings.TrimSpace(article.Title)
	article.Body = strings.TrimSpace(article.Body)
	if _, ok := HelpArticleCategories[article.Category]; !ok {
		return fmt.Errorf("categoria de ajuda inválida: %s", article.Category)
	}
	if article.Title == "" || article.Body == "" {
		return fmt.Errorf("pergunta e resposta são obrigatórias")
	}
	if utf8.RuneCountInString(article.Title) > 200 {
		return fmt.Errorf("a pergunta deve ter no máximo 200 caracteres")
	}
	return nil
}

// Slugs fixos dos documentos legais. As rotas do site e do app apontam para
// eles, então não devem ser renomeados.
const (
	LegalSlugTerms   = "termos-de-uso"
	LegalSlugPrivacy = "politica-de-privacidade"
	LegalSlugRules   = "regras-de-publicacao"
	LegalSlugCookies = "politica-de-cookies"
)

// LegalDocument guarda termos e políticas publicados no site e no app.
// Content usa um markdown simples: "## " para seção, "- " para item de lista
// e linha em branco separando parágrafos.
type LegalDocument struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Slug      string    `gorm:"type:text;uniqueIndex;not null" json:"slug" admin:"label:Identificador (URL)"`
	Title     string    `gorm:"type:text;not null" json:"title" admin:"label:Título"`
	Summary   string    `gorm:"type:text" json:"summary" admin:"label:Resumo"`
	Content   string    `gorm:"type:text;not null" json:"content" admin:"label:Conteúdo;form:textarea;list:hidden"`
	Version   string    `gorm:"type:text;not null;default:'1.0'" json:"version" admin:"label:Versão"`
	Published bool      `gorm:"not null;default:true" json:"published" admin:"label:Publicado"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (document *LegalDocument) BeforeSave(_ *gorm.DB) error {
	document.Slug = strings.ToLower(strings.TrimSpace(document.Slug))
	document.Title = strings.TrimSpace(document.Title)
	document.Version = strings.TrimSpace(document.Version)
	if document.Slug == "" || document.Title == "" || strings.TrimSpace(document.Content) == "" {
		return fmt.Errorf("identificador, título e conteúdo são obrigatórios")
	}
	if document.Version == "" {
		document.Version = "1.0"
	}
	return nil
}

// Assuntos aceitos no formulário "Fale com a gente".
var SupportRequestTopics = map[string]struct{}{
	"conta":          {},
	"anuncio":        {},
	"compra":         {},
	"denuncia":       {},
	"privacidade":    {},
	"exclusao_conta": {},
	"outro":          {},
}

// SupportRequest é um chamado aberto pela central de ajuda. A equipe responde
// pelo admin (campo Response) e o usuário logado acompanha em "Meus chamados".
type SupportRequest struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	UserID      *uint      `gorm:"index" json:"user_id,omitempty" admin:"label:Usuário"`
	User        *User      `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"-"`
	Name        string     `gorm:"type:text;not null" json:"name" admin:"label:Nome"`
	Email       string     `gorm:"type:text;not null;index" json:"email" admin:"label:E-mail"`
	Topic       string     `gorm:"type:text;not null" json:"topic" admin:"label:Assunto"`
	Subject     string     `gorm:"type:text;not null" json:"subject" admin:"label:Título"`
	Message     string     `gorm:"type:text;not null" json:"message" admin:"label:Mensagem;form:textarea"`
	ItemID      *uint      `gorm:"index" json:"item_id,omitempty" admin:"label:Anúncio relacionado"`
	Status      string     `gorm:"type:text;not null;default:open;index" json:"status" admin:"label:Status"`
	Response    string     `gorm:"type:text" json:"response" admin:"label:Resposta ao usuário;form:textarea"`
	RespondedAt *time.Time `json:"responded_at,omitempty" admin:"label:Respondido em"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (request *SupportRequest) BeforeSave(_ *gorm.DB) error {
	request.Status = strings.ToLower(strings.TrimSpace(request.Status))
	request.Response = strings.TrimSpace(request.Response)
	switch request.Status {
	case "":
		request.Status = "open"
	case "open", "answered", "closed":
	default:
		return fmt.Errorf("status de chamado inválido: %s", request.Status)
	}
	// Resposta preenchida pelo admin marca o chamado como respondido.
	if request.Response != "" {
		if request.Status == "open" {
			request.Status = "answered"
		}
		if request.RespondedAt == nil {
			now := time.Now()
			request.RespondedAt = &now
		}
	}
	return nil
}
