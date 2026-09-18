package config

import (
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

const (
	defaultDBHost     = "127.0.0.1"
	defaultDBPort     = "5437"
	defaultDBUser     = "webmaster"
	defaultDBPassword = "pgsql.dev"
	defaultDBName     = "fazbrike"
	defaultDBSSLMode  = "disable"
)

// AdminEmails retorna a lista de emails promovidos a admin no boot (env ADMIN_EMAILS, separado por vírgula).
func AdminEmails() []string {
	raw := os.Getenv("ADMIN_EMAILS")
	if raw == "" {
		return nil
	}
	emails := []string{}
	for _, e := range splitComma(raw) {
		if e != "" {
			emails = append(emails, e)
		}
	}
	return emails
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// PostgresDSN builds the connection string from env (with local PostGIS defaults).
func PostgresDSN() string {
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}
	host := envOr("DB_HOST", defaultDBHost)
	port := envOr("DB_PORT", defaultDBPort)
	user := envOr("DB_USER", defaultDBUser)
	password := envOr("DB_PASSWORD", defaultDBPassword)
	name := envOr("DB_NAME", defaultDBName)
	sslmode := envOr("DB_SSLMODE", defaultDBSSLMode)
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=America/Sao_Paulo",
		host, user, password, name, port, sslmode,
	)
}

// PGConnInfo holds the individual connection parameters (used to build the
// env for pg_dump/pg_restore subprocesses, which don't accept a GORM-style DSN).
type PGConnInfo struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// PGConn returns the current Postgres connection parameters from env
// (DATABASE_URL takes priority, same as PostgresDSN).
func PGConn() PGConnInfo {
	if raw := os.Getenv("DATABASE_URL"); raw != "" {
		if u, err := url.Parse(raw); err == nil {
			password, _ := u.User.Password()
			sslmode := u.Query().Get("sslmode")
			if sslmode == "" {
				sslmode = defaultDBSSLMode
			}
			return PGConnInfo{
				Host:     u.Hostname(),
				Port:     envOrDefault(u.Port(), defaultDBPort),
				User:     u.User.Username(),
				Password: password,
				DBName:   strings.TrimPrefix(u.Path, "/"),
				SSLMode:  sslmode,
			}
		}
	}
	return PGConnInfo{
		Host:     envOr("DB_HOST", defaultDBHost),
		Port:     envOr("DB_PORT", defaultDBPort),
		User:     envOr("DB_USER", defaultDBUser),
		Password: envOr("DB_PASSWORD", defaultDBPassword),
		DBName:   envOr("DB_NAME", defaultDBName),
		SSLMode:  envOr("DB_SSLMODE", defaultDBSSLMode),
	}
}

// Env returns the parameters as PG* environment variables understood by
// pg_dump/pg_restore/psql subprocesses.
func (c PGConnInfo) Env() []string {
	return []string{
		"PGHOST=" + c.Host,
		"PGPORT=" + c.Port,
		"PGUSER=" + c.User,
		"PGPASSWORD=" + c.Password,
		"PGDATABASE=" + c.DBName,
		"PGSSLMODE=" + c.SSLMode,
	}
}

func envOrDefault(v, fallback string) string {
	if v != "" {
		return v
	}
	return fallback
}

func InitDB() {
	var err error
	DB, err = gorm.Open(postgres.Open(PostgresDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	if err := DB.Exec(`CREATE EXTENSION IF NOT EXISTS postgis`).Error; err != nil {
		log.Fatal("Failed to enable postgis extension:", err)
	}
	if err := DB.Exec(`CREATE EXTENSION IF NOT EXISTS unaccent`).Error; err != nil {
		log.Fatal("Failed to enable unaccent extension:", err)
	}

	log.Println("Database connected successfully (Postgres/PostGIS)")
}

func GetDB() *gorm.DB {
	return DB
}

func splitComma(s string) []string {
	out := []string{}
	start := -1
	for i := 0; i <= len(s); i++ {
		if i == len(s) || s[i] == ',' {
			if start >= 0 {
				part := s[start:i]
				for part != "" && (part[0] == ' ' || part[0] == '\t') {
					part = part[1:]
				}
				for part != "" && (part[len(part)-1] == ' ' || part[len(part)-1] == '\t') {
					part = part[:len(part)-1]
				}
				out = append(out, part)
			}
			start = -1
		} else if start < 0 {
			start = i
		}
	}
	return out
}
