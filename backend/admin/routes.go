package admin

import (
	"fazbrike-backend/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes monta as rotas de admin sob /api/admin, protegidas por
// autenticação + papel admin. O USE seta o DB no contexto para os handlers.
func RegisterRoutes(r *gin.Engine, db *gorm.DB) {
	group := r.Group("/api/admin")
	group.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware(db))
	group.Use(func(c *gin.Context) {
		c.Set("_admin_db", db)
		c.Next()
	})
	{
		group.GET("/meta", HandleMeta())
		group.GET("/stats", HandleStats())
		group.GET("/stats/visits", HandleVisitsStats(db))
		group.GET("/backup", HandleBackupCreate(db))
		group.POST("/backup/restore", HandleBackupRestore(db))
		group.GET("/:collection", HandleList())
		group.GET("/:collection/:id", HandleGet())
		group.POST("/:collection", HandleCreate())
		group.PUT("/:collection/:id", HandleUpdate())
		group.DELETE("/:collection/:id", HandleDelete())
	}
}
