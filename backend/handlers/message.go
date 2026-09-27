package handlers

import (
	"fazbrike-backend/config"
	"fazbrike-backend/models"
	"fazbrike-backend/storage"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const maxMessageLen = 4000

// messageOut enriches Message with sender display fields for the chat UI.
type messageOut struct {
	ID              uint      `json:"id"`
	SenderID        uint      `json:"sender_id"`
	ReceiverID      uint      `json:"receiver_id"`
	ItemID          *uint     `json:"item_id,omitempty"`
	Content         string    `json:"content"`
	IsRead          bool      `json:"is_read"`
	CreatedAt       time.Time `json:"created_at"`
	SenderName      string    `json:"sender_name,omitempty"`
	SenderAvatarURL string    `json:"sender_avatar_url,omitempty"`
	AttachmentURL   string    `json:"attachment_url,omitempty"`
	AttachmentName  string    `json:"attachment_name,omitempty"`
	AttachmentMIME  string    `json:"attachment_mime,omitempty"`
	AttachmentSize  int64     `json:"attachment_size,omitempty"`
	AttachmentKind  string    `json:"attachment_kind,omitempty"`
}

func profileAvatarMap(db *gorm.DB, userIDs []uint) map[uint]string {
	out := make(map[uint]string, len(userIDs))
	if len(userIDs) == 0 {
		return out
	}
	var profiles []models.UserProfile
	if err := db.Select("user_id", "avatar_url").Where("user_id IN ?", userIDs).Find(&profiles).Error; err != nil {
		return out
	}
	for _, p := range profiles {
		if p.AvatarURL != "" {
			out[p.UserID] = p.AvatarURL
		}
	}
	return out
}

func uniqueUserIDs(ids ...uint) []uint {
	seen := map[uint]struct{}{}
	var out []uint
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}

// messagePreviewText returns the conversation-list preview: message content,
// or a friendly label when the message is attachment-only.
func messagePreviewText(msg models.Message) string {
	if msg.Content != "" {
		return msg.Content
	}
	if msg.AttachmentKind == "image" {
		return "📷 Foto"
	}
	if msg.AttachmentURL != "" {
		return "📎 " + msg.AttachmentName
	}
	return ""
}

// SendMessage envia uma nova mensagem (item_id opcional para DM de perfil).
func SendMessage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ReceiverID     uint   `json:"receiver_id"`
			ItemID         *uint  `json:"item_id"`
			Content        string `json:"content"`
			AttachmentURL  string `json:"attachment_url"`
			AttachmentName string `json:"attachment_name"`
			AttachmentMIME string `json:"attachment_mime"`
			AttachmentSize int64  `json:"attachment_size"`
			AttachmentKind string `json:"attachment_kind"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Requisição inválida"})
			return
		}

		senderID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		sid := senderID.(uint)

		if req.ReceiverID == 0 || req.ReceiverID == sid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Destinatário inválido"})
			return
		}

		var receiver models.User
		if err := db.First(&receiver, req.ReceiverID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Destinatário não encontrado"})
			return
		}

		content := strings.TrimSpace(req.Content)
		attachmentURL := strings.TrimSpace(req.AttachmentURL)
		if attachmentURL != "" && !storage.IsTrustedURL(attachmentURL) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "URL de anexo inválida"})
			return
		}
		if content == "" && attachmentURL == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mensagem vazia"})
			return
		}
		if utf8.RuneCountInString(content) > maxMessageLen {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Mensagem muito longa"})
			return
		}

		var itemID *uint
		if req.ItemID != nil && *req.ItemID > 0 {
			var item models.Item
			if err := db.First(&item, *req.ItemID).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "Item não encontrado"})
				return
			}
			if item.UserID != sid && item.UserID != req.ReceiverID {
				c.JSON(http.StatusForbidden, gin.H{"error": "Destinatário não relacionado a este anúncio"})
				return
			}
			id := *req.ItemID
			itemID = &id
		}

		message := models.Message{
			SenderID:       sid,
			ReceiverID:     req.ReceiverID,
			ItemID:         itemID,
			Content:        content,
			AttachmentURL:  attachmentURL,
			AttachmentName: strings.TrimSpace(req.AttachmentName),
			AttachmentMIME: strings.TrimSpace(req.AttachmentMIME),
			AttachmentSize: req.AttachmentSize,
			AttachmentKind: strings.TrimSpace(req.AttachmentKind),
		}

		if err := db.Create(&message).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao enviar mensagem"})
			return
		}

		notifyNewMessage(db, message)

		c.JSON(http.StatusCreated, message)
	}
}

// notifyNewMessage avisa o destinatário na central de notificações. Usa
// NotifyMessage para agrupar: uma conversa vira uma linha, não uma por
// mensagem enviada.
func notifyNewMessage(db *gorm.DB, message models.Message) {
	var sender models.User
	if err := db.Select("id", "name").First(&sender, message.SenderID).Error; err != nil {
		return
	}
	title := "Nova mensagem de " + sender.Name
	if sender.Name == "" {
		title = "Nova mensagem"
	}
	actorID := message.SenderID
	NotifyMessage(db, models.Notification{
		UserID:  message.ReceiverID,
		Type:    models.NotificationTypeMessage,
		Title:   title,
		Body:    messagePreviewText(message),
		Link:    "/messages",
		ActorID: &actorID,
		ItemID:  message.ItemID,
	})
}

// allowedAttachmentMIME whitelists chat attachments: photos + light documents.
var allowedAttachmentMIME = map[string]struct {
	ext  string
	kind string
}{
	"image/jpeg":      {".jpg", "image"},
	"image/png":       {".png", "image"},
	"image/webp":      {".webp", "image"},
	"image/gif":       {".gif", "image"},
	"application/pdf": {".pdf", "file"},
}

// UploadMessageAttachment faz upload de foto ou arquivo leve (≤5MB) para mensagens.
func UploadMessageAttachment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		fileHeader, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "nenhum arquivo enviado"})
			return
		}

		max := config.MessageAttachmentMaxBytes()
		if fileHeader.Size > max {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("arquivo muito grande (máx %d MB)", max>>20)})
			return
		}

		src, err := fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "falha ao ler arquivo"})
			return
		}
		defer src.Close()

		content, err := io.ReadAll(io.LimitReader(src, max+1))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "falha ao ler arquivo"})
			return
		}
		if int64(len(content)) > max {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("arquivo muito grande (máx %d MB)", max>>20)})
			return
		}
		if len(content) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "arquivo vazio"})
			return
		}

		sniffLen := 512
		if len(content) < sniffLen {
			sniffLen = len(content)
		}
		mime := http.DetectContentType(content[:sniffLen])
		info, ok := allowedAttachmentMIME[mime]
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "tipo de arquivo não permitido (use JPEG, PNG, WebP, GIF ou PDF)"})
			return
		}

		key := fmt.Sprintf("messages/%d_%s%s", time.Now().Unix(), uuid.New().String(), info.ext)
		url, err := storage.Current().Save(key, content, mime)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao salvar arquivo"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"url":  url,
			"name": fileHeader.Filename,
			"mime": mime,
			"size": fileHeader.Size,
			"kind": info.kind,
		})
	}
}

// Conversation representa um resumo de uma conversa
type Conversation struct {
	ItemID             *uint     `json:"item_id,omitempty"`
	ItemTitle          string    `json:"item_title"`
	ItemImageURL       string    `json:"item_image_url"`
	OtherUserID        uint      `json:"other_user_id"`
	OtherUserName      string    `json:"other_user_name"`
	OtherUserAvatarURL string    `json:"other_user_avatar_url,omitempty"`
	LastMessage        string    `json:"last_message"`
	LastMessageAt      time.Time `json:"last_message_at"`
	UnreadCount        int       `json:"unread_count"`
}

// GetConversations retorna as conversas do usuário
func GetConversations(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}

		var messages []models.Message
		if err := db.Preload("Sender").Preload("Receiver").Preload("Item").
			Where("sender_id = ? OR receiver_id = ?", userID, userID).
			Order("created_at desc").
			Find(&messages).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar mensagens"})
			return
		}

		conversationsMap := make(map[string]Conversation)
		var conversations []Conversation
		myID := userID.(uint)
		var otherIDs []uint

		for _, msg := range messages {
			var otherID uint
			var otherName string

			if msg.SenderID == myID {
				otherID = msg.ReceiverID
				otherName = msg.Receiver.Name
			} else {
				otherID = msg.SenderID
				otherName = msg.Sender.Name
			}

			itemKey := uint(0)
			if msg.ItemID != nil {
				itemKey = *msg.ItemID
			}
			key := fmt.Sprintf("%d-%d", itemKey, otherID)
			isUnread := !msg.IsRead && msg.ReceiverID == myID

			if conv, exists := conversationsMap[key]; exists {
				if isUnread {
					conv.UnreadCount++
					conversationsMap[key] = conv
					for i, existing := range conversations {
						var existingItem uint
						if existing.ItemID != nil {
							existingItem = *existing.ItemID
						}
						if existingItem == itemKey && existing.OtherUserID == otherID {
							conversations[i].UnreadCount++
							break
						}
					}
				}
			} else {
				unreadCount := 0
				if isUnread {
					unreadCount = 1
				}
				title := "Conversa"
				imageURL := ""
				if msg.Item != nil {
					title = msg.Item.Title
					imageURL = msg.Item.ImageURL
				} else if otherName != "" {
					title = "Conversa com " + otherName
				}
				otherIDs = append(otherIDs, otherID)
				conv := Conversation{
					ItemID:        msg.ItemID,
					ItemTitle:     title,
					ItemImageURL:  imageURL,
					OtherUserID:   otherID,
					OtherUserName: otherName,
					LastMessage:   messagePreviewText(msg),
					LastMessageAt: msg.CreatedAt,
					UnreadCount:   unreadCount,
				}
				conversationsMap[key] = conv
				conversations = append(conversations, conv)
			}
		}

		avatars := profileAvatarMap(db, uniqueUserIDs(otherIDs...))
		for i := range conversations {
			conversations[i].OtherUserAvatarURL = avatars[conversations[i].OtherUserID]
		}

		c.JSON(http.StatusOK, conversations)
	}
}

// GetMessagesByItem retorna mensagens de um item (ou itemId=0 para DM de perfil).
func GetMessagesByItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemIDStr := c.Param("itemId")
		itemID, _ := strconv.Atoi(itemIDStr)

		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}

		myID := userID.(uint)
		var query *gorm.DB
		if itemID == 0 {
			query = db.Preload("Sender").Preload("Receiver").
				Where("item_id IS NULL AND (sender_id = ? OR receiver_id = ?)", myID, myID)
		} else {
			query = db.Preload("Sender").Preload("Receiver").
				Where("item_id = ? AND (sender_id = ? OR receiver_id = ?)", itemID, myID, myID)
		}

		if otherStr := c.Query("other_user_id"); otherStr != "" {
			otherID, err := strconv.Atoi(otherStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "other_user_id inválido"})
				return
			}
			query = query.Where(
				"(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
				myID, otherID, otherID, myID,
			)
		}

		var messages []models.Message
		if err := query.Order("created_at asc").Find(&messages).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar mensagens"})
			return
		}

		ids := make([]uint, 0, len(messages))
		for _, m := range messages {
			ids = append(ids, m.SenderID)
		}
		avatars := profileAvatarMap(db, uniqueUserIDs(ids...))

		out := make([]messageOut, 0, len(messages))
		for _, m := range messages {
			out = append(out, messageOut{
				ID:              m.ID,
				SenderID:        m.SenderID,
				ReceiverID:      m.ReceiverID,
				ItemID:          m.ItemID,
				Content:         m.Content,
				IsRead:          m.IsRead,
				CreatedAt:       m.CreatedAt,
				SenderName:      m.Sender.Name,
				SenderAvatarURL: avatars[m.SenderID],
				AttachmentURL:   m.AttachmentURL,
				AttachmentName:  m.AttachmentName,
				AttachmentMIME:  m.AttachmentMIME,
				AttachmentSize:  m.AttachmentSize,
				AttachmentKind:  m.AttachmentKind,
			})
		}

		c.JSON(http.StatusOK, out)
	}
}

// MarkMessagesAsRead marca mensagens como lidas.
func MarkMessagesAsRead(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemIDStr := c.Param("itemId")
		itemID, _ := strconv.Atoi(itemIDStr)

		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}

		var q *gorm.DB
		if itemID == 0 {
			q = db.Model(&models.Message{}).
				Where("item_id IS NULL AND receiver_id = ? AND is_read = ?", userID, false)
		} else {
			q = db.Model(&models.Message{}).
				Where("item_id = ? AND receiver_id = ? AND is_read = ?", itemID, userID, false)
		}

		if otherStr := c.Query("other_user_id"); otherStr != "" {
			otherID, err := strconv.Atoi(otherStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "other_user_id inválido"})
				return
			}
			q = q.Where("sender_id = ?", otherID)
		}

		if err := q.Update("is_read", true).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao marcar como lidas"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}
