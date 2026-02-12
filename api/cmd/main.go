package main

import (
	"log"
	"os"

	"scaff-food-backend/internal/db"
	"scaff-food-backend/internal/product"
	"scaff-food-backend/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env jika ada (untuk development)
	_ = godotenv.Load()
	
	// Buat folder uploads di Docker
	createDockerDirs()
	
	// Connect to Docker database
	db.ConnectDb()
	
	// Auto migrate
	if err := db.DB.AutoMigrate(&product.Product{}); err != nil {
		log.Fatal("Migration failed:", err)
	}
	log.Println("✅ Migrations completed!")
	
	app := fiber.New(fiber.Config{
		AppName: "Product API (Docker)",
	})

	// Global CORS (untuk akses dari Next.js / Netlify)
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, ngrok-skip-browser-warning",
		AllowMethods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: false,
	}))

	// Serve static files dari folder Docker
	app.Static("/uploads", "/app/uploads")
	
	// Setup routes
	api := app.Group("/api")
	routes.SetupProductRoutes(api)
	
	// Health check khusus Docker
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":   "healthy",
			"service":  "product-api-docker",
			"database": "connected",
			"runtime":  "docker",
		})
	})
	
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	
	log.Printf("🐳 Docker Container running on port %s", port)
	log.Printf("📦 Database: postgres:5432 (Docker network)")
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