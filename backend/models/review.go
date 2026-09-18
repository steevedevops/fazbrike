package models

import "time"

// Review is a rating of a seller (reviewee) by a buyer (reviewer).
type Review struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	ReviewerID uint      `gorm:"not null;index" json:"reviewer_id"`
	Reviewer   User      `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
	RevieweeID uint      `gorm:"not null;index" json:"reviewee_id"`
	Reviewee   User      `gorm:"foreignKey:RevieweeID" json:"reviewee,omitempty"`
	ItemID     *uint     `gorm:"index" json:"item_id,omitempty"`
	Item       *Item     `gorm:"foreignKey:ItemID" json:"item,omitempty"`
	Rating     int       `gorm:"not null" json:"rating"`
	Comment    string    `gorm:"type:text" json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (Review) TableName() string { return "reviews" }
