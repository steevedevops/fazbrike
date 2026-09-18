package models

import "time"

// Configuration is an admin-editable key/value setting (Jogame/Plago pattern).
type Configuration struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Key        string    `gorm:"type:text;not null;uniqueIndex" json:"key"`
	Value      string    `gorm:"type:text" json:"value"`
	Attachment string    `gorm:"type:text" json:"attachment"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (Configuration) TableName() string { return "configurations" }
