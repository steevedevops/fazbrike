package admin

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type visitsDailyPoint struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type visitsTopItem struct {
	ItemID uint   `json:"item_id"`
	Title  string `json:"title"`
	Views  int64  `json:"views"`
}

type visitsStatsResponse struct {
	Total    int64              `json:"total"`
	Days     int                `json:"days"`
	Daily    []visitsDailyPoint `json:"daily"`
	TopItems []visitsTopItem    `json:"top_items"`
}

// HandleVisitsStats: GET /api/admin/stats/visits?days=30 — agrega visualizações
// de anúncios (item_views) para o dashboard de visitas do admin.
//
// Cada linha de item_views representa a primeira visualização de um usuário
// em um anúncio (deduplicado por par usuário/anúncio), então "daily" reflete
// visualizações únicas ganhas por dia, não pageviews brutos.
func HandleVisitsStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		days, err := strconv.Atoi(c.DefaultQuery("days", "30"))
		if err != nil || days <= 0 {
			days = 30
		}
		since := time.Now().AddDate(0, 0, -days)

		var total int64
		if err := db.Table("item_views").Count(&total).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao contar visualizações"})
			return
		}

		var daily []visitsDailyPoint
		if err := db.Table("item_views").
			Select("DATE(created_at) AS date, COUNT(*) AS count").
			Where("created_at >= ?", since).
			Group("DATE(created_at)").
			Order("date ASC").
			Scan(&daily).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao agregar visualizações por dia"})
			return
		}

		var topItems []visitsTopItem
		if err := db.Table("item_views").
			Select("item_views.item_id AS item_id, items.title AS title, COUNT(*) AS views").
			Joins("JOIN items ON items.id = item_views.item_id").
			Group("item_views.item_id, items.title").
			Order("views DESC").
			Limit(10).
			Scan(&topItems).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao agregar itens mais vistos"})
			return
		}

		c.JSON(http.StatusOK, visitsStatsResponse{
			Total:    total,
			Days:     days,
			Daily:    daily,
			TopItems: topItems,
		})
	}
}
