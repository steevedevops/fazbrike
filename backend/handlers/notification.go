package handlers

import (
	"fazbrike-backend/models"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const notificationListLimit = 30

type notificationActor struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

type notificationOut struct {
	ID        uint               `json:"id"`
	Type      string             `json:"type"`
	Title     string             `json:"title"`
	Body      string             `json:"body,omitempty"`
	Link      string             `json:"link,omitempty"`
	ItemID    *uint              `json:"item_id,omitempty"`
	IsRead    bool               `json:"is_read"`
	CreatedAt time.Time          `json:"created_at"`
	Actor     *notificationActor `json:"actor,omitempty"`
}

// PushSender entrega a notificação fora do app (FCM/APNs). Fica nil enquanto o
// projeto de push não estiver configurado: nesse cenário a notificação existe
// só na central in-app, e nada mais muda nos pontos que a geram.
var PushSender func(tokens []models.DeviceToken, notification models.Notification)

// EnsureNotificationIndexes cria os índices que sustentam a central: lista do
// usuário por data e a contagem de não lidas. FK não é indexada sozinha no
// Postgres.
func EnsureNotificationIndexes(db *gorm.DB) error {
	statements := []string{
		`CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id) WHERE read_at IS NULL`,
		`CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens (user_id)`,
	}
	for _, statement := range statements {
		if err := db.Exec(statement).Error; err != nil {
			return err
		}
	}
	return nil
}

// NotifyUser grava a notificação e dispara o push quando houver transporte.
// É fail-soft de propósito: um aviso que falha não pode derrubar a ação que o
// originou (enviar mensagem, comentar, seguir).
func NotifyUser(db *gorm.DB, notification models.Notification) {
	if notification.UserID == 0 {
		return
	}
	// Ninguém é notificado da própria ação.
	if notification.ActorID != nil && *notification.ActorID == notification.UserID {
		return
	}
	if err := db.Create(&notification).Error; err != nil {
		log.Printf("notification: falha ao criar (user=%d type=%s): %v", notification.UserID, notification.Type, err)
		return
	}
	dispatchPush(db, notification)
}

// NotifyMessage agrupa avisos de conversa: enquanto o destinatário não abrir a
// central, novas mensagens do mesmo remetente atualizam o aviso existente em
// vez de empilhar uma linha por mensagem.
func NotifyMessage(db *gorm.DB, notification models.Notification) {
	if notification.UserID == 0 || notification.ActorID == nil || *notification.ActorID == notification.UserID {
		return
	}

	query := db.Where("user_id = ? AND type = ? AND actor_id = ? AND read_at IS NULL",
		notification.UserID, models.NotificationTypeMessage, *notification.ActorID)
	if notification.ItemID == nil {
		query = query.Where("item_id IS NULL")
	} else {
		query = query.Where("item_id = ?", *notification.ItemID)
	}

	var existing models.Notification
	if err := query.Order("created_at DESC").First(&existing).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			log.Printf("notification: falha ao agrupar mensagem (user=%d): %v", notification.UserID, err)
		}
		NotifyUser(db, notification)
		return
	}

	existing.Title = notification.Title
	existing.Body = notification.Body
	existing.Link = notification.Link
	existing.CreatedAt = time.Now()
	if err := db.Save(&existing).Error; err != nil {
		log.Printf("notification: falha ao atualizar aviso de mensagem (id=%d): %v", existing.ID, err)
		return
	}
	dispatchPush(db, existing)
}

func dispatchPush(db *gorm.DB, notification models.Notification) {
	if PushSender == nil {
		return
	}
	var tokens []models.DeviceToken
	if err := db.Where("user_id = ?", notification.UserID).Find(&tokens).Error; err != nil {
		log.Printf("notification: falha ao carregar tokens (user=%d): %v", notification.UserID, err)
		return
	}
	if len(tokens) == 0 {
		return
	}
	PushSender(tokens, notification)
}

// GetNotifications lista as notificações do usuário autenticado, da mais
// recente para a mais antiga.
func GetNotifications(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}

		limit := notificationListLimit
		if raw := c.Query("limit"); raw != "" {
			if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
				limit = parsed
			}
		}
		if limit > 100 {
			limit = 100
		}

		query := db.Where("user_id = ?", uid)
		if c.Query("only_unread") == "true" {
			query = query.Where("read_at IS NULL")
		}

		var notifications []models.Notification
		if err := query.Order("created_at DESC, id DESC").Limit(limit).Find(&notifications).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar notificações"})
			return
		}

		actors := notificationActors(db, notifications)
		out := make([]notificationOut, 0, len(notifications))
		for _, notification := range notifications {
			row := notificationOut{
				ID:        notification.ID,
				Type:      notification.Type,
				Title:     notification.Title,
				Body:      notification.Body,
				Link:      notification.Link,
				ItemID:    notification.ItemID,
				IsRead:    notification.ReadAt != nil,
				CreatedAt: notification.CreatedAt,
			}
			if notification.ActorID != nil {
				if actor, found := actors[*notification.ActorID]; found {
					row.Actor = &actor
				}
			}
			out = append(out, row)
		}

		var unread int64
		if err := db.Model(&models.Notification{}).
			Where("user_id = ? AND read_at IS NULL", uid).
			Count(&unread).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar notificações"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"results": out, "unread": unread})
	}
}

