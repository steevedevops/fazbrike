package models

import "time"

// EmailVerificationCode is a one-time code sent by email to confirm account
// ownership at registration (Jogame/Plago CodigoValidacao pattern).
type EmailVerificationCode struct {
	ID             uint       `json:"id" gorm:"primaryKey"`
	UserID         uint       `json:"user_id" gorm:"not null;index"`
	Email          string     `json:"email" gorm:"not null;index"`
	Code           string     `json:"-" gorm:"not null"`
	Type           string     `json:"type" gorm:"not null;default:register"` // register, resend
	FailedAttempts int        `json:"failed_attempts" gorm:"not null;default:0"`
	ExpiresAt      time.Time  `json:"expires_at" gorm:"not null"`
	UsedAt         *time.Time `json:"used_at"`
	CreatedAt      time.Time  `json:"created_at"`
}

func (EmailVerificationCode) TableName() string { return "email_verification_codes" }
