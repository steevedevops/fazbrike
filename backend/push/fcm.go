// Package push entrega notificações fora do app via Firebase Cloud Messaging
// (API HTTP v1). A central in-app continua sendo a fonte de verdade; o push é
// só mais um canal da mesma linha de models.Notification.
package push

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fazbrike-backend/config"
	"fazbrike-backend/models"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

const (
	fcmScope = "https://www.googleapis.com/auth/firebase.messaging"
	// Mesmo canal criado no app (PushLocalNotificationService.androidChannelId).
	androidChannelID = "fazbrike_default"
)

type credentials struct {
	projectID string
	tokens    oauth2.TokenSource
}

// fcmEndpoint é variável para os testes apontarem para um servidor falso.
var fcmEndpoint = "https://fcm.googleapis.com/v1/projects/%s/messages:send"

var (
	mu          sync.Mutex
	cached      *credentials
	cachedKey   [32]byte
	missingOnce sync.Once
	httpClient  = &http.Client{Timeout: 10 * time.Second}
)

// loadCredentials lê a service account do Firebase: configuração
// FIREBASE_CREDENTIALS (JSON colado no admin ou env) e, como fallback, o
// arquivo em FIREBASE_CREDENTIALS_PATH. Troca de credencial invalida o cache.
func loadCredentials() (*credentials, error) {
	raw := strings.TrimSpace(config.Get("FIREBASE_CREDENTIALS"))
	if raw == "" {
		if path := strings.TrimSpace(os.Getenv("FIREBASE_CREDENTIALS_PATH")); path != "" {
			content, err := os.ReadFile(path)
			if err != nil {
				return nil, fmt.Errorf("ler FIREBASE_CREDENTIALS_PATH: %w", err)
			}
			raw = string(content)
		}
	}
	if raw == "" {
		return nil, nil
	}

	key := sha256.Sum256([]byte(raw))
	mu.Lock()
	defer mu.Unlock()
	if cached != nil && cachedKey == key {
		return cached, nil
	}
	creds, err := google.CredentialsFromJSON(context.Background(), []byte(raw), fcmScope)
	if err != nil {
		// Não inclui o conteúdo: é a chave privada da service account.
		return nil, fmt.Errorf("credencial do Firebase inválida")
	}
	if creds.ProjectID == "" {
		return nil, fmt.Errorf("credencial do Firebase sem project_id")
	}
	cached = &credentials{projectID: creds.ProjectID, tokens: creds.TokenSource}
	cachedKey = key
	return cached, nil
}

// NewFCMSender devolve a função plugada em handlers.PushSender. O envio roda
// em goroutine: a ação que gerou o aviso (mensagem, comentário) não espera o FCM.
func NewFCMSender(db *gorm.DB) func(tokens []models.DeviceToken, notification models.Notification) {
	return func(tokens []models.DeviceToken, notification models.Notification) {
		go send(db, tokens, notification)
	}
}

func send(db *gorm.DB, tokens []models.DeviceToken, notification models.Notification) {
	creds, err := loadCredentials()
	if err != nil {
		log.Printf("push: %v", err)
		return
	}
	if creds == nil {
		missingOnce.Do(func() {
			log.Println("push: FIREBASE_CREDENTIALS não configurado — notificações ficam só na central do app")
		})
		return
	}
	accessToken, err := creds.tokens.Token()
	if err != nil {
		log.Printf("push: falha ao obter access token do Firebase: %v", err)
		return
	}
	for _, device := range tokens {
		invalid, err := sendOne(creds.projectID, accessToken.AccessToken, device.Token, notification)
		if invalid {
			// Token de app desinstalado ou expirado: remove para não tentar de novo.
			db.Where("id = ?", device.ID).Delete(&models.DeviceToken{})
			continue
		}
		if err != nil {
			log.Printf("push: falha ao enviar (user=%d device=%d): %v", notification.UserID, device.ID, err)
		}
	}
}

type fcmMessage struct {
	Message struct {
		Token        string            `json:"token"`
		Notification map[string]string `json:"notification"`
		Data         map[string]string `json:"data,omitempty"`
		Android      map[string]any    `json:"android"`
		APNS         map[string]any    `json:"apns"`
	} `json:"message"`
}

// sendOne envia para um aparelho. invalid=true quando o FCM diz que o token
// não existe mais (UNREGISTERED / token malformado).
func sendOne(projectID, accessToken, deviceToken string, notification models.Notification) (invalid bool, err error) {
	var payload fcmMessage
	payload.Message.Token = deviceToken
	payload.Message.Notification = map[string]string{"title": notification.Title, "body": notification.Body}
	data := map[string]string{
		"notification_id": fmt.Sprint(notification.ID),
		"type":            notification.Type,
	}
	if notification.Link != "" {
		data["link"] = notification.Link
	}
	if notification.ItemID != nil {
		data["item_id"] = fmt.Sprint(*notification.ItemID)
	}
	payload.Message.Data = data
	payload.Message.Android = map[string]any{
		"priority":     "high",
		"notification": map[string]any{"channel_id": androidChannelID},
	}
	payload.Message.APNS = map[string]any{
		"payload": map[string]any{"aps": map[string]any{"sound": "default"}},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return false, err
	}
	url := fmt.Sprintf(fcmEndpoint, projectID)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return false, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")
	resp, err := httpClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusOK {
		return false, nil
	}
	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	text := string(respBody)
	if resp.StatusCode == http.StatusNotFound || strings.Contains(text, "UNREGISTERED") ||
		(resp.StatusCode == http.StatusBadRequest && strings.Contains(text, "registration token")) {
		return true, nil
	}
	return false, fmt.Errorf("FCM respondeu %d: %s", resp.StatusCode, text)
}
