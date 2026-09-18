package handlers

import "fazbrike-backend/models"

// SanitizePublicUser strips PII/privileged fields before public JSON responses.
func SanitizePublicUser(u *models.User) {
	if u == nil {
		return
	}
	u.Email = ""
	u.Role = ""
}

// SanitizeItemPublic clears nested user PII on a listing.
func SanitizeItemPublic(item *models.Item) {
	if item == nil {
		return
	}
	SanitizePublicUser(&item.User)
}

// SanitizeItemsPublic sanitizes a slice of listings.
func SanitizeItemsPublic(items []models.Item) {
	for i := range items {
		SanitizeItemPublic(&items[i])
	}
}
