package handlers

import (
	"fazbrike-backend/config"
	"fazbrike-backend/models"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const (
	promotionListLimit       = 8
	promotionImpressionBatch = 20
)

// promotionTarget é o destino já resolvido: o app e o site só navegam para
// `route`, sem montar rota a partir de ids. `external_url` só vem preenchido
// quando o banner aponta para fora da plataforma.
type promotionTarget struct {
	Type        string `json:"type"`
	Route       string `json:"route,omitempty"`
	Label       string `json:"label,omitempty"`
	ExternalURL string `json:"external_url,omitempty"`
}

type publicPromotion struct {
	ID       uint            `json:"id"`
	Title    string          `json:"title"`
	Subtitle string          `json:"subtitle,omitempty"`
	ImageURL string          `json:"image_url"`
	CtaLabel string          `json:"cta_label,omitempty"`
	Target   promotionTarget `json:"target"`
}

// ownerPromotion acrescenta ao banner o que só interessa a quem o criou:
// métricas, estado e o motivo de ele não estar aparecendo.
type ownerPromotion struct {
	publicPromotion
	TargetType      string     `json:"target_type"`
	TargetID        *uint      `json:"target_id,omitempty"`
	TargetValue     string     `json:"target_value,omitempty"`
	IsActive        bool       `json:"is_active"`
	IsVisible       bool       `json:"is_visible"`
	UnavailableFor  string     `json:"unavailable_for,omitempty"`
	ClickCount      int64      `json:"click_count"`
	ImpressionCount int64      `json:"impression_count"`
	StartsAt        *time.Time `json:"starts_at,omitempty"`
	EndsAt          *time.Time `json:"ends_at,omitempty"`
	BlockedReason   string     `json:"blocked_reason,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// EnsurePromotionIndexes cobre as consultas do carrossel (institucionais e por
// anunciante) e a tela "minhas promoções". FK não é indexada sozinha no Postgres.
func EnsurePromotionIndexes(db *gorm.DB) error {
	statements := []string{
		`CREATE INDEX IF NOT EXISTS idx_promotions_public ON promotions (sort_order ASC, created_at DESC) WHERE is_active = TRUE`,
		`CREATE INDEX IF NOT EXISTS idx_promotions_user_id ON promotions (user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_promotions_live ON promotions (user_id) WHERE is_active = TRUE AND blocked_at IS NULL`,
	}
	for _, statement := range statements {
		if err := db.Exec(statement).Error; err != nil {
			return err
		}
	}
	return nil
}

// MigratePromotionLinks converte o antigo `link_url` de texto livre em destino
// tipado. Idempotente: roda no boot e só toca em linhas que ainda não têm
// destino definido.
func MigratePromotionLinks(db *gorm.DB) error {
	if db.Migrator().HasColumn(&models.Promotion{}, "link_url") {
		legacy := []string{
			`UPDATE promotions SET target_type = 'external', target_value = link_url
			   WHERE link_url ~* '^https?://' AND COALESCE(target_value, '') = ''`,
			`UPDATE promotions SET target_type = 'page', target_value = link_url
			   WHERE link_url IN ('/novidades', '/promocoes', '/marcas') AND COALESCE(target_value, '') = ''`,
			// Rota interna fora da whitelist não existe nos dois clientes: cai
			// numa página que existe em ambos, em vez de virar clique quebrado.
			`UPDATE promotions SET target_type = 'page', target_value = '/novidades'
			   WHERE link_url LIKE '/%' AND link_url NOT IN ('/novidades', '/promocoes', '/marcas') AND COALESCE(target_value, '') = ''`,
			`ALTER TABLE promotions DROP COLUMN IF EXISTS link_url`,
		}
		for _, statement := range legacy {
			if err := db.Exec(statement).Error; err != nil {
				return err
			}
		}
	}

	// Banner cadastrado sem link nenhum continua no ar, só sem clique. Roda
	// sempre: cobre linhas criadas antes de o tipo "none" existir.
	return db.Exec(`UPDATE promotions SET target_type = 'none'
		WHERE target_type = 'page' AND COALESCE(target_value, '') = ''`).Error
}

// resolvePromotionTarget monta a rota interna do banner. O segundo retorno é o
// motivo de o destino estar indisponível — nesse caso o banner sai do ar
// sozinho, em vez de levar alguém para um 404.
func resolvePromotionTarget(db *gorm.DB, promotion models.Promotion) (promotionTarget, string) {
	target := promotionTarget{Type: promotion.TargetType}

	switch promotion.TargetType {
	case models.PromotionTargetNone:
		// Banner informativo: aparece normalmente, só não é clicável.
		return target, ""

	case models.PromotionTargetProfile:
		if promotion.UserID == nil {
			return target, "Este banner não tem anunciante definido."
		}
		var profile models.UserProfile
		if err := db.Where("user_id = ?", *promotion.UserID).First(&profile).Error; err != nil {
			return target, "Perfil do anunciante não encontrado."
		}
		if !profile.IsPublic {
			return target, "Seu perfil está privado: deixe-o público para o banner aparecer."
		}
		var owner models.User
		if err := db.Select("id", "name").First(&owner, *promotion.UserID).Error; err != nil {
			return target, "Perfil do anunciante não encontrado."
		}
		target.Route = fmt.Sprintf("/usuario/%d", *promotion.UserID)
		target.Label = owner.Name

	case models.PromotionTargetItem:
		if promotion.TargetID == nil {
			return target, "Selecione o anúncio de destino."
		}
		var item models.Item
		if err := db.Select("id", "user_id", "title", "status").First(&item, *promotion.TargetID).Error; err != nil {
			return target, "O anúncio de destino não existe mais."
		}
		if promotion.UserID != nil && item.UserID != *promotion.UserID {
			return target, "O anúncio de destino não é seu."
		}
		if item.Status != "active" {
			return target, "O anúncio de destino não está mais ativo."
		}
		target.Route = fmt.Sprintf("/produto/%d", item.ID)
		target.Label = item.Title

	case models.PromotionTargetCategory:
		var category models.Category
		if err := db.Select("id", "slug", "name").Where("slug = ?", promotion.TargetValue).First(&category).Error; err != nil {
			return target, "A categoria de destino não existe mais."
		}
		target.Route = "/categoria/" + category.Slug
		target.Label = category.Name

	case models.PromotionTargetSearch:
		target.Route = "/buscar?q=" + url.QueryEscape(promotion.TargetValue)
		target.Label = promotion.TargetValue

	case models.PromotionTargetPage:
		label, ok := models.PromotionAllowedPages[promotion.TargetValue]
		if !ok {
			return target, "Página de destino inválida."
		}
		target.Route = promotion.TargetValue
		target.Label = label

	case models.PromotionTargetExternal:
		if !models.IsHTTPURL(promotion.TargetValue) {
			return target, "O link externo é inválido."
		}
		target.ExternalURL = promotion.TargetValue
		if parsed, err := url.Parse(promotion.TargetValue); err == nil {
			target.Label = parsed.Hostname()
		}

	default:
		return target, "Tipo de destino desconhecido."
	}

	return target, ""
}

func promotionIsLive(promotion models.Promotion, now time.Time) bool {
	if !promotion.IsActive || promotion.BlockedAt != nil {
		return false
	}
	if promotion.StartsAt != nil && promotion.StartsAt.After(now) {
		return false
	}
	if promotion.EndsAt != nil && !promotion.EndsAt.After(now) {
		return false
	}
	return true
}

// GetPromotions monta o carrossel: primeiro as campanhas da casa, na ordem
// definida no admin; depois as dos anunciantes, no máximo uma por anunciante e
// em ordem sorteada, para ninguém dominar a home.
func GetPromotions(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit := promotionListLimit
		if raw := c.Query("limit"); raw != "" {
			if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
				limit = parsed
			}
		}
		if limit > 20 {
			limit = 20
		}

		now := time.Now()
		window := `is_active = TRUE AND blocked_at IS NULL
			AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?)`

		var house []models.Promotion
		if err := db.Where("user_id IS NULL AND "+window, now, now).
			Order("sort_order ASC, created_at DESC").
			Limit(limit).
			Find(&house).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar promoções"})
			return
		}

		var sellers []models.Promotion
		if err := db.Raw(`
			SELECT * FROM (
				SELECT DISTINCT ON (user_id) * FROM promotions
				WHERE user_id IS NOT NULL AND is_active = TRUE AND blocked_at IS NULL
					AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?)
				ORDER BY user_id, random()
			) sorteadas
			ORDER BY random()
			LIMIT ?`, now, now, limit).Scan(&sellers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar promoções"})
			return
		}

		out := make([]publicPromotion, 0, limit)
		for _, promotion := range append(house, sellers...) {
			if len(out) >= limit {
				break
			}
			target, unavailable := resolvePromotionTarget(db, promotion)
			if unavailable != "" {
				continue
			}
			out = append(out, publicPromotion{
				ID:       promotion.ID,
				Title:    promotion.Title,
				Subtitle: promotion.Subtitle,
				ImageURL: promotion.ImageURL,
				CtaLabel: promotion.CtaLabel,
				Target:   target,
			})
		}
		c.JSON(http.StatusOK, out)
	}
}

// ClickPromotion conta o clique e devolve o destino resolvido na hora, para o
// cliente navegar internamente. Não é um redirect HTTP de propósito: o app
// precisa do caminho para empurrar na própria pilha de telas.
func ClickPromotion(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.ParseUint(c.Param("id"), 10, 64)
		if err != nil || id == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Promoção inválida"})
			return
		}

		var promotion models.Promotion
		if err := db.First(&promotion, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Promoção não encontrada"})
			return
		}
		if !promotionIsLive(promotion, time.Now()) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Esta promoção não está mais disponível"})
			return
		}

		target, unavailable := resolvePromotionTarget(db, promotion)
		if unavailable != "" {
			c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "O destino desta promoção está indisponível"})
			return
		}

		if err := db.Model(&models.Promotion{}).
			Where("id = ?", promotion.ID).
			UpdateColumn("click_count", gorm.Expr("click_count + 1")).Error; err != nil {
			// Métrica não pode impedir a navegação: segue com o destino.
			c.Header("X-Metric", "skipped")
		}

		c.Header("Cache-Control", "no-store")
		c.JSON(http.StatusOK, gin.H{"target": target})
	}
}

// RegisterPromotionImpressions conta exibições em lote — o cliente manda os ids
// que apareceram na tela uma vez por sessão, em vez de um POST por quadro.
func RegisterPromotionImpressions(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			IDs []uint `json:"ids"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida"})
			return
		}

		unique := make([]uint, 0, len(req.IDs))
		seen := map[uint]struct{}{}
		for _, id := range req.IDs {
			if id == 0 {
				continue
			}
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			unique = append(unique, id)
			if len(unique) >= promotionImpressionBatch {
				break
			}
		}
		if len(unique) == 0 {
			c.JSON(http.StatusOK, gin.H{"counted": 0})
			return
		}

		if err := db.Model(&models.Promotion{}).
			Where("id IN ?", unique).
			UpdateColumn("impression_count", gorm.Expr("impression_count + 1")).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao registrar exibições"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"counted": len(unique)})
	}
}

