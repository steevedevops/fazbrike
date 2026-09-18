package handlers

import (
	"fazbrike-backend/models"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// EnsureUserProfile creates a default profile row if missing.
func EnsureUserProfile(db *gorm.DB, userID uint) (models.UserProfile, error) {
	var profile models.UserProfile
	err := db.Where("user_id = ?", userID).First(&profile).Error
	if err == nil {
		return profile, nil
	}
	if err != gorm.ErrRecordNotFound {
		return profile, err
	}
	profile = models.UserProfile{
		UserID:   userID,
		IsPublic: true,
	}
	if err := db.Create(&profile).Error; err != nil {
		return profile, err
	}
	return profile, nil
}

func syncProfileGeoFromCity(db *gorm.DB, profile *models.UserProfile) error {
	if profile.CityID == nil {
		_ = db.Exec(`UPDATE user_profiles SET location = NULL WHERE id = ?`, profile.ID)
		return nil
	}
	var city models.City
	if err := db.First(&city, *profile.CityID).Error; err != nil {
		return err
	}
	profile.City = city.Name
	var state models.State
	if err := db.First(&state, city.StateID).Error; err == nil {
		profile.State = state.Name
		sid := state.ID
		profile.StateID = &sid
	}
	res := db.Exec(`
		UPDATE user_profiles AS up
		SET location = c.location,
		    city = ?,
		    state = ?,
		    state_id = ?,
		    city_id = ?
		FROM cities AS c
		WHERE up.id = ? AND c.id = ?
	`, profile.City, profile.State, profile.StateID, profile.CityID, profile.ID, *profile.CityID)
	return res.Error
}

func buildPublicProfile(db *gorm.DB, user models.User, profile models.UserProfile, viewerID *uint) models.PublicUserProfile {
	// Private profiles are gated by callers; keep fields as stored for owner view.

	var forSale, sold, favorites, followers, following, ratingCount int64
	var ratingAvg float64

	_ = db.Model(&models.Item{}).Where("user_id = ? AND status = ?", user.ID, "active").Count(&forSale).Error
	_ = db.Model(&models.Item{}).Where("user_id = ? AND status = ?", user.ID, "sold").Count(&sold).Error
	_ = db.Model(&models.ItemFavorite{}).Where("user_id = ?", user.ID).Count(&favorites).Error
	_ = db.Model(&models.Follow{}).Where("following_id = ?", user.ID).Count(&followers).Error
	_ = db.Model(&models.Follow{}).Where("follower_id = ?", user.ID).Count(&following).Error

	type agg struct {
		Avg   *float64
		Count int64
	}
	var a agg
	_ = db.Model(&models.Review{}).
		Select("AVG(rating) as avg, COUNT(*) as count").
		Where("reviewee_id = ?", user.ID).
		Scan(&a).Error
	if a.Avg != nil {
		ratingAvg = *a.Avg
	}
	ratingCount = a.Count

	isFollowing := false
	if viewerID != nil && *viewerID != user.ID {
		var n int64
		_ = db.Model(&models.Follow{}).
			Where("follower_id = ? AND following_id = ?", *viewerID, user.ID).
			Count(&n).Error
		isFollowing = n > 0
	}

	return models.PublicUserProfile{
		ID:             user.ID,
		Name:           user.Name,
		Bio:            profile.Bio,
		City:           profile.City,
		State:          profile.State,
		StateID:        profile.StateID,
		CityID:         profile.CityID,
		AvatarURL:      profile.AvatarURL,
		BannerURL:      profile.BannerURL,
		Website:        profile.Website,
		IsFeatured:     profile.IsFeatured,
		MemberSince:    user.CreatedAt,
		ListingsCount:  forSale + sold,
		ForSaleCount:   forSale,
		SoldCount:      sold,
		FavoritesCount: favorites,
		FollowersCount: followers,
		FollowingCount: following,
		RatingAverage:  ratingAvg,
		RatingCount:    ratingCount,
		IsFollowing:    isFollowing,
	}
}

// GetMyProfile returns the authenticated user + profile.
func GetMyProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		uid := userID.(uint)

		var user models.User
		if err := db.First(&user, uid).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			return
		}
		profile, err := EnsureUserProfile(db, uid)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar perfil"})
			return
		}

		pub := buildPublicProfile(db, user, profile, &uid)
		c.JSON(http.StatusOK, gin.H{
			"user":           user,
			"profile":        profile,
			"public":         pub,
			"listings_count": pub.ListingsCount,
		})
	}
}

