package models

import "time"

// Follow is a directed follow relationship between users.
type Follow struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	FollowerID  uint      `gorm:"not null;index;uniqueIndex:idx_follows_pair" json:"follower_id"`
	Follower    User      `gorm:"foreignKey:FollowerID" json:"follower,omitempty"`
	FollowingID uint      `gorm:"not null;index;uniqueIndex:idx_follows_pair" json:"following_id"`
	Following   User      `gorm:"foreignKey:FollowingID" json:"following,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

func (Follow) TableName() string { return "follows" }