// GetMyPromotions lista as campanhas do anunciante com métricas e, quando o
// banner não está aparecendo, o motivo.
func GetMyPromotions(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}

		var promotions []models.Promotion
		if err := db.Where("user_id = ?", uid).
			Order("created_at DESC").
			Find(&promotions).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar suas promoções"})
			return
		}

		now := time.Now()
		out := make([]ownerPromotion, 0, len(promotions))
		for _, promotion := range promotions {
			out = append(out, toOwnerPromotion(db, promotion, now))
		}
		c.JSON(http.StatusOK, gin.H{
			"results":    out,
			"max_active": config.PromotionsMaxActivePerUser(),
		})
	}
}

func toOwnerPromotion(db *gorm.DB, promotion models.Promotion, now time.Time) ownerPromotion {
	target, unavailable := resolvePromotionTarget(db, promotion)

	reason := unavailable
	live := promotionIsLive(promotion, now)
	if reason == "" && !live {
		switch {
		case promotion.BlockedAt != nil:
			reason = "Banner bloqueado pela moderação."
			if promotion.BlockedReason != "" {
				reason = "Bloqueado pela moderação: " + promotion.BlockedReason
			}
		case !promotion.IsActive:
			reason = "Banner desativado por você."
		case promotion.StartsAt != nil && promotion.StartsAt.After(now):
			reason = "Ainda não chegou a data de início."
		default:
			reason = "O período de exibição já terminou."
		}
	}

	return ownerPromotion{
		publicPromotion: publicPromotion{
			ID:       promotion.ID,
			Title:    promotion.Title,
			Subtitle: promotion.Subtitle,
			ImageURL: promotion.ImageURL,
			CtaLabel: promotion.CtaLabel,
			Target:   target,
		},
		TargetType:      promotion.TargetType,
		TargetID:        promotion.TargetID,
		TargetValue:     promotion.TargetValue,
		IsActive:        promotion.IsActive,
		IsVisible:       live && unavailable == "",
		UnavailableFor:  reason,
		ClickCount:      promotion.ClickCount,
		ImpressionCount: promotion.ImpressionCount,
		StartsAt:        promotion.StartsAt,
		EndsAt:          promotion.EndsAt,
		BlockedReason:   promotion.BlockedReason,
		CreatedAt:       promotion.CreatedAt,
	}
}