// UpdateMyProfile updates profile fields (and optional display name).
func UpdateMyProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		uid := userID.(uint)

		var req struct {
			Name     *string `json:"name"`
			Bio      *string `json:"bio"`
			Phone    *string `json:"phone"`
			City     *string `json:"city"`
			State    *string `json:"state"`
			CityID   *int64  `json:"city_id"`
			StateID  *int64  `json:"state_id"`
			Website  *string `json:"website"`
			IsPublic *bool   `json:"is_public"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var user models.User
		if err := db.First(&user, uid).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			return
		}
		if req.Name != nil {
			name := strings.TrimSpace(*req.Name)
			if name == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Nome é obrigatório"})
				return
			}
			user.Name = name
			user.UpdatedAt = time.Now()
			if err := db.Save(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar nome"})
				return
			}
		}

		profile, err := EnsureUserProfile(db, uid)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar perfil"})
			return
		}
		if req.Bio != nil {
			profile.Bio = strings.TrimSpace(*req.Bio)
		}
		if req.Phone != nil {
			profile.Phone = strings.TrimSpace(*req.Phone)
		}
		if req.Website != nil {
			profile.Website = strings.TrimSpace(*req.Website)
		}
		if req.IsPublic != nil {
			profile.IsPublic = *req.IsPublic
		}

		geoChanged := false
		if req.CityID != nil {
			if *req.CityID <= 0 {
				profile.CityID = nil
				profile.StateID = nil
				profile.City = ""
				profile.State = ""
			} else {
				cid := *req.CityID
				profile.CityID = &cid
			}
			geoChanged = true
		} else {
			if req.City != nil {
				profile.City = strings.TrimSpace(*req.City)
			}
			if req.State != nil {
				profile.State = strings.TrimSpace(*req.State)
			}
			if req.StateID != nil {
				if *req.StateID <= 0 {
					profile.StateID = nil
				} else {
					sid := *req.StateID
					profile.StateID = &sid
				}
			}
		}

		profile.UpdatedAt = time.Now()
		if err := db.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao salvar perfil"})
			return
		}
		if geoChanged {
			if err := syncProfileGeoFromCity(db, &profile); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Cidade inválida"})
				return
			}
			_ = db.Where("user_id = ?", uid).First(&profile)
		}

		pub := buildPublicProfile(db, user, profile, &uid)
		c.JSON(http.StatusOK, gin.H{
			"user":           user,
			"profile":        profile,
			"public":         pub,
			"listings_count": pub.ListingsCount,
		})
	}
}

func canViewPrivateProfile(viewerID *uint, ownerID uint) bool {
	return viewerID != nil && *viewerID == ownerID
}

// GetPublicProfile returns a public shop profile by user id.
func GetPublicProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		id, err := strconv.Atoi(idParam)
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}

		var user models.User
		if err := db.First(&user, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
			return
		}

		profile, err := EnsureUserProfile(db, user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar perfil"})
			return
		}

		var viewerID *uint
		if raw, ok := c.Get("user_id"); ok {
			uid := raw.(uint)
			viewerID = &uid
		}

		if !profile.IsPublic && !canViewPrivateProfile(viewerID, user.ID) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Perfil não encontrado"})
			return
		}

		c.JSON(http.StatusOK, buildPublicProfile(db, user, profile, viewerID))
	}
}

// GetUserListings returns public items for a user (optional status + q).
func GetUserListings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idParam := c.Param("id")
		id, err := strconv.Atoi(idParam)
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
			return
		}

		var viewerID *uint
		if raw, ok := c.Get("user_id"); ok {
			uid := raw.(uint)
			viewerID = &uid
		}
		profile, err := EnsureUserProfile(db, uint(id))
		if err == nil && !profile.IsPublic && !canViewPrivateProfile(viewerID, uint(id)) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Perfil não encontrado"})
			return
		}

		q := db.Where("user_id = ?", id).Preload("User")
		status := strings.TrimSpace(c.Query("status"))
		isOwner := canViewPrivateProfile(viewerID, uint(id))
		if status == "" {
			status = "active"
		}
		if status == "all" && !isOwner {
			status = "active"
		}
		if status != "all" {
			q = q.Where("status = ?", status)
		}
		if search := strings.TrimSpace(c.Query("q")); search != "" {
			like := "%" + search + "%"
			q = q.Where("unaccent(lower(title)) LIKE unaccent(lower(?)) OR unaccent(lower(description)) LIKE unaccent(lower(?))", like, like)
		}
		var items []models.Item
		if err := q.Order("created_at desc").Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar anúncios"})
			return
		}
		enrichItemsSocial(db, items, viewerID)
		SanitizeItemsPublic(items)
		c.JSON(http.StatusOK, items)
	}
}

// UploadAvatar uploads a profile avatar image.
func UploadAvatar(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		uid := userID.(uint)

		imageURL, err := SaveSecureImage(c, "file", "uploads/avatars")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		profile, err := EnsureUserProfile(db, uid)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar perfil"})
			return
		}
		profile.AvatarURL = imageURL
		profile.UpdatedAt = time.Now()
		if err := db.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar avatar"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"avatar_url": imageURL, "profile": profile})
	}
}

// UploadBanner uploads a shop cover image.
func UploadBanner(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não autorizado"})
			return
		}
		uid := userID.(uint)

		imageURL, err := SaveSecureImage(c, "file", "uploads/banners")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		profile, err := EnsureUserProfile(db, uid)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao carregar perfil"})
			return
		}
		profile.BannerURL = imageURL
		profile.UpdatedAt = time.Now()
		if err := db.Save(&profile).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao atualizar capa"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"banner_url": imageURL, "profile": profile})
	}
}
