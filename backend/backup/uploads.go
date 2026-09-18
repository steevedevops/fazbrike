package backup

import (
	"archive/zip"
	"fazbrike-backend/config"
	"io"
	"os"
	"path/filepath"
	"strings"
)

const uploadsDir = "uploads"
const uploadsZipPrefix = "uploads/"

// LocalStorageActive reports whether uploaded files live on local disk
// (as opposed to an external bucket like Backblaze B2) — only then does a
// backup need to include the uploads directory.
func LocalStorageActive() bool {
	return !strings.EqualFold(strings.TrimSpace(config.Get("B2_ENABLED")), "true")
}

// ZipUploadsDir appends every file under ./uploads to zw, namespaced under
// "uploads/". No-ops silently if the directory doesn't exist.
func ZipUploadsDir(zw *zip.Writer) error {
	if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
		return nil
	}
	return filepath.Walk(uploadsDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		rel, err := filepath.Rel(uploadsDir, path)
		if err != nil {
			return err
		}
		w, err := zw.Create(uploadsZipPrefix + filepath.ToSlash(rel))
		if err != nil {
			return err
		}
		f, err := os.Open(path)
		if err != nil {
			return err
		}
		defer f.Close()
		_, err = io.Copy(w, f)
		return err
	})
}

// ReplaceUploadsDir removes the current ./uploads directory entirely and
// re-extracts every "uploads/" entry found in zr in its place. If the backup
// has no uploads entries, ./uploads is simply left removed (nothing to keep).
func ReplaceUploadsDir(zr *zip.Reader) error {
	hasUploads := false
	for _, f := range zr.File {
		if strings.HasPrefix(f.Name, uploadsZipPrefix) {
			hasUploads = true
			break
		}
	}
	if !hasUploads {
		return nil
	}
	if err := os.RemoveAll(uploadsDir); err != nil {
		return err
	}
	for _, f := range zr.File {
		if !strings.HasPrefix(f.Name, uploadsZipPrefix) {
			continue
		}
		rel := strings.TrimPrefix(f.Name, uploadsZipPrefix)
		if rel == "" {
			continue
		}
		dest := filepath.Join(uploadsDir, filepath.FromSlash(rel))
		if strings.HasSuffix(f.Name, "/") {
			if err := os.MkdirAll(dest, 0o755); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
			return err
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		out, err := os.OpenFile(dest, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o644)
		if err != nil {
			rc.Close()
			return err
		}
		_, copyErr := io.Copy(out, rc)
		rc.Close()
		out.Close()
		if copyErr != nil {
			return copyErr
		}
	}
	return nil
}
