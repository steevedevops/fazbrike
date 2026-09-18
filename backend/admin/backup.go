package admin

import (
	"archive/zip"
	"fazbrike-backend/backup"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// restoreConfirmPhrase must be typed exactly by the admin (front and back)
// before a restore is accepted — a deliberate speed bump for a destructive,
// irreversible operation.
const restoreConfirmPhrase = "APAGAR E RESTAURAR"

// HandleBackupCreate: GET /api/admin/backup — streams a ZIP with a full
// pg_dump (custom format) plus the local uploads directory (when active).
func HandleBackupCreate(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		filename := fmt.Sprintf("fazbrike-backup-%s.zip", time.Now().Format("20060102-150405"))
		c.Header("Content-Type", "application/zip")
		c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")

		zw := zip.NewWriter(c.Writer)
		defer zw.Close()

		dumpWriter, err := zw.Create("database.dump")
		if err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}
		if err := backup.RunPgDump(c.Request.Context(), dumpWriter); err != nil {
			c.Status(http.StatusInternalServerError)
			return
		}

		if backup.LocalStorageActive() {
			if err := backup.ZipUploadsDir(zw); err != nil {
				c.Status(http.StatusInternalServerError)
				return
			}
		}
	}
}

// HandleBackupRestore: POST /api/admin/backup/restore — multipart upload
// (fields "file" and "confirm"). Wipes the current database (and local
// uploads, when present in the backup) and restores exactly what's in the
// uploaded ZIP. Irreversible.
func HandleBackupRestore(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.PostForm("confirm") != restoreConfirmPhrase {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Frase de confirmação incorreta"})
			return
		}

		fileHeader, err := c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nenhum arquivo de backup enviado"})
			return
		}

		tmpDir, err := os.MkdirTemp("", "fazbrike-restore-*")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao preparar restauração"})
			return
		}
		defer os.RemoveAll(tmpDir)

		zipPath := filepath.Join(tmpDir, "backup.zip")
		if err := c.SaveUploadedFile(fileHeader, zipPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao salvar arquivo enviado"})
			return
		}

		zr, err := zip.OpenReader(zipPath)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo de backup inválido (não é um .zip válido)"})
			return
		}
		defer zr.Close()

		dumpPath := filepath.Join(tmpDir, "database.dump")
		if err := extractZipEntry(&zr.Reader, "database.dump", dumpPath); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Backup inválido: database.dump não encontrado no zip"})
			return
		}

		if err := backup.RunPgRestore(c.Request.Context(), db, dumpPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao restaurar banco: " + err.Error()})
			return
		}

		if err := backup.ReplaceUploadsDir(&zr.Reader); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Banco restaurado, mas falhou ao substituir os arquivos de upload: " + err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Backup restaurado com sucesso. Reinicie o backend para garantir que o schema seja reaplicado.",
		})
	}
}

func extractZipEntry(zr *zip.Reader, name, destPath string) error {
	for _, f := range zr.File {
		if f.Name != name {
			continue
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		defer rc.Close()
		out, err := os.Create(destPath)
		if err != nil {
			return err
		}
		defer out.Close()
		_, err = io.Copy(out, rc)
		return err
	}
	return fmt.Errorf("entry %q not found", name)
}
