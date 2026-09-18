package models

// State is a Brazilian UF (or other country subdivision) in the location catalog.
type State struct {
	ID        int64    `gorm:"primaryKey" json:"id"`
	Name      string   `gorm:"type:text;not null" json:"name"`
	Code      string   `gorm:"type:text;not null" json:"code"`
	CountryID int64    `gorm:"not null;index" json:"country_id"`
	Country   *Country `gorm:"foreignKey:CountryID" json:"country,omitempty"`
}

func (State) TableName() string { return "states" }
