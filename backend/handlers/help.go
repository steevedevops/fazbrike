package handlers

import (
	"fazbrike-backend/models"
	"net/http"
	"net/mail"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetHelpArticles lista as perguntas publicadas da central de ajuda, com
// filtro opcional por categoria e busca por termo.
func GetHelpArticles(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := db.Model(&models.HelpArticle{}).Where("published = ?", true)
		if category := strings.ToLower(strings.TrimSpace(c.Query("category"))); category != "" {
			query = query.Where("category = ?", category)
		}
		if term := strings.TrimSpace(c.Query("q")); term != "" {
			if utf8.RuneCountInString(term) > 100 {
				term = string([]rune(term)[:100])
			}
			like := "%" + escapeLike(term) + "%"
			query = query.Where("unaccent(title) ILIKE unaccent(?) OR unaccent(body) ILIKE unaccent(?)", like, like)
		}
		var articles []models.HelpArticle
		if err := query.Order("category ASC, position ASC, id ASC").Limit(200).Find(&articles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível carregar a central de ajuda"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"results": articles})
	}
}

// escapeLike neutraliza curingas do LIKE digitados pelo usuário.
func escapeLike(term string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(term)
}

type legalDocumentSummary struct {
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	Summary   string `json:"summary"`
	Version   string `json:"version"`
	UpdatedAt string `json:"updated_at"`
}

// GetLegalDocuments lista termos e políticas publicados (sem o conteúdo).
func GetLegalDocuments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var documents []models.LegalDocument
		if err := db.Select("slug", "title", "summary", "version", "updated_at").
			Where("published = ?", true).Order("id ASC").Find(&documents).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível carregar os documentos"})
			return
		}
		results := make([]legalDocumentSummary, 0, len(documents))
		for _, document := range documents {
			results = append(results, legalDocumentSummary{
				Slug:      document.Slug,
				Title:     document.Title,
				Summary:   document.Summary,
				Version:   document.Version,
				UpdatedAt: document.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			})
		}
		c.JSON(http.StatusOK, gin.H{"results": results})
	}
}

// GetLegalDocument devolve um documento publicado pelo slug.
func GetLegalDocument(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		slug := strings.ToLower(strings.TrimSpace(c.Param("slug")))
		var document models.LegalDocument
		if err := db.Where("slug = ? AND published = ?", slug, true).First(&document).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Documento não encontrado"})
			return
		}
		c.JSON(http.StatusOK, document)
	}
}

// CreateSupportRequest abre um chamado. Visitantes informam nome e e-mail;
// para usuários logados os dados vêm da conta.
func CreateSupportRequest(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Name    string `json:"name"`
			Email   string `json:"email"`
			Topic   string `json:"topic"`
			Subject string `json:"subject"`
			Message string `json:"message"`
			ItemID  *uint  `json:"item_id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dados do chamado inválidos"})
			return
		}
		req.Name = strings.TrimSpace(req.Name)
		req.Email = strings.ToLower(strings.TrimSpace(req.Email))
		req.Topic = strings.ToLower(strings.TrimSpace(req.Topic))
		req.Subject = strings.TrimSpace(req.Subject)
		req.Message = strings.TrimSpace(req.Message)

		request := models.SupportRequest{Status: "open"}
		if value, exists := c.Get("user_id"); exists {
			if uid, ok := value.(uint); ok {
				var user models.User
				if err := db.Select("id", "name", "email").First(&user, uid).Error; err == nil {
					request.UserID = &user.ID
					req.Name = user.Name
					req.Email = user.Email
				}
			}
		}

		if request.UserID == nil {
			if utf8.RuneCountInString(req.Name) < 2 || utf8.RuneCountInString(req.Name) > 120 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Informe seu nome"})
				return
			}
			if _, err := mail.ParseAddress(req.Email); err != nil || len(req.Email) > 254 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Informe um e-mail válido para receber a resposta"})
				return
			}
		}
		if _, ok := models.SupportRequestTopics[req.Topic]; !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Selecione o assunto do chamado"})
			return
		}
		if n := utf8.RuneCountInString(req.Subject); n < 3 || n > 120 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "O título deve ter entre 3 e 120 caracteres"})
			return
		}
		if n := utf8.RuneCountInString(req.Message); n < 10 || n > 3000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Descreva o problema com 10 a 3000 caracteres"})
			return
		}
		if req.ItemID != nil && *req.ItemID > 0 {
			var count int64
			if err := db.Model(&models.Item{}).Where("id = ?", *req.ItemID).Count(&count).Error; err == nil && count > 0 {
				request.ItemID = req.ItemID
			}
		}

		request.Name = req.Name
		request.Email = req.Email
		request.Topic = req.Topic
		request.Subject = req.Subject
		request.Message = req.Message
		if err := db.Create(&request).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível enviar o chamado"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{
			"id":      request.ID,
			"message": "Chamado enviado. Nossa equipe responde em até 2 dias úteis.",
		})
	}
}

type supportRequestRow struct {
	ID          uint    `json:"id"`
	Topic       string  `json:"topic"`
	Subject     string  `json:"subject"`
	Message     string  `json:"message"`
	Status      string  `json:"status"`
	Response    string  `json:"response"`
	RespondedAt *string `json:"responded_at"`
	CreatedAt   string  `json:"created_at"`
}

// GetMySupportRequests lista os chamados do usuário logado com a resposta da equipe.
func GetMySupportRequests(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		var requests []models.SupportRequest
		if err := db.Where("user_id = ?", uid).Order("created_at DESC").Limit(100).Find(&requests).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível carregar seus chamados"})
			return
		}
		rows := make([]supportRequestRow, 0, len(requests))
		for _, request := range requests {
			row := supportRequestRow{
				ID:        request.ID,
				Topic:     request.Topic,
				Subject:   request.Subject,
				Message:   request.Message,
				Status:    request.Status,
				Response:  request.Response,
				CreatedAt: request.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			}
			if request.RespondedAt != nil {
				value := request.RespondedAt.Format("2006-01-02T15:04:05Z07:00")
				row.RespondedAt = &value
			}
			rows = append(rows, row)
		}
		c.JSON(http.StatusOK, gin.H{"results": rows})
	}
}

// EnsureHelpSchema acrescenta as constraints de domínio das tabelas da
// central de ajuda. Idempotente.
func EnsureHelpSchema(db *gorm.DB) error {
	statements := []string{
		`CREATE INDEX IF NOT EXISTS idx_support_requests_status_created ON support_requests (status, created_at DESC)`,
		`DO $$ BEGIN
			ALTER TABLE support_requests ADD CONSTRAINT support_requests_status_check
				CHECK (status IN ('open', 'answered', 'closed'));
		EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
		`DO $$ BEGIN
			ALTER TABLE support_requests ADD CONSTRAINT support_requests_topic_check
				CHECK (topic IN ('conta', 'anuncio', 'compra', 'denuncia', 'privacidade', 'exclusao_conta', 'outro'));
		EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
	}
	for _, statement := range statements {
		if err := db.Exec(statement).Error; err != nil {
			return err
		}
	}
	return nil
}
