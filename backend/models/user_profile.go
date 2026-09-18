package models

import "time"

// UserProfile holds public marketplace profile details for a user.
type UserProfile struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	User       User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Bio        string    `gorm:"type:text" json:"bio"`
	Phone      string    `json:"phone"`
	City       string    `json:"city"`
	State      string    `json:"state"`
	StateID    *int64    `gorm:"index" json:"state_id,omitempty"`
	CityID     *int64    `gorm:"index" json:"city_id,omitempty"`
	AvatarURL  string    `json:"avatar_url"`
	BannerURL  string    `json:"banner_url"`
	Website    string    `json:"website"`
	IsPublic   bool      `gorm:"not null;default:true" json:"is_public"`
	IsFeatured bool      `gorm:"not null;default:false" json:"is_featured"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// PublicUserProfile is the safe payload for public profile / shop pages.
type PublicUserProfile struct {
	ID              uint      `json:"id"`
	Name            string    `json:"name"`
	Bio             string    `json:"bio"`
	City            string    `json:"city"`
	State           string    `json:"state"`
	StateID         *int64    `json:"state_id,omitempty"`
	CityID          *int64    `json:"city_id,omitempty"`
	AvatarURL       string    `json:"avatar_url"`
	BannerURL       string    `json:"banner_url"`
	Website         string    `json:"website"`
	IsFeatured      bool      `json:"is_featured"`
	MemberSince     time.Time `json:"member_since"`
	ListingsCount   int64     `json:"listings_count"`
	ForSaleCount    int64     `json:"for_sale_count"`
	SoldCount       int64     `json:"sold_count"`
	FavoritesCount  int64     `json:"favorites_count"`
	FollowersCount  int64     `json:"followers_count"`
	FollowingCount  int64     `json:"following_count"`
	RatingAverage   float64   `json:"rating_average"`
	RatingCount     int64     `json:"rating_count"`
	IsFollowing     bool      `json:"is_following"`
	Phone           string    `json:"phone,omitempty"`
}
