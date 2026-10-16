package push

import (
	"encoding/json"
	"fazbrike-backend/models"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSendOnePayloadAndInvalidToken(t *testing.T) {
	var got map[string]any
	var auth string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth = r.Header.Get("Authorization")
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &got)
		message := got["message"].(map[string]any)
		if message["token"] == "morto" {
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"error":{"status":"NOT_FOUND","details":[{"errorCode":"UNREGISTERED"}]}}`))
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()
	fcmEndpoint = server.URL + "/%s"

	itemID := uint(42)
	notification := models.Notification{ID: 7, Type: "comment", Title: "Nova pergunta", Body: "Ainda está disponível?", Link: "/produto/42", ItemID: &itemID}

	invalid, err := sendOne("fazbrike", "access", "vivo", notification)
	if err != nil || invalid {
		t.Fatalf("envio válido falhou: invalid=%v err=%v", invalid, err)
	}
	if auth != "Bearer access" {
		t.Fatalf("Authorization = %q", auth)
	}
	message := got["message"].(map[string]any)
	data := message["data"].(map[string]any)
	if data["link"] != "/produto/42" || data["notification_id"] != "7" || data["item_id"] != "42" || data["type"] != "comment" {
		t.Fatalf("data inesperado: %v", data)
	}
	if message["notification"].(map[string]any)["title"] != "Nova pergunta" {
		t.Fatalf("notification inesperada: %v", message["notification"])
	}
	channel := message["android"].(map[string]any)["notification"].(map[string]any)["channel_id"]
	if channel != androidChannelID {
		t.Fatalf("channel_id = %v", channel)
	}

	invalid, err = sendOne("fazbrike", "access", "morto", notification)
	if err != nil || !invalid {
		t.Fatalf("token UNREGISTERED deveria ser inválido: invalid=%v err=%v", invalid, err)
	}
}
