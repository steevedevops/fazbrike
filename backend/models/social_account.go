package models

import "time"

// SocialAccount liga um usuário a uma identidade de login social (Google ou
// Apple via Firebase Authentication). Subject é o uid do Firebase, estável
// para a mesma pessoa no mesmo provedor.
type SocialAccount struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null;index" json:"user_id" admin:"label:Usuário"`
	User       User      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Provider   string    `gorm:"type:text;not null" json:"provider" admin:"label:Provedor"`
	Subject    string    `gorm:"type:text;not null;uniqueIndex" json:"subject" admin:"label:ID no Firebase;readonly"`
	Email      string    `gorm:"type:text" json:"email" admin:"label:E-mail do provedor"`
	LastUsedAt time.Time `json:"last_used_at" admin:"label:Último acesso"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
