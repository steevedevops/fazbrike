package models

import "time"

// ItemSaleFeedback guarda a pesquisa respondida pelo vendedor ao encerrar um
// anúncio (vendido ou apenas pausado), para uso em relatórios/avaliação.
type ItemSaleFeedback struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ItemID     uint      `gorm:"not null;index" json:"item_id"`
	Item       Item      `gorm:"foreignKey:ItemID" json:"-"`
	UserID     uint      `gorm:"not null;index" json:"user_id"`
	Channel    string    `gorm:"type:text;not null" json:"channel"` // platform | off_platform | not_sold
	FinalPrice *float64  `json:"final_price,omitempty"`
	Comment    string    `gorm:"type:text" json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
}

func (ItemSaleFeedback) TableName() string { return "item_sale_feedbacks" }
