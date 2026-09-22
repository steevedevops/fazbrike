package models

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"time"

	"gorm.io/gorm"
)

var affiliatePartnerSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

// AffiliatePartner represents a store or marketplace that provides affiliate
// offers. Keeping partners separate prevents inconsistent platform names and
// makes it possible to pause every offer from one partner at once.
type AffiliatePartner struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Name       string    `gorm:"type:text;not null" json:"name" admin:"label:Nome"`
	Slug       string    `gorm:"type:text;not null;uniqueIndex" json:"slug" admin:"label:Identificador (slug)"`
	WebsiteURL string    `gorm:"type:text" json:"website_url" admin:"label:Site"`
	IsActive   bool      `gorm:"not null;default:true" json:"is_active" admin:"label:Ativo"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (AffiliatePartner) TableName() string { return "affiliate_partners" }

func (partner *AffiliatePartner) BeforeSave(_ *gorm.DB) error {
	partner.Name = strings.TrimSpace(partner.Name)
	partner.Slug = strings.ToLower(strings.TrimSpace(partner.Slug))
	partner.WebsiteURL = strings.TrimSpace(partner.WebsiteURL)

	if partner.Name == "" {
		return fmt.Errorf("o nome do parceiro é obrigatório")
	}
	if !affiliatePartnerSlugPattern.MatchString(partner.Slug) {
		return fmt.Errorf("o slug deve usar apenas letras minúsculas, números e hífens")
	}
	if partner.WebsiteURL != "" && !IsHTTPURL(partner.WebsiteURL) {
		return fmt.Errorf("a URL do site do parceiro deve começar com http:// ou https://")
	}
	return nil
}

// IsHTTPURL accepts only absolute HTTP(S) URLs with a hostname. It is shared
// by affiliate models and the redirect handler to fail closed on unsafe links.
func IsHTTPURL(raw string) bool {
	parsed, err := url.ParseRequestURI(strings.TrimSpace(raw))
	if err != nil {
		return false
	}
	return (parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Hostname() != ""
}
