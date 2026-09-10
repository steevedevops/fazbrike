package handlers

import (
	"fazbrike-backend/models"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SendMessage envia uma nova mensagem
func SendMessage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ReceiverID uint   `json:"receiver_id"`
			ItemID     uint   `json:"item_id"`
			Content    string `json:"content"`
			ImageURL   string `json:"image_url"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}

		senderID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		// Verificar se o item existe
		var item models.Item
		if err := db.First(&item, req.ItemID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
			return
		}

		// Criar mensagem
		message := models.Message{
			SenderID:   senderID.(uint),
			ReceiverID: req.ReceiverID,
			ItemID:     req.ItemID,
			Content:    req.Content,
			ImageURL:   req.ImageURL,
		}

		if err := db.Create(&message).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
			return
		}

		c.JSON(http.StatusCreated, message)
	}
}

// UploadMessageImage faz upload de imagem para mensagens
func UploadMessageImage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		file, err := c.FormFile("image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No image uploaded"})
			return
		}

		// Criar diretório se não existir
		if err := os.MkdirAll("uploads", 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// Gerar nome único
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
		savePath := filepath.Join("uploads", filename)

		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}

		imageURL := fmt.Sprintf("/api/uploads/%s", filename)
		c.JSON(http.StatusOK, gin.H{"image_url": imageURL})
	}
}

// Conversation representa um resumo de uma conversa
type Conversation struct {
	ItemID        uint      `json:"item_id"`
	ItemTitle     string    `json:"item_title"`
	ItemImageURL  string    `json:"item_image_url"`
	OtherUserID   uint      `json:"other_user_id"`
	OtherUserName string    `json:"other_user_name"`
	LastMessage   string    `json:"last_message"`
	LastMessageAt time.Time `json:"last_message_at"`
	UnreadCount   int       `json:"unread_count"`
}

// GetConversations retorna as conversas do usuário
func GetConversations(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		// Esta query é um pouco complexa. Precisamos agrupar por ItemID e o "outro usuário".
		// Para simplificar no MVP, vamos buscar todas as mensagens onde o usuário está envolvido
		// e agrupar em memória (Go). Para produção, use SQL GROUP BY ou Window Functions.
		var messages []models.Message
		if err := db.Preload("Sender").Preload("Receiver").Preload("Item").
			Where("sender_id = ? OR receiver_id = ?", userID, userID).
			Order("created_at desc").
			Find(&messages).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
			return
		}

		conversationsMap := make(map[string]Conversation)
		var conversations []Conversation

		myID := userID.(uint)

		for _, msg := range messages {
			// Identificar o "outro" usuário
			var otherID uint
			var otherName string

			if msg.SenderID == myID {
				otherID = msg.ReceiverID
				otherName = msg.Receiver.Name
			} else {
				otherID = msg.SenderID
				otherName = msg.Sender.Name
			}

			// Chave única para a conversa: ItemID + OtherUserID
			key := fmt.Sprintf("%d-%d", msg.ItemID, otherID)

			// Verificar se é não lida e destinada a mim
			isUnread := !msg.IsRead && msg.ReceiverID == myID

			if conv, exists := conversationsMap[key]; exists {
				// Atualizar contagem se já existe
				if isUnread {
					conv.UnreadCount++
					conversationsMap[key] = conv
					// Atualizar também no slice (ponteiro seria melhor, mas vamos re-atribuir)
					for i, c := range conversations {
						if c.ItemID == conv.ItemID && c.OtherUserID == conv.OtherUserID {
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

				conv := Conversation{
					ItemID:        msg.ItemID,
					ItemTitle:     msg.Item.Title,
					ItemImageURL:  msg.Item.ImageURL,
					OtherUserID:   otherID,
					OtherUserName: otherName,
					LastMessage:   msg.Content,
					LastMessageAt: msg.CreatedAt,
					UnreadCount:   unreadCount,
				}
				conversationsMap[key] = conv
				conversations = append(conversations, conv)
			}
		}

		c.JSON(http.StatusOK, conversations)
	}
}

// GetMessagesByItem retorna mensagens de um item específico entre dois usuários
func GetMessagesByItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemIDStr := c.Param("itemId")
		itemID, _ := strconv.Atoi(itemIDStr)

		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		var messages []models.Message
		if err := db.Preload("Sender").Preload("Receiver").
			Where("item_id = ? AND (sender_id = ? OR receiver_id = ?)", itemID, userID, userID).
			Order("created_at asc").
			Find(&messages).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
			return
		}

		c.JSON(http.StatusOK, messages)
	}
}

// MarkMessagesAsRead marca todas as mensagens de um item como lidas para o usuário atual
func MarkMessagesAsRead(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		itemIDStr := c.Param("itemId")
		itemID, _ := strconv.Atoi(itemIDStr)

		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		// Atualizar mensagens onde o usuário é o destinatário e o item é o especificado
		if err := db.Model(&models.Message{}).
			Where("item_id = ? AND receiver_id = ? AND is_read = ?", itemID, userID, false).
			Update("is_read", true).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark messages as read"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	}
}
