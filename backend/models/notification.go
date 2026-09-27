package models

import (
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
)

// Tipos de notificação suportados. O app e o site usam o tipo para escolher o
// ícone; o texto exibido vem sempre de Title/Body.
const (
	NotificationTypeMessage  = "message"
	NotificationTypeComment  = "comment"
	NotificationTypeFavorite = "favorite"
	NotificationTypeFollow   = "follow"
	NotificationTypeReview   = "review"
	NotificationTypeBoost    = "boost"
	NotificationTypeSystem   = "system"
)

var notificationTypes = map[string]struct{}{
	NotificationTypeMessage:  {},
	NotificationTypeComment:  {},
	NotificationTypeFavorite: {},
	NotificationTypeFollow:   {},
	NotificationTypeReview:   {},
	NotificationTypeBoost:    {},
	NotificationTypeSystem:   {},
}

// Notification é um aviso destinado a um usuário. Ela é a fonte de verdade da
// central de notificações (app e site); o envio push é apenas mais um canal de
// entrega da mesma linha.
type Notification struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"not null;index" json:"user_id" admin:"label:Destinatário"`
	Type      string     `gorm:"type:text;not null;default:system;index" json:"type" admin:"label:Tipo"`
	Title     string     `gorm:"type:text;not null" json:"title" admin:"label:Título"`
	Body      string     `gorm:"type:text" json:"body" admin:"label:Mensagem"`
	Link      string     `gorm:"type:text" json:"link" admin:"label:Destino (rota do app)"`
	ActorID   *uint      `gorm:"index" json:"actor_id,omitempty" admin:"label:Quem gerou"`
	ItemID    *uint      `gorm:"index" json:"item_id,omitempty" admin:"label:Anúncio"`
	ReadAt    *time.Time `json:"read_at,omitempty" admin:"label:Lida em"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (Notification) TableName() string { return "notifications" }

func (notification *Notification) BeforeSave(_ *gorm.DB) error {
	notification.Type = strings.ToLower(strings.TrimSpace(notification.Type))
	notification.Title = strings.TrimSpace(notification.Title)
	notification.Body = strings.TrimSpace(notification.Body)
	notification.Link = strings.TrimSpace(notification.Link)

	if notification.Type == "" {
		notification.Type = NotificationTypeSystem
	}
	if _, ok := notificationTypes[notification.Type]; !ok {
		return fmt.Errorf("tipo de notificação inválido: %s", notification.Type)
	}
	if notification.UserID == 0 {
		return fmt.Errorf("selecione o destinatário da notificação")
	}
	if notification.Title == "" {
		return fmt.Errorf("o título da notificação é obrigatório")
	}
	if len([]rune(notification.Title)) > 120 {
		return fmt.Errorf("o título deve ter no máximo 120 caracteres")
	}
	if len([]rune(notification.Body)) > 500 {
		return fmt.Errorf("a mensagem deve ter no máximo 500 caracteres")
	}
	// Só aceita rota interna ("/produto/10") ou URL http(s) completa: evita
	// que um link javascript:/data: chegue ao webview do app.
	if notification.Link != "" && !strings.HasPrefix(notification.Link, "/") && !IsHTTPURL(notification.Link) {
		return fmt.Errorf("o destino deve ser uma rota interna (/...) ou uma URL http(s)")
	}
	return nil
}
