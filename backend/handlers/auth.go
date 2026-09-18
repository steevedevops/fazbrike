package handlers

import (
	"crypto/rand"
	"fazbrike-backend/config"
	"fazbrike-backend/mail"
	"fazbrike-backend/models"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	verificationCodeLength   = 6
	verificationCodeValidity = 24 * time.Hour
)

func Register(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos. Verifique e-mail, nome e senha (mín. 8 caracteres)."})
			return
		}

		// Verificar se o usuário já existe
		var existingUser models.User
		if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Usuário já cadastrado"})
			return
		}

		// Hash da senha
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		var user models.User
		code, err := generateVerificationCode()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification code"})
			return
		}

		err = db.Transaction(func(tx *gorm.DB) error {
			user = models.User{
				Email:    req.Email,
				Password: string(hashedPassword),
				Name:     req.Name,
			}
			if err := tx.Create(&user).Error; err != nil {
				return err
			}
			// EmailVerified has a DB default of true (existing/admin-created accounts
			// stay verified); force it to false here since this is a self-registration.
			if err := tx.Model(&user).UpdateColumn("email_verified", false).Error; err != nil {
				return err
			}
			user.EmailVerified = false

			if _, err := EnsureUserProfile(tx, user.ID); err != nil {
				return err
			}

			verification := models.EmailVerificationCode{
				UserID:    user.ID,
				Email:     user.Email,
				Code:      code,
				Type:      "register",
				ExpiresAt: time.Now().Add(verificationCodeValidity),
			}
			if err := tx.Create(&verification).Error; err != nil {
				return err
			}

			return sendVerificationCodeEmail(user.Email, user.Name, code)
		})

		if err != nil {
			log.Printf("auth: falha ao registrar %s: %v", req.Email, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível concluir o cadastro. Tente novamente."})
			return
		}

		c.JSON(http.StatusCreated, models.RegisterResponse{
			Message: "Conta criada! Enviamos um código de verificação para o seu e-mail.",
			Email:   user.Email,
		})
	}
}

func Login(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
			return
		}

		// Buscar usuário
		var user models.User
		if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
			return
		}

		// Verificar senha
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
			return
		}

		if !user.EmailVerified {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Verifique seu e-mail antes de entrar.",
				"details": gin.H{"email_verified": false},
			})
			return
		}

		// Gerar token JWT
		token, err := generateToken(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, models.AuthResponse{
			Token: token,
			User:  user,
		})
	}
}

// VerifyEmailCode confirms a registration/resend code and activates the account.
func VerifyEmailCode(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.VerifyEmailCodeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "E-mail e código são obrigatórios."})
			return
		}
		email := strings.TrimSpace(strings.ToLower(req.Email))
		code := strings.TrimSpace(req.Code)

		var user models.User
		if err := db.Where("email = ?", email).First(&user).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Usuário não encontrado."})
			return
		}

		var verification models.EmailVerificationCode
		err := db.Where(
			"user_id = ? AND email = ? AND code = ? AND type IN (?, ?) AND used_at IS NULL",
			user.ID, email, code, "register", "resend",
		).Order("created_at DESC").First(&verification).Error
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Código inválido ou já utilizado."})
			return
		}

		if time.Now().After(verification.ExpiresAt) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Código expirado. Solicite um novo código."})
			return
		}

		now := time.Now()
		if err := db.Model(&verification).Update("used_at", now).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível verificar o código."})
			return
		}

		if err := db.Model(&user).UpdateColumn("email_verified", true).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível verificar o código."})
			return
		}
		user.EmailVerified = true

		token, err := generateToken(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		c.JSON(http.StatusOK, models.AuthResponse{
			Token: token,
			User:  user,
		})
	}
}

// ResendEmailCode issues a new verification code for an unverified account.
func ResendEmailCode(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.ResendEmailCodeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "E-mail é obrigatório."})
			return
		}
		email := strings.TrimSpace(strings.ToLower(req.Email))

		var user models.User
		if err := db.Where("email = ?", email).First(&user).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado."})
			return
		}

		if user.EmailVerified {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Este e-mail já foi verificado."})
			return
		}

		code, err := generateVerificationCode()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification code"})
			return
		}

		err = db.Transaction(func(tx *gorm.DB) error {
			verification := models.EmailVerificationCode{
				UserID:    user.ID,
				Email:     user.Email,
				Code:      code,
				Type:      "resend",
				ExpiresAt: time.Now().Add(verificationCodeValidity),
			}
			if err := tx.Create(&verification).Error; err != nil {
				return err
			}
			return sendVerificationCodeEmail(user.Email, user.Name, code)
		})

		if err != nil {
			log.Printf("auth: falha ao reenviar código para %s: %v", email, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível reenviar o código. Tente novamente."})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Reenviamos o código de verificação para o seu e-mail."})
	}
}

func GetProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found"})
			return
		}

		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		profile, _ := EnsureUserProfile(db, user.ID)
		c.JSON(http.StatusOK, gin.H{
			"id":             user.ID,
			"email":          user.Email,
			"name":           user.Name,
			"role":           user.Role,
			"email_verified": user.EmailVerified,
			"created_at":     user.CreatedAt,
			"updated_at":     user.UpdatedAt,
			"profile":        profile,
		})
	}
}

func generateToken(user models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.JWTSecret()))
}

// generateVerificationCode returns a cryptographically random numeric code.
func generateVerificationCode() (string, error) {
	const digits = "0123456789"
	buf := make([]byte, verificationCodeLength)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	code := make([]byte, verificationCodeLength)
	for i, b := range buf {
		code[i] = digits[int(b)%len(digits)]
	}
	return string(code), nil
}

// sendVerificationCodeEmail sends the code and logs it locally outside of
// release mode so registration/verification can be tested before Mailgun
// credentials are filled in Configuration.
func sendVerificationCodeEmail(email, name, code string) error {
	if !config.IsRelease() {
		log.Printf("mail: [dev] código de verificação para %s: %s", email, code)
	}

	err := mail.Send(
		email,
		name,
		"Fazbrike — código de verificação da conta",
		"verification_code",
		map[string]any{
			"Name":       name,
			"Code":       code,
			"ValidHours": int(verificationCodeValidity.Hours()),
		},
	)
	if err != nil {
		if !config.IsRelease() {
			log.Printf("mail: envio real falhou em dev (%v); seguindo com o código logado acima", err)
			return nil
		}
		return fmt.Errorf("falha ao enviar e-mail de verificação: %w", err)
	}
	return nil
}
