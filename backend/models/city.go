package models

// City is a municipality in the location catalog (IDs match NinhoHouse codigo).
// Location (PostGIS geography) is managed via raw SQL after AutoMigrate.
type City struct {
	ID        int64    `gorm:"primaryKey" json:"id"`
	Name      string   `gorm:"type:text;not null" json:"name"`
	IBGE      *string  `gorm:"type:text" json:"ibge,omitempty"`
	Latitude  *float64 `json:"latitude,omitempty"`
	Longitude *float64 `json:"longitude,omitempty"`
	StateID   int64    `gorm:"not null;index" json:"state_id"`
	State     *State   `gorm:"foreignKey:StateID" json:"state,omitempty"`
}

func (City) TableName() string { return "cities" }
