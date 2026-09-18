package storage

import (
	"bytes"
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"fazbrike-backend/config"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// b2Backend uploads to a Backblaze B2 bucket via its S3-compatible API.
// The bucket must be public (anonymous read) — we store the plain object URL
// directly in the database, not a presigned/expiring one (see storage.go).
type b2Backend struct {
	client   *s3.Client
	bucket   string
	endpoint string
}

const putTimeout = 20 * time.Second

func newB2Backend() (*b2Backend, error) {
	accessKeyID := strings.TrimSpace(config.Get("B2_ACCESS_KEY_ID"))
	secretKey := strings.TrimSpace(config.Get("B2_SECRET_ACCESS_KEY"))
	bucket := strings.TrimSpace(config.Get("B2_BUCKET_NAME"))
	endpoint := strings.TrimSpace(config.Get("B2_ENDPOINT"))
	region := strings.TrimSpace(config.Get("B2_REGION"))

	if accessKeyID == "" || secretKey == "" || bucket == "" || endpoint == "" {
		return nil, fmt.Errorf("B2_ACCESS_KEY_ID/B2_SECRET_ACCESS_KEY/B2_BUCKET_NAME/B2_ENDPOINT ausentes em Configuration")
	}

	client := s3.New(s3.Options{
		Region:       region,
		Credentials:  credentials.NewStaticCredentialsProvider(accessKeyID, secretKey, ""),
		BaseEndpoint: aws.String(endpoint),
		UsePathStyle: true,
	})

	return &b2Backend{client: client, bucket: bucket, endpoint: strings.TrimRight(endpoint, "/")}, nil
}

func (b *b2Backend) Save(key string, content []byte, contentType string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), putTimeout)
	defer cancel()

	_, err := b.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(b.bucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(content),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("falha ao enviar para o Backblaze: %w", err)
	}

	return fmt.Sprintf("%s/%s/%s", b.endpoint, b.bucket, key), nil
}

func (b *b2Backend) IsTrusted(rawURL string) bool {
	u, err := url.Parse(rawURL)
	if err != nil {
		return false
	}
	endpointURL, err := url.Parse(b.endpoint)
	if err != nil {
		return false
	}
	return strings.EqualFold(u.Host, endpointURL.Host) &&
		strings.HasPrefix(u.Path, "/"+b.bucket+"/") &&
		!strings.Contains(u.Path, "..")
}
