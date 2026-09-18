package models

import "time"

// ItemImage is one photo in an item gallery. Item.ImageURL mirrors the first
// (lowest sort_order) for list/card cover compatibility.
type ItemImage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ItemID    uint      `gorm:"not null;index:idx_item_images_item_sort,priority:1" json:"item_id"`
	Item      Item      `gorm:"foreignKey:ItemID;constraint:OnDelete:CASCADE" json:"-"`
	URL       string    `gorm:"type:text;not null" json:"url"`
	SortOrder int       `gorm:"not null;default:0;index:idx_item_images_item_sort,priority:2" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
}

func (ItemImage) TableName() string { return "item_images" }
