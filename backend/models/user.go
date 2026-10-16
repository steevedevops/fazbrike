package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID            uint   `json:"id" gorm:"primaryKey"`
	Email         string `json:"email,omitempty" gorm:"uniqueIndex;not null"`
	Password      string `json:"-" gorm:"not null"`
	Name          string `json:"name" gorm:"not null"`
	Role          string `json:"role,omitempty" gorm:"not null;default:user"`
	EmailVerified bool   `json:"email_verified" gorm:"not null;default:true"`
	// Momento em que a pessoa aceitou Termos de Uso e Política de Privacidade no cadastro.
	TermsAcceptedAt *time.Time     `json:"terms_accepted_at,omitempty" admin:"label:Aceitou os termos em"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required"`
	// Obrigatório: o cadastro só é criado com o aceite explícito dos termos.
	AcceptTerms bool `json:"accept_terms"`
}

type RegisterResponse struct {
	Message string `json:"message"`
	Email   string `json:"email"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type VerifyEmailCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required"`
}

type ResendEmailCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
