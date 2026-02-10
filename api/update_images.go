package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect to database
	host := getEnvVar("DB_HOST", "localhost")
	port := getEnvVar("DB_PORT", "5432")
	user := getEnvVar("DB_USER", "postgres")
	password := getEnvVar("DB_PASSWORD", "change_me")
	dbname := getEnvVar("DB_NAME", "management_preorder")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("✅ Connected to database")

	// Update Cookies
	result := db.Exec(`
		UPDATE products 
		SET 
		  image_url_1 = '/produk/Cookies1.jpeg',
		  image_url_2 = '/produk/Cookies2.jpeg',
		  image_url_3 = '/produk/Cookies3.jpeg'
		WHERE name = 'Cookies'
	`)
	if result.Error != nil {
		log.Fatalf("Failed to update Cookies: %v", result.Error)
	}
	log.Printf("✅ Updated Cookies (rows affected: %d)", result.RowsAffected)

	// Update Udang Keju
	result = db.Exec(`
		UPDATE products 
		SET 
		  image_url_1 = '/produk/UdangKeju1.jpeg',
		  image_url_2 = '/produk/UdangKeju2.jpeg',
		  image_url_3 = '/produk/UdangKeju3.jpeg'
		WHERE name LIKE '%Udang Keju%'
	`)
	if result.Error != nil {
		log.Fatalf("Failed to update Udang Keju: %v", result.Error)
	}
	log.Printf("✅ Updated Udang Keju (rows affected: %d)", result.RowsAffected)

	// Verify
	var products []struct {
		Name      string
		ImageURL1 string `gorm:"column:image_url_1"`
		ImageURL2 string `gorm:"column:image_url_2"`
		ImageURL3 string `gorm:"column:image_url_3"`
	}
	db.Table("products").Select("name, image_url_1, image_url_2, image_url_3").Find(&products)

	log.Println("\n📸 Current product images:")
	for _, p := range products {
		log.Printf("  %s:", p.Name)
		log.Printf("    - %s", p.ImageURL1)
		log.Printf("    - %s", p.ImageURL2)
		log.Printf("    - %s", p.ImageURL3)
	}

	log.Println("\n✅ Image URLs updated successfully!")
	log.Println("🔄 Restart the API server to see the changes")
}

func getEnvVar(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
