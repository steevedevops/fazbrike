package seed

import (
	"fazbrike-backend/config"
	"fazbrike-backend/models"
	"log"

	"gorm.io/gorm"
)

// SeedConfigurations upserts known configuration keys (empty secrets / safe defaults).
func SeedConfigurations(db *gorm.DB) error {
	for key, value := range config.DefaultKeys() {
		var row models.Configuration
		err := db.Where("key = ?", key).First(&row).Error
		if err == nil {
			continue
		}
		if err != gorm.ErrRecordNotFound {
			return err
		}
		row = models.Configuration{Key: key, Value: value}
		if err := db.Create(&row).Error; err != nil {
			return err
		}
		log.Printf("configurations: seeded %s", key)
	}
	return nil
}
