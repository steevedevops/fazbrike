package models

import (
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

var devicePlatforms = map[string]struct{}{
	"android": {},
	"ios":     {},
	"web":     {},
}

// DeviceToken guarda o token de push de um aparelho. O envio em si (FCM/APNs)
// ainda não está ligado: o registro existe para que a entrega push seja
// plugada sem mexer no app nem nos pontos que geram notificação.
type DeviceToken struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"not null;index" json:"user_id" admin:"label:Usuário"`
	Token      string    `gorm:"type:text;not null;uniqueIndex" json:"token" admin:"label:Token do aparelho"`
	Platform   string    `gorm:"type:text;not null;default:android" json:"platform" admin:"label:Plataforma"`
	AppVersion string    `gorm:"type:text" json:"app_version" admin:"label:Versão do app"`
	LastSeenAt time.Time `json:"last_seen_at" admin:"label:Visto em"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (DeviceToken) TableName() string { return "device_tokens" }

func (device *DeviceToken) BeforeSave(_ *gorm.DB) error {
	device.Token = strings.TrimSpace(device.Token)
	device.Platform = strings.ToLower(strings.TrimSpace(device.Platform))
	device.AppVersion = strings.TrimSpace(device.AppVersion)

	if device.UserID == 0 {
		return fmt.Errorf("selecione o usuário do aparelho")
	}
	if device.Token == "" {
		return fmt.Errorf("o token do aparelho é obrigatório")
	}
	if len(device.Token) > 512 {
		return fmt.Errorf("o token do aparelho é longo demais")
	}
	if device.Platform == "" {
		device.Platform = "android"
	}
	if _, ok := devicePlatforms[device.Platform]; !ok {
		return fmt.Errorf("plataforma inválida: use android, ios ou web")
	}
	if device.LastSeenAt.IsZero() {
		device.LastSeenAt = time.Now()
	}
	return nil
}
