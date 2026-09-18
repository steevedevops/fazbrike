package handlers

import (
	"fazbrike-backend/models"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetStates lists all states (UFs), ordered by name.
func GetStates(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var states []models.State
		if err := db.Order("name asc").Find(&states).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar estados"})
			return
		}
		c.JSON(http.StatusOK, states)
	}
}

// GetCities lists cities for a state. Requires state_id. Optional q= name filter.
func GetCities(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		stateIDStr := c.Query("state_id")
		if stateIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetro state_id é obrigatório"})
			return
		}
		stateID, err := strconv.ParseInt(stateIDStr, 10, 64)
		if err != nil || stateID <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "state_id inválido"})
			return
		}

		q := db.Model(&models.City{}).Where("state_id = ?", stateID)
		if search := strings.TrimSpace(c.Query("q")); search != "" {
			like := "%" + search + "%"
			q = q.Where("unaccent(lower(name)) LIKE unaccent(lower(?))", like)
		}

		var cities []models.City
		if err := q.Order("name asc").Find(&cities).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar cidades"})
			return
		}
		c.JSON(http.StatusOK, cities)
	}
}

// ApplyCityToItem sets city_id, state_id and location label from catalog city.
func ApplyCityToItem(db *gorm.DB, item *models.Item, cityID int64) error {
	if cityID <= 0 {
		return fmt.Errorf("cidade é obrigatória")
	}
	var city models.City
	if err := db.Preload("State").First(&city, cityID).Error; err != nil {
		return fmt.Errorf("cidade inválida")
	}
	cid := city.ID
	sid := city.StateID
	item.CityID = &cid
	item.StateID = &sid
	if city.State != nil && city.State.Code != "" {
		item.Location = city.Name + ", " + city.State.Code
	} else {
		item.Location = city.Name
	}
	return nil
}

// EnsureItemLocationIndexes creates FK indexes GORM may not add.
func EnsureItemLocationIndexes(db *gorm.DB) error {
	stmts := []string{
		`CREATE INDEX IF NOT EXISTS idx_items_city_id ON items (city_id)`,
		`CREATE INDEX IF NOT EXISTS idx_items_state_id ON items (state_id)`,
	}
	for _, s := range stmts {
		if err := db.Exec(s).Error; err != nil {
			return err
		}
	}
	return nil
}
