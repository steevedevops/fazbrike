package models

import "time"

// ItemFavorite links a user to an item they favorited.
type ItemFavorite struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index;uniqueIndex:idx_item_favorites_pair" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ItemID    uint      `gorm:"not null;index;uniqueIndex:idx_item_favorites_pair" json:"item_id"`
	Item      Item      `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (ItemFavorite) TableName() string { return "item_favorites" }
