package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// localBackend saves files under ./uploads, served statically at /api/uploads
// (see r.Static in main.go) — same convention already used by avatar/banner/
// item image uploads in handlers/upload.go.
type localBackend struct {
	root string
}

func newLocalBackend() *localBackend {
	return &localBackend{root: "uploads"}
}

func (l *localBackend) Save(key string, content []byte, contentType string) (string, error) {
	destPath := filepath.Join(l.root, filepath.FromSlash(key))
	if err := os.MkdirAll(filepath.Dir(destPath), 0755); err != nil {
		return "", fmt.Errorf("falha ao preparar upload")
	}
	if err := os.WriteFile(destPath, content, 0644); err != nil {
		return "", fmt.Errorf("falha ao salvar arquivo")
	}
	rel := strings.TrimPrefix(filepath.ToSlash(destPath), l.root+"/")
	return "/api/uploads/" + rel, nil
}

func (l *localBackend) IsTrusted(url string) bool {
	return strings.HasPrefix(url, "/api/uploads/") && !strings.Contains(url, "..")
}
