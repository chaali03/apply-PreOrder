package seed

import (
	"log"
	"time"

	"scaff-food-backend/internal/product"
	"gorm.io/gorm"
)

// Products - Seed sample products
func Products(db *gorm.DB) {
	products := []product.Product{
		{
			Name:     "Dimsum Goreng",
			Desc:     "Dimsum Goreng Renyah",
			Quantity: 30,
			Price:    10000,
			ImageURL: "/uploads/products/dimsum.jpg",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			Name:     "Matcha Cookies",
			Desc:     "Cookies dengan rasa matcha authentic",
			Quantity: 15,
			Price:    5000,
			ImageURL: "/uploads/products/matcha-cookies.jpg",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			Name:     "Chocolate Cookies",
			Desc:     "Cookies cokelat premium",
			Quantity: 15,
			Price:    5000,
			ImageURL: "/uploads/products/chocolate-cookies.jpg",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}
	
	// Check if products already exist
	var count int64
	db.Model(&product.Product{}).Count(&count)
	
	if count > 0 {
		log.Println("⚠️  Products already exist, skipping seeding")
		return
	}
	
	// Insert data in batches
	for i, p := range products {
		result := db.Create(&p)
		if result.Error != nil {
			log.Printf("❌ Failed to seed product %d: %v", i+1, result.Error)
			continue
		}
	}
	
	log.Printf("✅ Seeded %d products successfully!", len(products))
}
