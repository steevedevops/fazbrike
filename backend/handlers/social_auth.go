package handlers

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fazbrike-backend/config"
	"fazbrike-backend/models"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Certificados públicos que assinam os ID tokens do Firebase Authentication.
var firebaseCertsURL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"

var firebaseCerts = struct {
	sync.Mutex
	keys    map[string]*rsa.PublicKey
	expires time.Time
}{}

var maxAgeRe = regexp.MustCompile(`max-age=(\d+)`)

// firebaseProjectID é o projeto do Firebase cujo token é aceito (aud/iss).
func firebaseProjectID() string {
	if value := strings.TrimSpace(config.Get("FIREBASE_PROJECT_ID")); value != "" {
		return value
	}
	return "fazbrike"
}

// firebasePublicKey devolve a chave do kid, renovando o cache quando expira.
// Falha ao buscar os certificados = login negado (fail-closed).
func firebasePublicKey(kid string) (*rsa.PublicKey, error) {
	firebaseCerts.Lock()
	defer firebaseCerts.Unlock()
	if firebaseCerts.keys == nil || time.Now().After(firebaseCerts.expires) {
		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Get(firebaseCertsURL)
		if err != nil {
			return nil, fmt.Errorf("certificados do Firebase indisponíveis: %w", err)
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("certificados do Firebase: HTTP %d", resp.StatusCode)
		}
		var pemByKid map[string]string
		if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&pemByKid); err != nil {
			return nil, fmt.Errorf("certificados do Firebase inválidos: %w", err)
		}
		keys := make(map[string]*rsa.PublicKey, len(pemByKid))
		for id, value := range pemByKid {
			block, _ := pem.Decode([]byte(value))
			if block == nil {
				continue
			}
			cert, err := x509.ParseCertificate(block.Bytes)
			if err != nil {
				continue
			}
			if key, ok := cert.PublicKey.(*rsa.PublicKey); ok {
				keys[id] = key
			}
		}
		maxAge := time.Hour
		if match := maxAgeRe.FindStringSubmatch(resp.Header.Get("Cache-Control")); match != nil {
			if seconds, err := strconv.Atoi(match[1]); err == nil && seconds > 0 {
				maxAge = time.Duration(seconds) * time.Second
			}
		}
		firebaseCerts.keys = keys
		firebaseCerts.expires = time.Now().Add(maxAge)
	}
	key, ok := firebaseCerts.keys[kid]
	if !ok {
		return nil, errors.New("chave do token desconhecida")
	}
	return key, nil
}

type firebaseIdentity struct {
	Subject       string
	Provider      string // "google" ou "apple"
	Email         string
	EmailVerified bool
	Name          string
}

// verifyFirebaseIDToken valida assinatura (RS256), emissor, audiência e
// validade do token, como descrito na documentação do Firebase Admin.
func verifyFirebaseIDToken(raw string) (*firebaseIdentity, error) {
	projectID := firebaseProjectID()
	claims := jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(raw, claims, func(token *jwt.Token) (interface{}, error) {
		kid, _ := token.Header["kid"].(string)
		if kid == "" {
			return nil, errors.New("token sem kid")
		}
		return firebasePublicKey(kid)
	},
		jwt.WithValidMethods([]string{"RS256"}),
		jwt.WithAudience(projectID),
		jwt.WithIssuer("https://securetoken.google.com/"+projectID),
		jwt.WithExpirationRequired(),
		jwt.WithIssuedAt(),
		jwt.WithLeeway(time.Minute),
	)
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("token inválido: %w", err)
	}
	subject, _ := claims["sub"].(string)
	if subject == "" || len(subject) > 128 {
		return nil, errors.New("token sem sub")
	}
	if authTime, ok := claims["auth_time"].(float64); !ok || time.Unix(int64(authTime), 0).After(time.Now().Add(time.Minute)) {
		return nil, errors.New("auth_time inválido")
	}

	identity := &firebaseIdentity{Subject: subject}
	identity.Email, _ = claims["email"].(string)
	identity.Email = strings.ToLower(strings.TrimSpace(identity.Email))
	identity.EmailVerified, _ = claims["email_verified"].(bool)
	identity.Name, _ = claims["name"].(string)
	if firebaseClaim, ok := claims["firebase"].(map[string]interface{}); ok {
		switch firebaseClaim["sign_in_provider"] {
		case "google.com":
			identity.Provider = "google"
		case "apple.com":
			identity.Provider = "apple"
		}
	}
	if identity.Provider == "" {
		return nil, errors.New("provedor de login não suportado")
	}
	return identity, nil
}

