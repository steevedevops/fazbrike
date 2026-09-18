package models

// Country is a reference country (seeded from NinhoHouse / IBGE catalog).
type Country struct {
	ID   int64  `gorm:"primaryKey" json:"id"`
	Name string `gorm:"type:text;not null" json:"name"`
	Code string `gorm:"type:text;not null;uniqueIndex" json:"code"`
}

func (Country) TableName() string { return "countries" }
