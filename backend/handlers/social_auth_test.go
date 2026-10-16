package handlers

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func newFirebaseTestServer(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	template := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: "securetoken"},
		NotBefore:    time.Now().Add(-time.Hour),
		NotAfter:     time.Now().Add(time.Hour),
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	certPEM := string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}))
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=600")
		_ = json.NewEncoder(w).Encode(map[string]string{"kid-1": certPEM})
	}))
	t.Cleanup(server.Close)
	firebaseCertsURL = server.URL
	firebaseCerts.Lock()
	firebaseCerts.keys = nil
	firebaseCerts.Unlock()
	return key
}

func signFirebaseToken(t *testing.T, key *rsa.PrivateKey, kid string, mutate func(jwt.MapClaims)) string {
	t.Helper()
	now := time.Now()
	claims := jwt.MapClaims{
		"iss":            "https://securetoken.google.com/fazbrike",
		"aud":            "fazbrike",
		"sub":            "firebase-uid-123",
		"iat":            now.Unix(),
		"exp":            now.Add(time.Hour).Unix(),
		"auth_time":      now.Unix(),
		"email":          "Maria@Exemplo.com",
		"email_verified": true,
		"name":           "Maria Silva",
		"firebase":       map[string]interface{}{"sign_in_provider": "google.com"},
	}
	if mutate != nil {
		mutate(claims)
	}
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = kid
	signed, err := token.SignedString(key)
	if err != nil {
		t.Fatal(err)
	}
	return signed
}

func TestVerifyFirebaseIDToken(t *testing.T) {
	key := newFirebaseTestServer(t)

	identity, err := verifyFirebaseIDToken(signFirebaseToken(t, key, "kid-1", nil))
	if err != nil {
		t.Fatalf("token válido recusado: %v", err)
	}
	if identity.Subject != "firebase-uid-123" || identity.Provider != "google" || identity.Email != "maria@exemplo.com" || !identity.EmailVerified {
		t.Fatalf("identidade inesperada: %+v", identity)
	}

	apple, err := verifyFirebaseIDToken(signFirebaseToken(t, key, "kid-1", func(c jwt.MapClaims) {
		c["firebase"] = map[string]interface{}{"sign_in_provider": "apple.com"}
	}))
	if err != nil || apple.Provider != "apple" {
		t.Fatalf("token Apple: provider=%v err=%v", apple, err)
	}

	otherKey, _ := rsa.GenerateKey(rand.Reader, 2048)
	hs256 := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"aud": "fazbrike", "iss": "https://securetoken.google.com/fazbrike", "sub": "x", "exp": time.Now().Add(time.Hour).Unix()})
	hs256.Header["kid"] = "kid-1"
	hsSigned, _ := hs256.SignedString([]byte("segredo"))

	rejected := map[string]string{
		"audiência de outro projeto": signFirebaseToken(t, key, "kid-1", func(c jwt.MapClaims) { c["aud"] = "jogame-375bc" }),
		"emissor errado":             signFirebaseToken(t, key, "kid-1", func(c jwt.MapClaims) { c["iss"] = "https://securetoken.google.com/outro" }),
		"expirado":                   signFirebaseToken(t, key, "kid-1", func(c jwt.MapClaims) { c["exp"] = time.Now().Add(-2 * time.Hour).Unix() }),
		"login por senha no Firebase": signFirebaseToken(t, key, "kid-1", func(c jwt.MapClaims) {
			c["firebase"] = map[string]interface{}{"sign_in_provider": "password"}
		}),
		"sem sub":                  signFirebaseToken(t, key, "kid-1", func(c jwt.MapClaims) { delete(c, "sub") }),
		"kid desconhecido":         signFirebaseToken(t, key, "kid-2", nil),
		"assinado por outra chave": signFirebaseToken(t, otherKey, "kid-1", nil),
		"HS256":                    hsSigned,
		"lixo":                     "nao.e.jwt",
	}
	for name, token := range rejected {
		if _, err := verifyFirebaseIDToken(token); err == nil {
			t.Errorf("%s: deveria ser recusado", name)
		}
	}
}

func TestVerifyFirebaseIDTokenFailsClosedWithoutCerts(t *testing.T) {
	key := newFirebaseTestServer(t)
	token := signFirebaseToken(t, key, "kid-1", nil)
	firebaseCertsURL = "http://127.0.0.1:1/indisponivel"
	firebaseCerts.Lock()
	firebaseCerts.keys = nil
	firebaseCerts.Unlock()
	if _, err := verifyFirebaseIDToken(token); err == nil {
		t.Fatal("sem certificados o login deve ser negado")
	}
}
