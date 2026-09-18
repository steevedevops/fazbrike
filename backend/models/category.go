package models

import "time"

// Category is a Marketplace-style listing category (optionally nested).
type Category struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Slug        string     `gorm:"uniqueIndex;not null" json:"slug"`
	Name        string     `gorm:"not null" json:"name"`
	ListingType string     `gorm:"not null;default:item" json:"listing_type"` // item | vehicle | property | all
	ParentID    *uint      `json:"parent_id"`
	Parent      *Category  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children    []Category `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	SortOrder   int        `json:"sort_order"`
	IsActive    bool       `gorm:"not null;default:true" json:"is_active"`
	Icon        string     `json:"icon"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}
