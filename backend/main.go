package main

import (
	"fazbrike-backend/admin"
	"fazbrike-backend/config"
	"fazbrike-backend/handlers"
	"fazbrike-backend/middleware"
	"fazbrike-backend/models"
	"fazbrike-backend/seed"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Fail-closed checks for JWT (warn in dev, fatal in release)
	_ = config.JWTSecret()

	config.InitDB()
	db := config.GetDB()

	if err := db.AutoMigrate(
		&models.User{},
		&models.UserProfile{},
		&models.Category{},
		&models.Item{},
		&models.ItemImage{},
		&models.Message{},
		&models.Country{},
		&models.State{},
		&models.City{},
		&models.Follow{},
		&models.ItemFavorite{},
		&models.ItemComment{},
		&models.ItemView{},
		&models.Review{},
		&models.Configuration{},
		&models.EmailVerificationCode{},
		&models.ItemSaleFeedback{},
		&models.Boost{},
		&models.AffiliatePartner{},
		&models.AffiliateProduct{},
		&models.Promotion{},
		&models.Notification{},
		&models.DeviceToken{},
		&models.ItemReport{},
	); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	if err := handlers.EnsureItemLocationIndexes(db); err != nil {
		log.Fatal("Failed to ensure item location indexes:", err)
	}
	if err := handlers.EnsureAffiliateProductIndexes(db); err != nil {
		log.Fatal("Failed to ensure affiliate product indexes:", err)
	}
	if err := handlers.EnsurePromotionIndexes(db); err != nil {
		log.Fatal("Failed to ensure promotion indexes:", err)
	}
	if err := handlers.EnsureNotificationIndexes(db); err != nil {
		log.Fatal("Failed to ensure notification indexes:", err)
	}
	if err := handlers.EnsureItemReportSchema(db); err != nil {
		log.Fatal("Failed to ensure item report schema:", err)
	}

	if err := handlers.BackfillItemImages(db); err != nil {
		log.Fatal("Failed to backfill item images:", err)
	}

	if err := seed.EnsureLocationSchema(db); err != nil {
		log.Fatal("Failed to ensure location schema:", err)
	}

	if err := seed.SeedCategories(db); err != nil {
		log.Fatal("Failed to seed categories:", err)
	}

	if err := seed.SeedLocations(db); err != nil {
		log.Fatal("Failed to seed locations:", err)
	}

	if err := seed.SeedConfigurations(db); err != nil {
		log.Fatal("Failed to seed configurations:", err)
	}

	if err := backfillUserProfiles(db); err != nil {
		log.Fatal("Failed to backfill user profiles:", err)
	}

	if err := bootstrapAdmins(db); err != nil {
		log.Fatal("Failed to bootstrap admins:", err)
	}

	if err := seedAffiliatePartners(db); err != nil {
		log.Fatal("Failed to seed affiliate partners:", err)
	}

	if err := initAdminRegistry(); err != nil {
		log.Fatal("Failed to init admin registry:", err)
	}

	r := gin.Default()
	maxMultipart := config.UploadMaxBytes()
	if attachMax := config.MessageAttachmentMaxBytes(); attachMax > maxMultipart {
		maxMultipart = attachMax
	}
	if backupMax := config.BackupMaxBytes(); backupMax > maxMultipart {
		maxMultipart = backupMax
	}
	r.MaxMultipartMemory = maxMultipart
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.CORSAllowlist())

	r.Static("/api/uploads", "./uploads")

	auth := r.Group("/api/auth")
	{
		auth.POST("/register", middleware.RateLimit(20, time.Minute), handlers.Register(db))
		auth.POST("/login", middleware.RateLimit(30, time.Minute), handlers.Login(db))
		auth.POST("/verify-code", middleware.RateLimit(20, time.Minute), handlers.VerifyEmailCode(db))
		auth.POST("/resend-code", middleware.RateLimit(10, time.Minute), handlers.ResendEmailCode(db))
		auth.GET("/me", middleware.AuthMiddleware(), handlers.GetProfile(db))
	}

	users := r.Group("/api/users")
	users.Use(middleware.OptionalAuthMiddleware())
	{
		users.GET("/:id", handlers.GetPublicProfile(db))
		users.GET("/:id/items", handlers.GetUserListings(db))
		users.GET("/:id/reviews", handlers.GetUserReviews(db))
		users.GET("/:id/favorites", handlers.GetUserFavorites(db))
		users.GET("/:id/followers", handlers.GetFollowers(db))
		users.GET("/:id/following", handlers.GetFollowing(db))
		users.POST("/:id/follow", middleware.AuthMiddleware(), handlers.FollowUser(db))
		users.DELETE("/:id/follow", middleware.AuthMiddleware(), handlers.UnfollowUser(db))
	}

	me := r.Group("/api/profile")
	me.Use(middleware.AuthMiddleware())
	{
		me.GET("", handlers.GetMyProfile(db))
		me.PUT("", handlers.UpdateMyProfile(db))
		me.POST("/avatar", handlers.UploadAvatar(db))
		me.POST("/banner", handlers.UploadBanner(db))
	}

	r.GET("/api/categories", handlers.GetCategories(db))
	r.GET("/api/states", handlers.GetStates(db))
	r.GET("/api/cities", handlers.GetCities(db))
	r.GET("/api/affiliate-products", handlers.GetAffiliateProducts(db))
	r.GET("/api/affiliate-products/:id/redirect", handlers.RedirectAffiliateProduct(db))
	r.GET("/api/promotions", handlers.GetPromotions(db))

	notifications := r.Group("/api/notifications")
	notifications.Use(middleware.AuthMiddleware())
	{
		notifications.GET("", handlers.GetNotifications(db))
		notifications.GET("/unread-count", handlers.GetNotificationsUnreadCount(db))
		notifications.PUT("/read-all", handlers.MarkAllNotificationsRead(db))
		notifications.PUT("/:id/read", handlers.MarkNotificationRead(db))
		notifications.DELETE("/:id", handlers.DeleteNotification(db))
	}

	// Aparelhos para push: grupo próprio para não colidir com /:id acima.
	devices := r.Group("/api/devices")
	devices.Use(middleware.AuthMiddleware())
	{
		devices.POST("", handlers.RegisterDeviceToken(db))
		devices.DELETE("", handlers.DeleteDeviceToken(db))
	}

	reviews := r.Group("/api/reviews")
	reviews.Use(middleware.AuthMiddleware())
	{
		reviews.POST("", middleware.RateLimit(20, time.Minute), handlers.CreateReview(db))
		reviews.PUT("/:id", middleware.RateLimit(20, time.Minute), handlers.UpdateReview(db))
		reviews.DELETE("/:id", handlers.DeleteReview(db))
	}

	publicItems := r.Group("/api/items")
	publicItems.Use(middleware.OptionalAuthMiddleware())
	{
		publicItems.GET("", handlers.GetItems(db))
		publicItems.GET("/:id", handlers.GetItemDetails(db))
		publicItems.GET("/:id/comments", handlers.GetItemComments(db))
	}

	protectedItems := r.Group("/api/items")
	protectedItems.Use(middleware.AuthMiddleware())
	{
		protectedItems.POST("", handlers.CreateItem(db))
		protectedItems.GET("/my", handlers.GetUserItems(db))
		protectedItems.PUT("/:id", handlers.UpdateItem(db))
		protectedItems.PUT("/:id/status", handlers.UpdateItemStatus(db))
		protectedItems.POST("/:id/image", handlers.UploadItemImage(db))
		protectedItems.POST("/:id/images", handlers.UploadItemImages(db))
		protectedItems.DELETE("/:id/images/:imageId", handlers.DeleteItemImage(db))
		protectedItems.POST("/:id/favorite", handlers.FavoriteItem(db))
		protectedItems.DELETE("/:id/favorite", handlers.UnfavoriteItem(db))
		protectedItems.POST("/:id/comments", middleware.RateLimit(20, time.Minute), handlers.CreateItemComment(db))
		protectedItems.DELETE("/:id/comments/:commentId", handlers.DeleteItemComment(db))
		protectedItems.POST("/:id/view", handlers.RegisterItemView(db))
		protectedItems.POST("/:id/duplicate", handlers.DuplicateItem(db))
		protectedItems.POST("/:id/boost", handlers.RequestBoost(db))
		protectedItems.POST("/:id/reports", middleware.RateLimit(10, time.Hour), handlers.CreateItemReport(db))
		protectedItems.DELETE("/:id", handlers.DeleteItem(db))
	}

	messages := r.Group("/api/messages")
	messages.Use(middleware.AuthMiddleware())
	messages.Use(middleware.RateLimit(60, time.Minute))
	{
		messages.POST("", handlers.SendMessage(db))
		messages.POST("/attachment", handlers.UploadMessageAttachment(db))
		messages.GET("", handlers.GetConversations(db))
		messages.GET("/item/:itemId", handlers.GetMessagesByItem(db))
		messages.PUT("/item/:itemId/read", handlers.MarkMessagesAsRead(db))
	}

	admin.RegisterRoutes(r, db)

	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func initAdminRegistry() error {
	if err := admin.Register(&models.User{}); err != nil {
		return err
	}
	if err := admin.Register(&models.UserProfile{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Category{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Item{}); err != nil {
		return err
	}
	if err := admin.Register(&models.ItemImage{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Message{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Country{}); err != nil {
		return err
	}
	if err := admin.Register(&models.State{}); err != nil {
		return err
	}
	if err := admin.Register(&models.City{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Follow{}); err != nil {
		return err
	}
	if err := admin.Register(&models.ItemFavorite{}); err != nil {
		return err
	}
	if err := admin.Register(&models.ItemComment{}); err != nil {
		return err
	}
	if err := admin.Register(&models.ItemView{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Review{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Configuration{}); err != nil {
		return err
	}
	if err := admin.Register(&models.EmailVerificationCode{}); err != nil {
		return err
	}
	if err := admin.Register(&models.ItemSaleFeedback{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Boost{}); err != nil {
		return err
	}
	if err := admin.Register(&models.AffiliatePartner{}); err != nil {
		return err
	}
	if err := admin.Register(&models.AffiliateProduct{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Promotion{}); err != nil {
		return err
	}
	if err := admin.Register(&models.Notification{}); err != nil {
		return err
	}
	if err := admin.Register(&models.DeviceToken{}); err != nil {
		return err
	}
	if err := admin.Register(&models.ItemReport{}); err != nil {
		return err
	}
	admin.SetCollectionLabel("user", "Usuários")
	admin.SetCollectionLabel("user_profile", "Perfis")
	admin.SetCollectionLabel("category", "Categorias")
	admin.SetCollectionLabel("item", "Itens")
	admin.SetCollectionLabel("item_image", "Fotos de anúncios")
	admin.SetCollectionLabel("message", "Mensagens")
	admin.SetCollectionLabel("country", "Países")
	admin.SetCollectionLabel("state", "Estados")
	admin.SetCollectionLabel("city", "Cidades")
	admin.SetCollectionLabel("follow", "Seguidores")
	admin.SetCollectionLabel("item_favorite", "Favoritos")
	admin.SetCollectionLabel("item_comment", "Comentários de anúncios")
	admin.SetCollectionLabel("item_view", "Visualizações de anúncios")
	admin.SetCollectionLabel("review", "Avaliações")
	admin.SetCollectionLabel("configuration", "Configurações")
	admin.SetCollectionLabel("email_verification_code", "Códigos de verificação de e-mail")
	admin.SetCollectionLabel("item_sale_feedback", "Avaliações de venda")
	admin.SetCollectionLabel("boost", "Impulsionamentos")
	admin.SetCollectionLabel("affiliate_partner", "Parceiros afiliados")
	admin.SetCollectionLabel("affiliate_product", "Ofertas de afiliados")
	admin.SetCollectionLabel("promotion", "Promoções (banners)")
	admin.SetCollectionLabel("notification", "Notificações")
	admin.SetCollectionLabel("device_token", "Aparelhos (push)")
	admin.SetCollectionLabel("item_report", "Denúncias de anúncios")
	// Precisa rodar depois de todos os Register() acima: liga campos "*_id" às
	// collections que eles referenciam (para o admin mostrar nome em vez de ID).
	admin.ResolveRelations()
	return nil
}

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

// seedAffiliatePartners cria as lojas parceiras iniciais apenas quando a tabela
// ainda está vazia. Depois disso o admin é a fonte da verdade: parceiros
// renomeados, desativados ou removidos no painel não voltam no próximo boot.
func seedAffiliatePartners(db *gorm.DB) error {
	var existing int64
	if err := db.Model(&models.AffiliatePartner{}).Count(&existing).Error; err != nil {
		return err
	}
	if existing > 0 {
		return nil
	}

	partners := []models.AffiliatePartner{
		{Name: "Mercado Livre", Slug: "mercado-livre", WebsiteURL: "https://www.mercadolivre.com.br", IsActive: true},
		{Name: "Shopee", Slug: "shopee", WebsiteURL: "https://shopee.com.br", IsActive: true},
		{Name: "AliExpress", Slug: "aliexpress", WebsiteURL: "https://pt.aliexpress.com", IsActive: true},
		{Name: "Amazon", Slug: "amazon", WebsiteURL: "https://www.amazon.com.br", IsActive: true},
		{Name: "Magazine Luiza", Slug: "magazine-luiza", WebsiteURL: "https://www.magazineluiza.com.br", IsActive: true},
	}
	if err := db.Create(&partners).Error; err != nil {
		return err
	}
	log.Printf("affiliate: %d parceiros iniciais criados", len(partners))
	return nil
}

func backfillUserProfiles(db *gorm.DB) error {
	var users []models.User
	if err := db.Find(&users).Error; err != nil {
		return err
	}
	for _, u := range users {
		if _, err := handlers.EnsureUserProfile(db, u.ID); err != nil {
			return err
		}
	}
	return nil
}
