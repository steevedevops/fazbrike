package models

import (
	"gorm.io/gorm"
)

type Message struct {
	gorm.Model
	SenderID   uint   `json:"sender_id"`
	Sender     User   `gorm:"foreignKey:SenderID" json:"sender"`
	ReceiverID uint   `json:"receiver_id"`
	Receiver   User   `gorm:"foreignKey:ReceiverID" json:"receiver"`
	ItemID     uint   `json:"item_id"`
	Item       Item   `gorm:"foreignKey:ItemID" json:"item"`
	Content    string `json:"content"`
	ImageURL   string `json:"image_url"`
	IsRead     bool   `json:"is_read" gorm:"default:false"`
}
