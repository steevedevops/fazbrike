package models

import (
	"time"
)

type Item struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `gorm:"not null" json:"description"`
	Price       float64   `gorm:"not null" json:"price"`
	ImageURL    string    `json:"image_url"`
	Category    string    `json:"category"`  // New: Eletrônicos, Móveis, Roupas, etc.
	Location    string    `json:"location"`  // New: Cidade/Estado
	Condition   string    `json:"condition"` // New: Novo, Usado - Como novo, Usado - Bom, etc.
	UserID      uint      `gorm:"not null" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID" json:"-"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
