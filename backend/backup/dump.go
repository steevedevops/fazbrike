// Package backup implements on-demand database backup/restore for the admin
// panel: a full pg_dump (custom format) plus the local uploads directory,
// bundled into a single ZIP, and a destructive restore that wipes the
// current database/uploads and replaces them with the backup's contents.
package backup

import (
	"bytes"
	"context"
	"fazbrike-backend/config"
	"fmt"
	"io"
	"os/exec"
)

// RunPgDump streams a custom-format (-Fc) pg_dump of the current database to w.
func RunPgDump(ctx context.Context, w io.Writer) error {
	conn := config.PGConn()
	cmd := exec.CommandContext(ctx, "pg_dump", "-Fc", "--no-owner")
	cmd.Env = conn.Env()
	cmd.Stdout = w
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("pg_dump: %w: %s", err, stderr.String())
	}
	return nil
}
