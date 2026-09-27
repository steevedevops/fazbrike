package models

import "time"

// ItemReport registra uma denúncia feita por um usuário sobre um anúncio.
// O índice único evita que a mesma pessoa gere várias denúncias para o mesmo item.
type ItemReport struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	ItemID       uint       `gorm:"not null;index" json:"item_id" admin:"label:Anúncio"`
	Item         Item       `gorm:"foreignKey:ItemID;constraint:OnDelete:CASCADE" json:"-"`
	ReporterID   uint       `gorm:"not null;index" json:"reporter_id" admin:"label:Denunciante"`
	Reporter     User       `gorm:"foreignKey:ReporterID;constraint:OnDelete:CASCADE" json:"-"`
	Reason       string     `gorm:"type:text;not null" json:"reason" admin:"label:Motivo"`
	Details      string     `gorm:"type:text" json:"details" admin:"label:Detalhes"`
	Status       string     `gorm:"type:text;not null;default:open;index" json:"status" admin:"label:Status"`
	Resolution   string     `gorm:"type:text" json:"resolution" admin:"label:Resolução"`
	ReviewedByID *uint      `gorm:"index" json:"reviewed_by_id,omitempty" admin:"label:Revisado por"`
	ReviewedBy   *User      `gorm:"foreignKey:ReviewedByID;constraint:OnDelete:SET NULL" json:"-"`
	ReviewedAt   *time.Time `json:"reviewed_at,omitempty" admin:"label:Revisado em"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}