// GetNotificationsUnreadCount alimenta o badge do sino sem trazer a lista.
func GetNotificationsUnreadCount(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		var unread int64
		if err := db.Model(&models.Notification{}).
			Where("user_id = ? AND read_at IS NULL", uid).
			Count(&unread).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar notificações"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"unread": unread})
	}
}

// MarkNotificationRead marca uma notificação do próprio usuário como lida.
func MarkNotificationRead(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}

		now := time.Now()
		result := db.Model(&models.Notification{}).
			Where("id = ? AND user_id = ? AND read_at IS NULL", id, uid).
			UpdateColumns(map[string]interface{}{"read_at": now, "updated_at": now})
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao marcar notificação"})
			return
		}
		if result.RowsAffected == 0 {
			// Já lida ou de outro usuário: em ambos os casos não há o que expor.
			var exists int64
			if err := db.Model(&models.Notification{}).Where("id = ? AND user_id = ?", id, uid).Count(&exists).Error; err != nil || exists == 0 {
				c.JSON(http.StatusNotFound, gin.H{"error": "Notificação não encontrada"})
				return
			}
		}
		c.JSON(http.StatusOK, gin.H{"read": true})
	}
}

// MarkAllNotificationsRead zera o badge do usuário.
func MarkAllNotificationsRead(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		now := time.Now()
		if err := db.Model(&models.Notification{}).
			Where("user_id = ? AND read_at IS NULL", uid).
			UpdateColumns(map[string]interface{}{"read_at": now, "updated_at": now}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao marcar notificações"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"unread": 0})
	}
}

// DeleteNotification remove um aviso da central do próprio usuário.
func DeleteNotification(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}
		result := db.Where("id = ? AND user_id = ?", id, uid).Delete(&models.Notification{})
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao remover notificação"})
			return
		}
		if result.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Notificação não encontrada"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"deleted": true})
	}
}

// RegisterDeviceToken guarda (ou reaproveita) o token de push do aparelho do
// usuário autenticado.
func RegisterDeviceToken(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		var req struct {
			Token      string `json:"token"`
			Platform   string `json:"platform"`
			AppVersion string `json:"app_version"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida"})
			return
		}

		token := strings.TrimSpace(req.Token)
		if token == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Token do aparelho é obrigatório"})
			return
		}

		device := models.DeviceToken{
			UserID:     uid,
			Token:      token,
			Platform:   req.Platform,
			AppVersion: req.AppVersion,
			LastSeenAt: time.Now(),
		}
		// O token é único por aparelho: se ele já existe (reinstalação, troca de
		// conta), o dono passa a ser quem está autenticado agora.
		var existing models.DeviceToken
		if err := db.Where("token = ?", token).First(&existing).Error; err == nil {
			existing.UserID = uid
			existing.Platform = device.Platform
			existing.AppVersion = device.AppVersion
			existing.LastSeenAt = device.LastSeenAt
			if err := db.Save(&existing).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"registered": true})
			return
		}

		if err := db.Create(&device).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"registered": true})
	}
}

// DeleteDeviceToken desregistra o aparelho (logout).
func DeleteDeviceToken(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		uid, ok := requireUserID(c)
		if !ok {
			return
		}
		var req struct {
			Token string `json:"token"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida"})
			return
		}
		token := strings.TrimSpace(req.Token)
		if token == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Token do aparelho é obrigatório"})
			return
		}
		if err := db.Where("user_id = ? AND token = ?", uid, token).Delete(&models.DeviceToken{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao remover aparelho"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"removed": true})
	}
}

func actorDisplayName(db *gorm.DB, userID uint) string {
	var user models.User
	if err := db.Select("id", "name").First(&user, userID).Error; err != nil {
		return "Alguém"
	}
	if strings.TrimSpace(user.Name) == "" {
		return "Alguém"
	}
	return user.Name
}

// notifyItemOwner avisa o dono do anúncio sobre uma interação de outra pessoa
// (comentário, favorito). Silencioso quando o autor é o próprio dono.
func notifyItemOwner(db *gorm.DB, itemID, actorID uint, kind, action, body string) {
	var item models.Item
	if err := db.Select("id", "user_id", "title").First(&item, itemID).Error; err != nil {
		return
	}
	if item.UserID == actorID {
		return
	}
	text := body
	if text == "" {
		text = item.Title
	}
	id := item.ID
	actor := actorID
	NotifyUser(db, models.Notification{
		UserID:  item.UserID,
		Type:    kind,
		Title:   actorDisplayName(db, actorID) + " " + action,
		Body:    text,
		Link:    fmt.Sprintf("/produto/%d", item.ID),
		ActorID: &actor,
		ItemID:  &id,
	})
}

func notificationActors(db *gorm.DB, notifications []models.Notification) map[uint]notificationActor {
	ids := make([]uint, 0, len(notifications))
	for _, notification := range notifications {
		if notification.ActorID != nil {
			ids = append(ids, *notification.ActorID)
		}
	}
	ids = uniqueUserIDs(ids...)
	out := make(map[uint]notificationActor, len(ids))
	if len(ids) == 0 {
		return out
	}

	var users []models.User
	if err := db.Select("id", "name").Where("id IN ?", ids).Find(&users).Error; err != nil {
		return out
	}
	avatars := profileAvatarMap(db, ids)
	for _, user := range users {
		out[user.ID] = notificationActor{ID: user.ID, Name: user.Name, AvatarURL: avatars[user.ID]}
	}
	return out
}