type promotionRequest struct {
	Title       string     `json:"title"`
	Subtitle    string     `json:"subtitle"`
	ImageURL    string     `json:"image_url"`
	CtaLabel    string     `json:"cta_label"`
	TargetType  string     `json:"target_type"`
	TargetID    *uint      `json:"target_id"`
	TargetValue string     `json:"target_value"`
	StartsAt    *time.Time `json:"starts_at"`
	EndsAt      *time.Time `json:"ends_at"`
	IsActive    *bool      `json:"is_active"`
}

// CreatePromotion publica a campanha do anunciante direto, dentro dos limites
// de quantidade, de destino e de imagem.
func CreatePromotion(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}

		var user models.User
		if err := db.Select("id", "email_verified").First(&user, uid).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			return
		}
		if !user.EmailVerified {
			c.JSON(http.StatusForbidden, gin.H{"error": "Confirme seu e-mail para criar uma campanha"})
			return
		}

		var req promotionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida"})
			return
		}

		owner := uid
		promotion := models.Promotion{
			UserID:      &owner,
			Title:       req.Title,
			Subtitle:    req.Subtitle,
			ImageURL:    req.ImageURL,
			CtaLabel:    req.CtaLabel,
			TargetType:  req.TargetType,
			TargetID:    req.TargetID,
			TargetValue: req.TargetValue,
			StartsAt:    req.StartsAt,
			EndsAt:      req.EndsAt,
			IsActive:    req.IsActive == nil || *req.IsActive,
		}

		if err := checkPromotionRules(db, c, uid, promotion, 0); err != nil {
			return
		}
		if err := db.Create(&promotion).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, toOwnerPromotion(db, promotion, time.Now()))
	}
}

