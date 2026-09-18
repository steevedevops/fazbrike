// Package mail sends transactional email via Mailgun, mirroring the
// Configuration-backed pattern used by the plago_backend Jogame/Mailgun client:
// credentials come from the admin-editable `configurations` table (config.Get),
// with env vars as a local-dev fallback.
package mail

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"fazbrike-backend/config"
)

//go:embed templates/*.html
var templatesFS embed.FS

const (
	baseURL        = "https://api.mailgun.net/v3"
	requestTimeout = 15 * time.Second
)

// Send renders `templates/<templateName>.html` (extending templates/base.html)
// with data and sends it via the Mailgun HTTP API.
func Send(toEmail, toName, subject, templateName string, data any) error {
	html, err := renderTemplate(templateName, data)
	if err != nil {
		return err
	}

	apiKey := strings.TrimSpace(config.Get("MAILGUN_API_KEY"))
	domain := strings.TrimSpace(config.Get("MAILGUN_DOMAIN"))
	if apiKey == "" || domain == "" {
		return fmt.Errorf("mailgun: MAILGUN_API_KEY/MAILGUN_DOMAIN não configurados em Configuration")
	}

	from := formatAddress(config.Get("MAILGUN_EMAIL_DE"), config.Get("MAILGUN_EMAIL_DE_NOME"))
	if from == "" {
		return fmt.Errorf("mailgun: MAILGUN_EMAIL_DE não configurado em Configuration")
	}

	form := url.Values{}
	form.Set("from", from)
	form.Set("to", formatAddress(toEmail, toName))
	form.Set("subject", subject)
	form.Set("html", html)
	if replyTo := formatAddress(config.Get("MAILGUN_EMAIL_RESPONDER_PARA"), config.Get("MAILGUN_EMAIL_RESPONDER_PARA_NOME")); replyTo != "" {
		form.Set("h:Reply-To", replyTo)
	}

	req, err := http.NewRequest(http.MethodPost, fmt.Sprintf("%s/%s/messages", baseURL, domain), strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth("api", apiKey)

	client := &http.Client{Timeout: requestTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("mailgun: falha ao enviar e-mail: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2<<10))
		return fmt.Errorf("mailgun: HTTP %d ao enviar para %s: %s", resp.StatusCode, toEmail, strings.TrimSpace(string(body)))
	}

	log.Printf("mail: e-mail '%s' enviado para %s", subject, toEmail)
	return nil
}

func renderTemplate(name string, data any) (string, error) {
	tmpl, err := template.ParseFS(templatesFS, "templates/base.html", "templates/"+name+".html")
	if err != nil {
		return "", fmt.Errorf("mail: falha ao carregar template %q: %w", name, err)
	}

	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, "base.html", data); err != nil {
		return "", fmt.Errorf("mail: falha ao renderizar template %q: %w", name, err)
	}
	return buf.String(), nil
}

// formatAddress returns "Nome <email>" or just the email.
func formatAddress(email, name string) string {
	email = strings.TrimSpace(email)
	name = strings.TrimSpace(name)
	if email == "" {
		return ""
	}
	if name != "" {
		return fmt.Sprintf("%s <%s>", name, email)
	}
	return email
}
