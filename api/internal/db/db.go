package db

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDb() {
	// DOCKER ENVIRONMENT CONFIG
	host := getEnv("DB_HOST", "postgres") 
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "docker123")
	dbname := getEnv("DB_NAME", "management_preorder")
	
	log.Printf("🐳 DOCKER: Connecting to %s@%s:%s/%s", user, host, port, dbname)
	
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port,
	)
	
	// Retry buat docker
	var db *gorm.DB
	var err error
	maxRetries := 25
	
	for i := 1; i <= maxRetries; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Printf("⏳ Docker DB not ready (attempt %d/%d)...", i, maxRetries)
			time.Sleep(3 * time.Second) 
			continue
		}
		break
	}
	
	if err != nil {
		log.Fatal("❌ Failed to connect to Docker database:", err)
	}
	
	DB = db
	
	// Test connection
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("❌ Failed to get DB instance:", err)
	}
	
	if err := sqlDB.Ping(); err != nil {
		log.Fatal("❌ Docker database ping failed:", err)
	}
	
	// Configure connection pool untuk Docker
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(20)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	
	log.Println("✅ Connected to Docker PostgreSQL successfully!")
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}