// UpdatePromotion edita a campanha do próprio anunciante.
func UpdatePromotion(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, promotion, ok := loadOwnedPromotion(db, c)
		if !ok {
			return
		}

		var req promotionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida"})
			return
		}

		promotion.Title = req.Title
		promotion.Subtitle = req.Subtitle
		promotion.ImageURL = req.ImageURL
		promotion.CtaLabel = req.CtaLabel
		promotion.TargetType = req.TargetType
		promotion.TargetID = req.TargetID
		promotion.TargetValue = req.TargetValue
		promotion.StartsAt = req.StartsAt
		promotion.EndsAt = req.EndsAt
		if req.IsActive != nil {
			promotion.IsActive = *req.IsActive
		}

		if err := checkPromotionRules(db, c, uid, promotion, promotion.ID); err != nil {
			return
		}
		if err := db.Save(&promotion).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, toOwnerPromotion(db, promotion, time.Now()))
	}
}

// UpdatePromotionStatus liga ou desliga a campanha. Banner bloqueado pela
// moderação não volta ao ar por aqui.
func UpdatePromotionStatus(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, promotion, ok := loadOwnedPromotion(db, c)
		if !ok {
			return
		}

		var req struct {
			IsActive bool `json:"is_active"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida"})
			return
		}
		if req.IsActive && promotion.BlockedAt != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "Esta campanha foi bloqueada pela moderação"})
			return
		}
		if req.IsActive {
			if err := checkPromotionLimit(db, c, uid, promotion.ID); err != nil {
				return
			}
		}

		promotion.IsActive = req.IsActive
		if err := db.Save(&promotion).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, toOwnerPromotion(db, promotion, time.Now()))
	}
}

// DeletePromotion remove a campanha do próprio anunciante.
func DeletePromotion(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		_, promotion, ok := loadOwnedPromotion(db, c)
		if !ok {
			return
		}
		if err := db.Delete(&models.Promotion{}, promotion.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao remover a campanha"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}

// UploadPromotionImage guarda a arte do banner com as mesmas regras dos demais
// uploads (tipo por magic bytes e limite de tamanho).
func UploadPromotionImage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, ok := requireUserID(c); !ok {
			return
		}
		imageURL, err := SaveSecureImage(c, "file", "uploads")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"image_url": imageURL})
	}
}

func loadOwnedPromotion(db *gorm.DB, c *gin.Context) (uint, models.Promotion, bool) {
	var promotion models.Promotion
	uid, ok := requireUserID(c)
	if !ok {
		return 0, promotion, false
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return 0, promotion, false
	}
	// Campanha de outro dono responde 404, não 403: nada de confirmar a
	// existência de banner alheio.
	if err := db.First(&promotion, id).Error; err != nil || !promotion.IsOwnedBy(uid) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Campanha não encontrada"})
		return 0, promotion, false
	}
	return uid, promotion, true
}

// checkPromotionRules aplica o que o model não consegue ver sozinho: limite de
// campanhas, destinos restritos ao admin e existência do alvo.
func checkPromotionRules(db *gorm.DB, c *gin.Context, uid uint, promotion models.Promotion, ignoreID uint) error {
	if promotion.TargetType == models.PromotionTargetExternal {
		// Link externo em banner de usuário é vetor de phishing na home.
		c.JSON(http.StatusForbidden, gin.H{"error": "Campanhas de anunciante só podem apontar para dentro da plataforma"})
		return fmt.Errorf("external target")
	}
	if !strings.HasPrefix(promotion.ImageURL, "/api/uploads/") && !strings.HasPrefix(promotion.ImageURL, "/uploads/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Envie a imagem do banner pelo próprio app"})
		return fmt.Errorf("external image")
	}
	if promotion.TargetType == models.PromotionTargetItem && promotion.TargetID != nil {
		var item models.Item
		if err := db.Select("id", "user_id", "status").First(&item, *promotion.TargetID).Error; err != nil || item.UserID != uid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Selecione um anúncio seu"})
			return fmt.Errorf("item not owned")
		}
	}
	if promotion.IsActive {
		if err := checkPromotionLimit(db, c, uid, ignoreID); err != nil {
			return err
		}
	}
	return nil
}

func checkPromotionLimit(db *gorm.DB, c *gin.Context, uid uint, ignoreID uint) error {
	max := config.PromotionsMaxActivePerUser()
	query := db.Model(&models.Promotion{}).
		Where("user_id = ? AND is_active = TRUE AND blocked_at IS NULL", uid)
	if ignoreID > 0 {
		query = query.Where("id <> ?", ignoreID)
	}
	var active int64
	if err := query.Count(&active).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao verificar suas campanhas"})
		return err
	}
	if active >= int64(max) {
		c.JSON(http.StatusConflict, gin.H{
			"error": fmt.Sprintf("Você já tem %d campanha(s) ativa(s). Desative uma para publicar outra.", max),
		})
		return fmt.Errorf("limit reached")
	}
	return nil
}