var errSocialLogin = errors.New("social login")

// SocialLogin troca um ID token do Firebase (Google/Apple) pelo JWT do Fazbrike.
// Conta nova exige aceite dos termos; conta existente com o mesmo e-mail só é
// vinculada quando o provedor garante que o e-mail foi verificado.
func SocialLogin(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			IDToken     string `json:"id_token"`
			Name        string `json:"name"`
			AcceptTerms bool   `json:"accept_terms"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.IDToken) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Login social inválido"})
			return
		}
		identity, err := verifyFirebaseIDToken(strings.TrimSpace(req.IDToken))
		if err != nil {
			log.Printf("social login: token recusado: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Não foi possível confirmar seu login. Tente novamente."})
			return
		}

		var user models.User
		status, message := 0, ""
		err = db.Transaction(func(tx *gorm.DB) error {
			var account models.SocialAccount
			if err := tx.Where("subject = ?", identity.Subject).First(&account).Error; err == nil {
				if err := tx.First(&user, account.UserID).Error; err != nil {
					status, message = http.StatusForbidden, "Esta conta foi desativada. Fale com a Central de ajuda."
					return errSocialLogin
				}
				return tx.Model(&account).Updates(map[string]interface{}{"last_used_at": time.Now(), "email": identity.Email}).Error
			} else if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}

			if identity.Email == "" {
				status, message = http.StatusBadRequest, "O provedor não informou seu e-mail. Autorize o compartilhamento do e-mail e tente de novo."
				return errSocialLogin
			}
			var deleted int64
			if err := tx.Unscoped().Model(&models.User{}).Where("email = ? AND deleted_at IS NOT NULL", identity.Email).Count(&deleted).Error; err != nil {
				return err
			}
			if deleted > 0 {
				status, message = http.StatusForbidden, "Esta conta foi desativada. Fale com a Central de ajuda."
				return errSocialLogin
			}

			err := tx.Where("email = ?", identity.Email).First(&user).Error
			switch {
			case err == nil:
				if !identity.EmailVerified {
					status, message = http.StatusConflict, "Já existe uma conta com este e-mail. Entre com e-mail e senha."
					return errSocialLogin
				}
				// O provedor comprovou a posse do e-mail: vale como verificação.
				if !user.EmailVerified {
					if err := tx.Model(&user).UpdateColumn("email_verified", true).Error; err != nil {
						return err
					}
					user.EmailVerified = true
				}
			case errors.Is(err, gorm.ErrRecordNotFound):
				if !req.AcceptTerms {
					status, message = http.StatusBadRequest, "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade."
					return errSocialLogin
				}
				if user, err = createSocialUser(tx, identity, req.Name); err != nil {
					return err
				}
			default:
				return err
			}

			return tx.Create(&models.SocialAccount{
				UserID:     user.ID,
				Provider:   identity.Provider,
				Subject:    identity.Subject,
				Email:      identity.Email,
				LastUsedAt: time.Now(),
			}).Error
		})
		if errors.Is(err, errSocialLogin) {
			c.JSON(status, gin.H{"error": message})
			return
		}
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível entrar agora. Tente novamente."})
			return
		}

		token, err := generateToken(user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível entrar agora. Tente novamente."})
			return
		}
		c.JSON(http.StatusOK, models.AuthResponse{Token: token, User: user})
	}
}

func createSocialUser(tx *gorm.DB, identity *firebaseIdentity, requestedName string) (models.User, error) {
	name := strings.TrimSpace(requestedName)
	if name == "" {
		name = strings.TrimSpace(identity.Name)
	}
	if name == "" {
		name = strings.SplitN(identity.Email, "@", 2)[0]
	}
	if utf8.RuneCountInString(name) > 120 {
		name = string([]rune(name)[:120])
	}
	// Conta social não tem senha conhecida: hash de um valor aleatório.
	secret := make([]byte, 32)
	if _, err := rand.Read(secret); err != nil {
		return models.User{}, err
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(hex.EncodeToString(secret)), bcrypt.DefaultCost)
	if err != nil {
		return models.User{}, err
	}
	acceptedAt := time.Now()
	user := models.User{
		Email:           identity.Email,
		Password:        string(hashed),
		Name:            name,
		EmailVerified:   true,
		TermsAcceptedAt: &acceptedAt,
	}
	if err := tx.Create(&user).Error; err != nil {
		return models.User{}, err
	}
	if _, err := EnsureUserProfile(tx, user.ID); err != nil {
		return models.User{}, err
	}
	return user, nil
}
