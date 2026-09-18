package models

import (
	"time"

	"gorm.io/gorm"
)

// Message uses explicit columns so JSON is snake_case (gorm.Model would emit CreatedAt).
type Message struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
	SenderID   uint           `json:"sender_id"`
	Sender     User           `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
	ReceiverID uint           `json:"receiver_id"`
	Receiver   User           `gorm:"foreignKey:ReceiverID" json:"receiver,omitempty"`
	ItemID     *uint          `json:"item_id,omitempty"`
	Item       *Item          `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	Content    string         `json:"content"`
	IsRead     bool           `json:"is_read" gorm:"default:false"`

	// Attachment (optional) — image or light file sent alongside/instead of text.
	AttachmentURL  string `json:"attachment_url,omitempty"`
	AttachmentName string `json:"attachment_name,omitempty"`
	AttachmentMIME string `json:"attachment_mime,omitempty"`
	AttachmentSize int64  `json:"attachment_size,omitempty"`
	AttachmentKind string `json:"attachment_kind,omitempty"` // "image" | "file"
}

// ConversationSummary is used by API responses for inbox listing.
type ConversationSummary struct {
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
