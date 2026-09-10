package config

import (
	"log"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

const (
	// DefaultJWTSecret é usado apenas quando JWT_SECRET não está definido.
	DefaultJWTSecret = "fazbrike-secret-key"
)

// JWTSecret retorna o segredo JWT configurado (env JWT_SECRET) ou o default.
func JWTSecret() string {
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return s
	}
	return DefaultJWTSecret
}

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

func InitDB() {
	var err error
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "fazbrike.db"
	}

	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")
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
