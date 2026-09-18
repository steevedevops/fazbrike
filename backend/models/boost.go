package models

import "time"

// Boost representa uma solicitação de impulsionamento (destaque) de um
// anúncio. Sem cobrança automática: o vendedor solicita e o admin aprova
// manualmente pelo painel admin.
type Boost struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	ItemID      uint       `gorm:"not null;index" json:"item_id"`
	Item        Item       `gorm:"foreignKey:ItemID" json:"-"`
	UserID      uint       `gorm:"not null;index" json:"user_id"`
	Status      string     `gorm:"type:text;not null;default:pending;index" json:"status"` // pending | active | rejected | expired
	Notes       string     `gorm:"type:text" json:"notes"`
	RequestedAt time.Time  `json:"requested_at"`
	ActivatedAt *time.Time `json:"activated_at,omitempty"`
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (Boost) TableName() string { return "boosts" }
