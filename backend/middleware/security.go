package middleware

import (
	"fazbrike-backend/config"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders sets baseline browser hardening headers.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")
		c.Writer.Header().Set("X-Frame-Options", "DENY")
		c.Writer.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Writer.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Next()
	}
}

// CORSAllowlist allows configured origins. In non-release mode also allows
// localhost / private-LAN origins so Next.js "Network" URLs keep working.
func CORSAllowlist() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" && (config.OriginAllowed(origin) || config.IsDevFriendlyOrigin(origin)) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Vary", "Origin")
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

type rateBucket struct {
	count   int
	resetAt time.Time
}

// RateLimit is a simple per-IP sliding window limiter (in-memory; single process).
func RateLimit(max int, window time.Duration) gin.HandlerFunc {
	var mu sync.Mutex
	buckets := map[string]*rateBucket{}

	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()
		mu.Lock()
		b, ok := buckets[ip]
		if !ok || now.After(b.resetAt) {
			b = &rateBucket{count: 0, resetAt: now.Add(window)}
			buckets[ip] = b
		}
		b.count++
		n := b.count
		mu.Unlock()
		if n > max {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "Muitas tentativas. Aguarde e tente novamente."})
			return
		}
		c.Next()
	}
}
