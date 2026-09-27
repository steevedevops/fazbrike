package config

import (
	"fazbrike-backend/models"
	"os"
	"strings"
)

var defaults = map[string]string{
	"SITE_NAME":                         "Fazbrike",
	"SUPPORT_EMAIL":                     "",
	"MAILGUN_API_KEY":                   "",
	"MAILGUN_DOMAIN":                    "",
	"MAILGUN_EMAIL_DE":                  "",
	"MAILGUN_EMAIL_DE_NOME":             "Fazbrike",
	"MAILGUN_EMAIL_RESPONDER_PARA":      "",
	"MAILGUN_EMAIL_RESPONDER_PARA_NOME": "",
	"UPLOAD_MAX_MB":                     "10",
	"MESSAGE_ATTACHMENT_MAX_MB":         "5",
	"BACKUP_MAX_MB":                     "500",
	"B2_ENABLED":                        "false",
	"B2_ACCESS_KEY_ID":                  "",
	"B2_SECRET_ACCESS_KEY":              "",
	"B2_BUCKET_NAME":                    "",
	"B2_ENDPOINT":                       "https://s3.us-east-005.backblazeb2.com",
	"B2_REGION":                         "us-east-005",
	"ITEM_MODERATION_ENABLED":           "false",
}

// Get returns a configuration value with priority: DB → env → hardcoded default.
func Get(key string) string {
	if DB != nil {
		var row models.Configuration
		if err := DB.Where("key = ?", key).First(&row).Error; err == nil {
			if strings.TrimSpace(row.Value) != "" {
				return row.Value
			}
		}
	}
	if v := os.Getenv(key); v != "" {
		return v
	}
	if v, ok := defaults[key]; ok {
		return v
	}
	return ""
}

// DefaultKeys returns the known configuration keys and their defaults (for seeding).
func DefaultKeys() map[string]string {
	out := make(map[string]string, len(defaults))
	for k, v := range defaults {
		out[k] = v
	}
	return out
}

// ItemModerationEnabled define se anúncios novos ou alterados precisam de
// aprovação administrativa antes de aparecerem publicamente.
func ItemModerationEnabled() bool {
	return strings.EqualFold(strings.TrimSpace(Get("ITEM_MODERATION_ENABLED")), "true")
}
