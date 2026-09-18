package models

import "time"

type ItemView struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ItemID    uint      `gorm:"not null;index;uniqueIndex:idx_item_views_pair" json:"item_id"`
	Item      Item      `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	UserID    uint      `gorm:"not null;index;uniqueIndex:idx_item_views_pair" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (ItemView) TableName() string { return "item_views" }
