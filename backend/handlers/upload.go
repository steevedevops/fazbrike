package handlers

import (
	"bytes"
	"fazbrike-backend/config"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var allowedImageMIME = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

// SaveSecureImage validates magic bytes + size and stores under uploadDir.
// Field name is typically "file" or "image".
func SaveSecureImage(c *gin.Context, field, uploadDir string) (publicURL string, err error) {
	file, err := c.FormFile(field)
	if err != nil {
		return "", fmt.Errorf("nenhum arquivo enviado")
	}
	return SaveSecureImageHeader(file, uploadDir)
}

// SaveSecureImageHeader stores one multipart file with the same rules as SaveSecureImage.
func SaveSecureImageHeader(file *multipart.FileHeader, uploadDir string) (publicURL string, err error) {
	max := config.UploadMaxBytes()
	if file.Size > max {
		return "", fmt.Errorf("arquivo muito grande (máx %d MB)", max>>20)
	}

	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("falha ao ler arquivo")
	}
	defer src.Close()

	head := make([]byte, 512)
	n, _ := io.ReadFull(src, head)
	if n == 0 {
		return "", fmt.Errorf("arquivo vazio")
	}
	mime := http.DetectContentType(head[:n])
	ext, ok := allowedImageMIME[mime]
	if !ok {
		return "", fmt.Errorf("tipo de arquivo não permitido (use JPEG, PNG, WebP ou GIF)")
	}

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("falha ao preparar upload")
	}

	filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), uuid.New().String(), ext)
	destPath := filepath.Join(uploadDir, filename)

	out, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return "", fmt.Errorf("falha ao salvar arquivo")
	}
	defer out.Close()

	if _, err := out.Write(head[:n]); err != nil {
		_ = os.Remove(destPath)
		return "", fmt.Errorf("falha ao salvar arquivo")
	}
	if _, err := io.Copy(out, io.LimitReader(src, max)); err != nil {
		_ = os.Remove(destPath)
		return "", fmt.Errorf("falha ao salvar arquivo")
	}

	rel := strings.TrimPrefix(filepath.ToSlash(destPath), "uploads/")
	return "/api/uploads/" + rel, nil
}

// sniff helper kept for tests / reuse
func detectMIME(b []byte) string {
	return http.DetectContentType(bytes.TrimRight(b, "\x00"))
}
