package config

import (
	"log"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
)

const (
	// WeakDefaultJWTSecret is ONLY for local bootstrap; rejected in release.
	WeakDefaultJWTSecret = "fazbrike-secret-key"
	minJWTSecretLen      = 32
)

// JWTSecret returns the signing secret. Prefer env JWT_SECRET.
// In release mode, missing/weak secrets cause Fatal (fail-closed).
func JWTSecret() string {
	s := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	release := isRelease()

	if s == "" || s == WeakDefaultJWTSecret {
		if release {
			log.Fatal("security: JWT_SECRET must be set to a strong unique value (min 32 chars) in production")
		}
		if s == "" {
			log.Println("security WARNING: JWT_SECRET unset — using weak default (dev only)")
			return WeakDefaultJWTSecret
		}
		log.Println("security WARNING: JWT_SECRET is the example weak value — change it before any shared deploy")
		return s
	}
	if len(s) < minJWTSecretLen {
		if release {
			log.Fatal("security: JWT_SECRET must be at least 32 characters")
		}
		log.Printf("security WARNING: JWT_SECRET length %d < %d", len(s), minJWTSecretLen)
	}
	return s
}

// AllowedOrigins returns CORS allowlist from ALLOWED_ORIGINS (comma-separated).
// Empty → localhost frontend/admin defaults for local dev.
func AllowedOrigins() []string {
	raw := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
	if raw == "" {
		return []string{
			"http://localhost:3003",
			"http://127.0.0.1:3003",
			"http://localhost:5174",
			"http://127.0.0.1:5174",
			"http://localhost:3000",
			"http://127.0.0.1:3000",
		}
	}
	return splitComma(raw)
}

// OriginAllowed reports whether origin is in the allowlist.
func OriginAllowed(origin string) bool {
	if origin == "" {
		return false
	}
	for _, o := range AllowedOrigins() {
		if strings.EqualFold(strings.TrimSpace(o), origin) {
			return true
		}
	}
	return false
}

// IsDevFriendlyOrigin allows http(s)://localhost|127.0.0.1|private-LAN in non-release.
// Keeps Next.js "Network" URLs (e.g. http://192.168.x.x:3003) working locally.
func IsDevFriendlyOrigin(origin string) bool {
	if isRelease() {
		return false
	}
	u, err := url.Parse(origin)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return false
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return false
	}
	host := u.Hostname()
	if host == "localhost" || host == "127.0.0.1" || host == "::1" {
		return true
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsPrivate()
}

// UploadMaxBytes returns max upload size from config/env (default 10 MiB).
func UploadMaxBytes() int64 {
	mb := 10
	if v := strings.TrimSpace(Get("UPLOAD_MAX_MB")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 50 {
			mb = n
		}
	}
	return int64(mb) << 20
}

func isRelease() bool {
	mode := strings.ToLower(strings.TrimSpace(os.Getenv("GIN_MODE")))
	return mode == "release"
}

// IsRelease reports whether the server is running with GIN_MODE=release.
func IsRelease() bool {
	return isRelease()
}

// MessageAttachmentMaxBytes returns the max chat attachment size from
// config/env (default 5 MiB), independent of UploadMaxBytes.
func MessageAttachmentMaxBytes() int64 {
	mb := 5
	if v := strings.TrimSpace(Get("MESSAGE_ATTACHMENT_MAX_MB")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 20 {
			mb = n
		}
	}
	return int64(mb) << 20
}

// BackupMaxBytes returns the max size accepted for a database restore upload
// (default 500 MiB) — much larger than image/attachment limits since it's a
// full database + uploads dump, admin-only.
func BackupMaxBytes() int64 {
	mb := 500
	if v := strings.TrimSpace(Get("BACKUP_MAX_MB")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			mb = n
		}
	}
	return int64(mb) << 20
}
