package backup

import (
	"bytes"
	"context"
	"fazbrike-backend/config"
	"fmt"
	"os/exec"

	"gorm.io/gorm"
)

// RunPgRestore wipes the public schema (dropping every table/index/etc that
// exists today, restored or not) and re-runs pg_restore against dumpPath, so
// the database afterwards contains exactly — and only — what's in the backup.
func RunPgRestore(ctx context.Context, db *gorm.DB, dumpPath string) error {
	if err := db.Exec(`DROP SCHEMA public CASCADE`).Error; err != nil {
		return fmt.Errorf("drop schema: %w", err)
	}
	if err := db.Exec(`CREATE SCHEMA public`).Error; err != nil {
		return fmt.Errorf("recreate schema: %w", err)
	}
	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS postgis`).Error; err != nil {
		return fmt.Errorf("recreate postgis extension: %w", err)
	}
	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS unaccent`).Error; err != nil {
		return fmt.Errorf("recreate unaccent extension: %w", err)
	}

	conn := config.PGConn()
	cmd := exec.CommandContext(ctx, "pg_restore", "--no-owner", "-d", conn.DBName, dumpPath)
	cmd.Env = conn.Env()
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("pg_restore: %w: %s", err, stderr.String())
	}
	return nil
}
