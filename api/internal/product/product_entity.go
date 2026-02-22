package product

import "time"

type Product struct {
	ID         string    `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name       string    `json:"name" gorm:"not null"`
	Desc       string    `json:"desc"`
	Quantity   int       `json:"quantity" gorm:"default:1"`
	Price      float64   `json:"price" gorm:"default:0"`
	ImageURL   string    `json:"image_url,omitempty" gorm:"type:text"`
	Conditions string    `json:"conditions,omitempty" gorm:"type:jsonb;default:'[]'"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}
