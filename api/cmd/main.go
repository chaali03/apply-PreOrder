// main.go - MODIFIED
package main

import (
	"log"
	"os"
	"time"

	"scaff-food-backend/internal/db"
	"scaff-food-backend/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env jika ada (untuk development)
	_ = godotenv.Load()
	
	// Buat folder uploads di Docker
	createDockerDirs()
	
	// Connect to Docker database
	db.ConnectDb()
	
	// CEK KONEKSI DAN TABLE - TANPA AutoMigrate
	sqlDB, err := db.DB.DB()
	if err != nil {
		log.Fatal("Failed to get database instance:", err)
	}
	
	// Test connection
	if err := sqlDB.Ping(); err != nil {
		log.Fatal("Database ping failed:", err)
	}
	
	// Cek apakah table products ada
	var tableExists bool
	db.DB.Raw(`
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = 'products'
		)
	`).Scan(&tableExists)
	
	if tableExists {
		log.Println("✅ Database table 'products' exists")
		
		// Count records
		var count int64
		db.DB.Table("products").Count(&count)
		log.Printf("📊 Total products in database: %d", count)
	} else {
		log.Println("⚠️  Table 'products' does not exist. Check init.sql!")
	}
	
	app := fiber.New(fiber.Config{
		AppName: "Product API (Docker)",
	})
	
	// Serve static files dari folder Docker
	app.Static("/uploads", "/app/uploads")
	
	// Setup routes
	api := app.Group("/api")
	routes.SetupProductRoutes(api)
	
	// Health check khusus Docker
	app.Get("/health", func(c *fiber.Ctx) error {
		// Cek database status
		var dbStatus string
		if tableExists {
			dbStatus = "connected"
		} else {
			dbStatus = "table_missing"
		}
		
		return c.JSON(fiber.Map{
			"status":   "healthy",
			"service":  "product-api-docker",
			"database": dbStatus,
			"runtime":  "docker",
			"time":     time.Now().Format(time.RFC3339),
		})
	})
	
	// Root endpoint
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Product Management API",
			"version": "1.0.0",
			"status":  "running",
			"docs":    "/api/products",
		})
	})
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	
	log.Printf("🐳 Docker Container running on port %s", port)
	log.Printf("📦 Database: postgres:5432")
	log.Printf("📊 Table created by: init.sql (not AutoMigrate)")
	log.Printf("🌐 Access API: http://localhost:%s/api/products", port)
	log.Printf("🗄️  Database UI: http://localhost:8080")
	
	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func createDockerDirs() {
	// Create directories inside Docker container
	dirs := []string{
		"/app/uploads",
		"/app/uploads/products",
		"/app/logs",
	}
	
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Printf("Warning: Failed to create directory %s: %v", dir, err)
		}
	}
	log.Println("📁 Docker directories created")
}