// Package storage abstracts where uploaded files (currently: chat attachments)
// are saved, mirroring the plago_backend Jogame pattern of a DB-configurable,
// lazily-selected backend: local disk by default, Backblaze B2 (S3-compatible)
// when B2_ENABLED and credentials are present in Configuration. Unlike the
// Django app (which stores object keys and signs URLs on every read), this
// backend stores the final public URL directly — so a B2 bucket must be
// configured for public/anonymous read.
package storage

import (
	"log"
	"strings"

	"fazbrike-backend/config"
)

// Backend saves file content under key and returns its public URL.
type Backend interface {
	Save(key string, content []byte, contentType string) (url string, err error)
	// IsTrusted reports whether url was produced by this backend — used to
	// validate client-supplied attachment URLs before persisting a message.
	IsTrusted(url string) bool
}

// Current returns the active backend: B2 when enabled and configured,
// otherwise local disk. Cheap to call per-request — no persistent client.
func Current() Backend {
	if strings.EqualFold(strings.TrimSpace(config.Get("B2_ENABLED")), "true") {
		b, err := newB2Backend()
		if err == nil {
			return b
		}
		log.Printf("storage: B2_ENABLED=true mas configuração incompleta/inválida (%v) — usando disco local", err)
	}
	return newLocalBackend()
}

// IsTrustedURL reports whether url was produced by the currently active
// storage backend.
func IsTrustedURL(url string) bool {
	url = strings.TrimSpace(url)
	if url == "" {
		return true
	}
	return Current().IsTrusted(url)
}
