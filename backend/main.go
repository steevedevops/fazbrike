package main

import (
	"fazbrike-backend/admin"
	"fazbrike-backend/config"
	"fazbrike-backend/handlers"
	"fazbrike-backend/middleware"
	"fazbrike-backend/models"
	"log"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	// Carregar variáveis de ambiente
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Conectar ao banco de dados
	config.InitDB()
	db := config.GetDB()

	// Migrar modelos
	if err := db.AutoMigrate(&models.User{}, &models.Item{}, &models.Message{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Promover admins configurados no boot (env ADMIN_EMAILS)
	if err := bootstrapAdmins(db); err != nil {
		log.Fatal("Failed to bootstrap admins:", err)
	}

	// Registro de collections do admin (estilo Django: cada model vira uma collection)
	if err := initAdminRegistry(); err != nil {
		log.Fatal("Failed to init admin registry:", err)
	}

	// Configurar Gin
	r := gin.Default()

	// Middleware CORS
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Servir arquivos estáticos (imagens)
	r.Static("/api/uploads", "./uploads")

	// Rotas de autenticação
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", handlers.Register(db))
		auth.POST("/login", handlers.Login(db))
		auth.GET("/me", middleware.AuthMiddleware(), handlers.GetProfile(db))
	}

	// Rotas de itens (Públicas)
	publicItems := r.Group("/api/items")
	{
		publicItems.GET("", handlers.GetItems(db))
		publicItems.GET("/:id", handlers.GetItemDetails(db))
	}

	// Rotas de itens (Protegidas)
	protectedItems := r.Group("/api/items")
	protectedItems.Use(middleware.AuthMiddleware())
	{
		protectedItems.POST("", handlers.CreateItem(db))
		protectedItems.GET("/my", handlers.GetUserItems(db))
		protectedItems.POST("/:id/image", handlers.UploadItemImage(db))
		protectedItems.DELETE("/:id", handlers.DeleteItem(db))
	}

	// Rotas de mensagens (Protegidas)
	messages := r.Group("/api/messages")
	messages.Use(middleware.AuthMiddleware())
	{
		messages.POST("", handlers.SendMessage(db))
		messages.GET("", handlers.GetConversations(db))
		messages.GET("/item/:itemId", handlers.GetMessagesByItem(db))
		messages.PUT("/item/:itemId/read", handlers.MarkMessagesAsRead(db))
	}

	// Rotas de administração (protegidas: exigem role=admin)
	admin.RegisterRoutes(r, db)

	// Rota de teste
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Iniciar servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// initAdminRegistry registra todos os models existentes no admin (estilo Django).
// Sempre que um model/ módulo novo for criado, ele deve ser adicionado aqui —
// ver skill .reasonix/skills/admin-module/SKILL.md.
func initAdminRegistry() error {
	if err := admin.Register(&models.User{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Item{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Message{}); err != nil {
		return err
	}
	// Rótulos amigáveis em pt-BR para a navegação do admin.
	admin.SetCollectionLabel("user", "Usuários")
	admin.SetCollectionLabel("item", "Itens")
	admin.SetCollectionLabel("message", "Mensagens")
	return nil
}

// bootstrapAdmins promove os usuários listados em ADMIN_EMAILS (separados por
// vírgula) para o papel "admin" no boot.
func bootstrapAdmins(db *gorm.DB) error {
	emails := config.AdminEmails()
	if len(emails) == 0 {
		return nil
	}
	for _, email := range emails {
		res := db.Model(&models.User{}).
			Where("email = ?", strings.TrimSpace(email)).
			Update("role", "admin")
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected > 0 {
			log.Printf("admin: %s promoted to admin", email)
		}
	}
	return nil
}
