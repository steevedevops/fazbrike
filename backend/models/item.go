package models

import (
	"time"
)

type Item struct {
	ID              uint        `gorm:"primaryKey" json:"id"`
	Title           string      `gorm:"not null" json:"title"`
	Description     string      `gorm:"not null" json:"description"`
	Price           float64     `gorm:"not null" json:"price"`
	ImageURL        string      `json:"image_url"` // cover = first gallery image (denormalized)
	Images          []ItemImage `gorm:"foreignKey:ItemID" json:"images,omitempty"`
	Category        string      `json:"category"`     // leaf category slug
	ListingType     string      `json:"listing_type"` // item | vehicle | property
	Location        string      `json:"location"`     // display mirror "Cidade, UF"
	CityID          *int64      `gorm:"index" json:"city_id,omitempty"`
	StateID         *int64      `gorm:"index" json:"state_id,omitempty"`
	City            *City       `gorm:"foreignKey:CityID" json:"city,omitempty"`
	Condition       string      `json:"condition"`                                             // Novo, Usado - Como novo, Usado - Bom, etc.
	Attrs           string      `gorm:"type:text" json:"attrs"`                                // JSON extras (vehicle/property)
	Status          string      `gorm:"type:text;not null;default:active;index" json:"status"` // active | reserved | sold | inactive
	RejectionReason string      `gorm:"type:text" json:"rejection_reason,omitempty" admin:"label:Motivo da rejeição"`
	ModeratedAt     *time.Time  `json:"moderated_at,omitempty" admin:"label:Moderado em"`
	ModeratedByID   *uint       `gorm:"index" json:"moderated_by_id,omitempty" admin:"label:Moderado por"`
	ModeratedBy     *User       `gorm:"foreignKey:ModeratedByID;constraint:OnDelete:SET NULL" json:"-"`
	SoldAt          *time.Time  `json:"sold_at,omitempty"`
	UserID          uint        `gorm:"not null" json:"user_id"`
	User            User        `gorm:"foreignKey:UserID" json:"user"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`

	CommentsCount  int64 `gorm:"-" json:"comments_count"`
	ViewsCount     int64 `gorm:"-" json:"views_count"`
	FavoritesCount int64 `gorm:"-" json:"favorites_count"`
	IsFavorited    bool  `gorm:"-" json:"is_favorited,omitempty"`
}
