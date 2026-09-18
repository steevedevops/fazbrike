package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	Email         string         `json:"email,omitempty" gorm:"uniqueIndex;not null"`
	Password      string         `json:"-" gorm:"not null"`
	Name          string         `json:"name" gorm:"not null"`
	Role          string         `json:"role,omitempty" gorm:"not null;default:user"`
	EmailVerified bool           `json:"email_verified" gorm:"not null;default:true"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required"`
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
