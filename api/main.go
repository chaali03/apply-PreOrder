package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/smtp"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Database connection
var DB *gorm.DB

// User model
type User struct {
	ID        string    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email     string    `gorm:"unique;not null" json:"email"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Role      string    `gorm:"default:'customer'" json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Product model
type Product struct {
	ID               string    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name             string    `gorm:"not null" json:"name"`
	ShortDescription string    `json:"short_description"`
	Description      string    `json:"description"`
	Price            float64   `gorm:"not null" json:"price"`
	Category         string    `json:"category"`
	Tag              string    `json:"tag"`
	TagColor         string    `json:"tag_color"`
	ImageURL1        string    `gorm:"column:image_url_1" json:"image_url_1"`
	ImageURL2        string    `gorm:"column:image_url_2" json:"image_url_2"`
	ImageURL3        string    `gorm:"column:image_url_3" json:"image_url_3"`
	Stock            int       `gorm:"default:0" json:"stock"`
	IsAvailable      bool      `gorm:"default:true" json:"is_available"`
	MinOrder         int       `gorm:"default:1" json:"min_order"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// Order model
type Order struct {
	ID                 string     `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderNumber        string     `gorm:"unique;not null" json:"order_number"`
	CustomerName       string     `gorm:"not null" json:"customer_name"`
	CustomerEmail      string     `gorm:"not null" json:"customer_email"`
	CustomerPhone      string     `gorm:"not null" json:"customer_phone"`
	DeliveryAddress    string     `json:"delivery_address"`
	Subtotal           float64    `json:"subtotal"`
	DeliveryFee        float64    `json:"delivery_fee"`
	Total              float64    `json:"total"`
	PaymentMethod      string     `json:"payment_method"`
	PaymentStatus      string     `gorm:"default:'pending'" json:"payment_status"`
	OrderStatus        string     `gorm:"default:'pending'" json:"order_status"`
	DeliveryPhoto      string     `json:"delivery_photo,omitempty"`
	CancellationReason string     `json:"cancellation_reason,omitempty"`
	CancelledAt        *time.Time `json:"cancelled_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// OrderItem model
type OrderItem struct {
	ID           string    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderID      string    `gorm:"type:uuid;not null" json:"order_id"`
	ProductID    string    `gorm:"type:uuid" json:"product_id"`
	ProductName  string    `gorm:"not null" json:"product_name"`
	ProductPrice float64   `gorm:"not null" json:"product_price"`
	ProductImage string    `json:"product_image"`
	Quantity     int       `gorm:"not null" json:"quantity"`
	Subtotal     float64   `gorm:"not null" json:"subtotal"`
	CreatedAt    time.Time `json:"created_at"`
}

// OrderWithItems for response
type OrderWithItems struct {
	Order
	Items []OrderItem `json:"items"`
}

// Dashboard Stats Response
type DashboardStats struct {
	TotalCustomers   int64   `json:"total_customers"`
	TotalOrders      int64   `json:"total_orders"`
	TotalRevenue     float64 `json:"total_revenue"`
	ActiveOrders     int64   `json:"active_orders"`
	CustomerGrowth   float64 `json:"customer_growth"`
	OrderGrowth      float64 `json:"order_growth"`
	RevenueGrowth    float64 `json:"revenue_growth"`
	ActiveOrdersList []Order `json:"active_orders_list"`
}

type LoginRequest struct {
	Email string `json:"email"`
}

type VerifyCodeRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

type Response struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
}

type CodeData struct {
	Code      string
	ExpiresAt time.Time
}

type CodeStore struct {
	mu    sync.RWMutex
	codes map[string]*CodeData
}

var codeStore = &CodeStore{
	codes: make(map[string]*CodeData),
}

type SMTPConfig struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

func generateCode() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%06d", rand.Intn(1000000))
}

func getSMTPConfig() *SMTPConfig {
	return &SMTPConfig{
		Host:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		Port:     getEnv("SMTP_PORT", "587"),
		Username: getEnv("SMTP_USERNAME", ""),
		Password: getEnv("SMTP_PASSWORD", ""),
		From:     getEnv("SMTP_FROM", "noreply@scafffood.com"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func isImageFile(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	for _, validExt := range validExts {
		if ext == validExt {
			return true
		}
	}
	return false
}

func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func connectDatabase() {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "change_me")
	dbname := getEnv("DB_NAME", "management_preorder")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port,
	)

	log.Printf("🔌 Connecting to database: %s@%s:%s/%s", user, host, port, dbname)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("❌ Failed to connect to database: %v", err)
		log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
		log.Println("⚠️  DATABASE NOT CONNECTED!")
		log.Println("⚠️  Login will be DISABLED until database is running")
		log.Println("⚠️  Start database with: ./start-db.sh")
		log.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
		return
	}

	// Test connection
	sqlDB, err := DB.DB()
	if err != nil {
		log.Printf("❌ Failed to get DB instance: %v", err)
		DB = nil
		return
	}

	if err := sqlDB.Ping(); err != nil {
		log.Printf("❌ Database ping failed: %v", err)
		DB = nil
		return
	}

	log.Println("✅ Connected to PostgreSQL database!")
	log.Println("✅ Login system is ready!")
}

func isEmailAllowed(email string) bool {
	if DB == nil {
		log.Println("❌ Database not connected, rejecting login")
		return false
	}

	var user User
	result := DB.Where("email = ?", email).First(&user)
	
	if result.Error != nil {
		log.Printf("❌ Email %s not found in database", email)
		return false
	}

	log.Printf("✅ Email %s found in database (role: %s)", email, user.Role)
	return true
}

func sendEmail(to, code string) error {
	config := getSMTPConfig()

	log.Printf("SMTP Config - Host: %s, Port: %s, Username: %s", config.Host, config.Port, config.Username)

	if config.Username == "" || config.Password == "" {
		log.Printf("SMTP not configured. Code for %s: %s", to, code)
		return fmt.Errorf("SMTP credentials not configured")
	}

	log.Printf("Preparing email for %s with code %s", to, code)

	// Email template with OTP form
	subject := "Your SCAFF*FOOD Verification Code"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background-color: #FDF9F0;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border: 3px solid #000;
            box-shadow: 8px 8px 0 rgba(0,0,0,0.2);
        }
        .header {
            background-color: #bff000;
            border-bottom: 3px solid #000;
            padding: 30px;
            text-align: center;
        }
        .logo {
            font-size: 36px;
            font-weight: 900;
            color: #000;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .content {
            padding: 40px 30px;
        }
        .title {
            font-size: 24px;
            font-weight: 800;
            color: #000;
            margin: 0 0 20px 0;
            text-align: center;
            text-transform: uppercase;
        }
        .message {
            font-size: 16px;
            color: #666;
            text-align: center;
            margin: 0 0 30px 0;
        }
        .code-display {
            background-color: #bff000;
            border: 3px solid #000;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
            text-align: center;
        }
        .code {
            font-size: 48px;
            font-weight: 900;
            letter-spacing: 12px;
            color: #000;
            margin: 0;
            font-family: 'Courier New', monospace;
        }
        .expiry-box {
            background-color: #fff3cd;
            border: 3px solid #000;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .expiry {
            font-size: 14px;
            color: #ff4d00;
            font-weight: 700;
            margin: 0;
        }
        .footer {
            background-color: #f8f9fa;
            border-top: 3px solid #000;
            padding: 30px;
            text-align: center;
        }
        .footer-text {
            font-size: 12px;
            color: #999;
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">SCAFF*FOOD</h1>
        </div>
        
        <div class="content">
            <h2 class="title">Kode Verifikasi Login</h2>
            <p class="message">
                Gunakan kode verifikasi di bawah ini untuk melanjutkan login:
            </p>
            
            <div class="code-display">
                <p class="code">%s</p>
            </div>

            <div class="expiry-box">
                <p class="expiry">⏰ Kode ini akan kadaluarsa dalam 5 menit</p>
            </div>

            <p class="message">
                Jika Anda tidak meminta kode ini, abaikan email ini.
            </p>
        </div>

        <div class="footer">
            <p class="footer-text"><strong>© 2025 SCAFF*FOOD GROUP</strong></p>
            <p class="footer-text">SMK Taruna Bhakti Depok</p>
            <p class="footer-text">Email ini dikirim secara otomatis, mohon tidak membalas.</p>
        </div>
    </div>
</body>
</html>
`, code)

	// Compose email
	message := fmt.Sprintf("From: %s\r\n", config.From)
	message += fmt.Sprintf("To: %s\r\n", to)
	message += fmt.Sprintf("Subject: %s\r\n", subject)
	message += "MIME-Version: 1.0\r\n"
	message += "Content-Type: text/html; charset=UTF-8\r\n"
	message += "\r\n"
	message += body

	// Setup authentication
	auth := smtp.PlainAuth("", config.Username, config.Password, config.Host)

	// Send email using simple method
	addr := config.Host + ":" + config.Port

	log.Printf("Connecting to SMTP server: %s", addr)

	err := smtp.SendMail(
		addr,
		auth,
		config.From,
		[]string{to},
		[]byte(message),
	)

	if err != nil {
		log.Printf("SMTP Error: %v", err)
		return fmt.Errorf("failed to send email: %v", err)
	}

	log.Printf("Email sent successfully to %s", to)
	return nil
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found, using environment variables")
	} else {
		log.Println("✅ Loaded .env file")
	}

	// Connect to database
	connectDatabase()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "SCAFF*FOOD API",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://localhost:3001",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: true,
	}))

	// Routes
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// Upload image endpoint
	app.Post("/api/upload", func(c *fiber.Ctx) error {
		// Get file from form
		file, err := c.FormFile("image")
		if err != nil {
			log.Printf("Error getting file: %v", err)
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "No file uploaded",
			})
		}

		// Validate file type
		if !isImageFile(file.Filename) {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "File must be an image (jpg, jpeg, png, gif, webp)",
			})
		}

		// Validate file size (max 5MB)
		if file.Size > 5*1024*1024 {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "File size must be less than 5MB",
			})
		}

		// Generate unique filename
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d_%s%s", time.Now().Unix(), generateRandomString(8), ext)
		
		// Save to public/produk directory
		uploadPath := filepath.Join("public", "produk", filename)
		
		if err := c.SaveFile(file, uploadPath); err != nil {
			log.Printf("Error saving file: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to save file",
			})
		}

		// Return URL
		imageURL := fmt.Sprintf("/produk/%s", filename)
		log.Printf("Image uploaded successfully: %s", imageURL)

		return c.JSON(fiber.Map{
			"success": true,
			"url":     imageURL,
			"message": "Image uploaded successfully",
		})
	})

	app.Post("/api/auth/send-code", func(c *fiber.Ctx) error {
		var req LoginRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(Response{
				Success: false,
				Message: "Invalid request",
			})
		}

		if req.Email == "" {
			return c.Status(400).JSON(Response{
				Success: false,
				Message: "Email is required",
			})
		}

		// Check if email is allowed (exists in database)
		if !isEmailAllowed(req.Email) {
			if DB == nil {
				return c.Status(503).JSON(Response{
					Success: false,
					Message: "Layanan sedang tidak tersedia. Silakan coba lagi nanti.",
				})
			}
			return c.Status(401).JSON(Response{
				Success: false,
				Message: "Email atau kode verifikasi salah.",
			})
		}

		// Generate 6-digit code
		code := generateCode()

		// Store code with expiration (5 minutes)
		codeStore.mu.Lock()
		codeStore.codes[req.Email] = &CodeData{
			Code:      code,
			ExpiresAt: time.Now().Add(5 * time.Minute),
		}
		codeStore.mu.Unlock()

		// Send email
		smtpConfig := getSMTPConfig()
		log.Printf("Attempting to send email to %s using SMTP %s:%s", req.Email, smtpConfig.Host, smtpConfig.Port)
		if err := sendEmail(req.Email, code); err != nil {
			log.Printf("ERROR: Failed to send email to %s: %v", req.Email, err)
			log.Printf("Code for %s: %s (email failed, showing in logs)", req.Email, code)
		} else {
			log.Printf("SUCCESS: Verification code sent to %s", req.Email)
		}

		return c.JSON(Response{
			Success: true,
			Message: fmt.Sprintf("Kode verifikasi telah dikirim ke %s", req.Email),
		})
	})

	app.Post("/api/auth/verify-code", func(c *fiber.Ctx) error {
		var req VerifyCodeRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(Response{
				Success: false,
				Message: "Invalid request",
			})
		}

		if req.Email == "" || req.Code == "" {
			return c.Status(400).JSON(Response{
				Success: false,
				Message: "Email and code are required",
			})
		}

		// Check code
		codeStore.mu.RLock()
		codeData, exists := codeStore.codes[req.Email]
		codeStore.mu.RUnlock()

		if !exists {
			return c.Status(401).JSON(Response{
				Success: false,
				Message: "Email atau kode verifikasi salah.",
			})
		}

		// Check if code expired
		if time.Now().After(codeData.ExpiresAt) {
			codeStore.mu.Lock()
			delete(codeStore.codes, req.Email)
			codeStore.mu.Unlock()

			return c.Status(401).JSON(Response{
				Success: false,
				Message: "Kode verifikasi telah kadaluarsa. Silakan minta kode baru.",
			})
		}

		// Check if code matches
		if codeData.Code != req.Code {
			return c.Status(401).JSON(Response{
				Success: false,
				Message: "Email atau kode verifikasi salah.",
			})
		}

		// Generate token
		token := fmt.Sprintf("token_%s_%d", req.Email, time.Now().Unix())

		// Remove used code
		codeStore.mu.Lock()
		delete(codeStore.codes, req.Email)
		codeStore.mu.Unlock()

		return c.JSON(Response{
			Success: true,
			Message: "Login successful",
			Token:   token,
		})
	})

	// Product endpoints
	app.Get("/api/products", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var products []Product
		result := DB.Where("is_available = ?", true).Find(&products)
		
		if result.Error != nil {
			log.Printf("Error fetching products: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to fetch products",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    products,
		})
	})

	app.Get("/api/products/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		var product Product
		result := DB.Where("id = ? AND is_available = ?", id, true).First(&product)
		
		if result.Error != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Product not found",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    product,
		})
	})

	// Admin: Get all products (including unavailable)
	app.Get("/api/admin/products", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var products []Product
		result := DB.Order("created_at DESC").Find(&products)
		
		if result.Error != nil {
			log.Printf("Error fetching products: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to fetch products",
			})
		}

		// Log availability status
		availableCount := 0
		unavailableCount := 0
		for _, p := range products {
			if p.IsAvailable {
				availableCount++
			} else {
				unavailableCount++
			}
		}
		log.Printf("GET /api/admin/products: Returning %d products (available: %d, unavailable: %d)", 
			len(products), availableCount, unavailableCount)

		return c.JSON(fiber.Map{
			"success": true,
			"data":    products,
		})
	})

	// Admin: Create product
	app.Post("/api/admin/products", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var product Product
		if err := c.BodyParser(&product); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		// Set default values
		if product.Stock == 0 {
			product.Stock = 100
		}
		if !product.IsAvailable {
			product.IsAvailable = true
		}
		if product.MinOrder == 0 {
			product.MinOrder = 1
		}

		result := DB.Create(&product)
		if result.Error != nil {
			log.Printf("Error creating product: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to create product",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    product,
			"message": "Product created successfully",
		})
	})

	// Admin: Update product
	app.Put("/api/admin/products/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		var product Product
		
		// Find existing product
		if err := DB.First(&product, "id = ?", id).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Product not found",
			})
		}

		// Parse update data
		var updateData Product
		if err := c.BodyParser(&updateData); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		// Update fields
		result := DB.Model(&product).Updates(updateData)
		if result.Error != nil {
			log.Printf("Error updating product: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to update product",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    product,
			"message": "Product updated successfully",
		})
	})

	// Admin: Delete product
	app.Delete("/api/admin/products/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		result := DB.Delete(&Product{}, "id = ?", id)
		
		if result.Error != nil {
			log.Printf("Error deleting product: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to delete product",
			})
		}

		if result.RowsAffected == 0 {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Product not found",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"message": "Product deleted successfully",
		})
	})

	// Admin: Toggle product availability
	app.Patch("/api/admin/products/:id/toggle", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		var product Product
		
		if err := DB.First(&product, "id = ?", id).Error; err != nil {
			log.Printf("Error finding product %s: %v", id, err)
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Product not found",
			})
		}

		log.Printf("Toggling product %s (%s): is_available %v -> %v", id, product.Name, product.IsAvailable, !product.IsAvailable)

		// Toggle availability
		oldAvailability := product.IsAvailable
		newAvailability := !product.IsAvailable
		
		// Use Updates with map to force update boolean field
		result := DB.Model(&product).Updates(map[string]interface{}{
			"is_available": newAvailability,
		})
		
		if result.Error != nil {
			log.Printf("Error updating product %s: %v", id, result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to update product",
			})
		}

		// Update local variable
		product.IsAvailable = newAvailability

		log.Printf("✅ Successfully toggled product %s: is_available changed from %v to %v (rows affected: %d)", 
			product.Name, oldAvailability, product.IsAvailable, result.RowsAffected)

		return c.JSON(fiber.Map{
			"success": true,
			"data":    product,
			"message": "Product availability updated",
		})
	})

	// Dashboard statistics endpoint
	app.Get("/api/dashboard/stats", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var stats DashboardStats

		// Total Customers
		DB.Model(&User{}).Where("role = ?", "customer").Count(&stats.TotalCustomers)

		// Total Orders
		DB.Model(&Order{}).Count(&stats.TotalOrders)

		// Total Revenue (sum of all completed orders)
		DB.Model(&Order{}).
			Where("payment_status = ?", "paid").
			Select("COALESCE(SUM(total), 0)").
			Scan(&stats.TotalRevenue)

		// Active Orders (pending, processing, on_delivery)
		DB.Model(&Order{}).
			Where("order_status IN ?", []string{"pending", "processing", "on_delivery"}).
			Count(&stats.ActiveOrders)

		// Get active orders list
		DB.Where("order_status IN ?", []string{"pending", "processing", "on_delivery"}).
			Order("created_at DESC").
			Limit(10).
			Find(&stats.ActiveOrdersList)

		// Calculate growth percentages (last 7 days vs previous 7 days)
		now := time.Now()
		sevenDaysAgo := now.AddDate(0, 0, -7)
		fourteenDaysAgo := now.AddDate(0, 0, -14)

		// Customer growth
		var customersLast7, customersPrevious7 int64
		DB.Model(&User{}).Where("role = ? AND created_at >= ?", "customer", sevenDaysAgo).Count(&customersLast7)
		DB.Model(&User{}).Where("role = ? AND created_at >= ? AND created_at < ?", "customer", fourteenDaysAgo, sevenDaysAgo).Count(&customersPrevious7)
		if customersPrevious7 > 0 {
			stats.CustomerGrowth = float64(customersLast7-customersPrevious7) / float64(customersPrevious7) * 100
		} else if customersLast7 > 0 {
			stats.CustomerGrowth = 100
		}

		// Order growth
		var ordersLast7, ordersPrevious7 int64
		DB.Model(&Order{}).Where("created_at >= ?", sevenDaysAgo).Count(&ordersLast7)
		DB.Model(&Order{}).Where("created_at >= ? AND created_at < ?", fourteenDaysAgo, sevenDaysAgo).Count(&ordersPrevious7)
		if ordersPrevious7 > 0 {
			stats.OrderGrowth = float64(ordersLast7-ordersPrevious7) / float64(ordersPrevious7) * 100
		} else if ordersLast7 > 0 {
			stats.OrderGrowth = 100
		}

		// Revenue growth
		var revenueLast7, revenuePrevious7 float64
		DB.Model(&Order{}).Where("payment_status = ? AND created_at >= ?", "paid", sevenDaysAgo).Select("COALESCE(SUM(total), 0)").Scan(&revenueLast7)
		DB.Model(&Order{}).Where("payment_status = ? AND created_at >= ? AND created_at < ?", "paid", fourteenDaysAgo, sevenDaysAgo).Select("COALESCE(SUM(total), 0)").Scan(&revenuePrevious7)
		if revenuePrevious7 > 0 {
			stats.RevenueGrowth = (revenueLast7 - revenuePrevious7) / revenuePrevious7 * 100
		} else if revenueLast7 > 0 {
			stats.RevenueGrowth = 100
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    stats,
		})
	})

	// ============================================
	// ORDER ENDPOINTS
	// ============================================

	// Create new order
	app.Post("/api/orders", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var requestData struct {
			Order Order         `json:"order"`
			Items []OrderItem   `json:"items"`
		}

		if err := c.BodyParser(&requestData); err != nil {
			log.Printf("Error parsing order request: %v", err)
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		// Generate order number
		orderNumber := fmt.Sprintf("ORD-%s-%03d", time.Now().Format("20060102"), time.Now().Unix()%1000)
		requestData.Order.OrderNumber = orderNumber
		requestData.Order.PaymentStatus = "paid"
		requestData.Order.OrderStatus = "processing"

		// Create order
		if err := DB.Create(&requestData.Order).Error; err != nil {
			log.Printf("Error creating order: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to create order",
			})
		}

		// Create order items
		for i := range requestData.Items {
			requestData.Items[i].OrderID = requestData.Order.ID
			if err := DB.Create(&requestData.Items[i]).Error; err != nil {
				log.Printf("Error creating order item: %v", err)
				// Rollback order if items fail
				DB.Delete(&requestData.Order)
				return c.Status(500).JSON(fiber.Map{
					"success": false,
					"message": "Failed to create order items",
				})
			}
		}

		log.Printf("✅ Order created: %s for %s", orderNumber, requestData.Order.CustomerEmail)

		return c.JSON(fiber.Map{
			"success": true,
			"message": "Order created successfully",
			"data": fiber.Map{
				"order": requestData.Order,
				"items": requestData.Items,
			},
		})
	})

	// Get all orders (admin)
	app.Get("/api/orders", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		// Auto-delete cancelled orders older than 24 hours
		twentyFourHoursAgo := time.Now().Add(-24 * time.Hour)
		deleteResult := DB.Where("(order_status = ? OR order_status = ?) AND cancelled_at < ?", "dibatalkan", "cancelled", twentyFourHoursAgo).Delete(&Order{})
		if deleteResult.Error != nil {
			log.Printf("Error auto-deleting old cancelled orders: %v", deleteResult.Error)
		} else if deleteResult.RowsAffected > 0 {
			log.Printf("🗑️ Auto-deleted %d cancelled orders older than 24 hours", deleteResult.RowsAffected)
		}

		var orders []Order
		result := DB.Order("created_at DESC").Find(&orders)
		
		if result.Error != nil {
			log.Printf("Error fetching orders: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to fetch orders",
			})
		}

		// Get items for each order
		var ordersWithItems []OrderWithItems
		for _, order := range orders {
			var items []OrderItem
			DB.Where("order_id = ?", order.ID).Find(&items)
			
			ordersWithItems = append(ordersWithItems, OrderWithItems{
				Order: order,
				Items: items,
			})
		}

		log.Printf("GET /api/orders: Returning %d orders", len(orders))

		return c.JSON(fiber.Map{
			"success": true,
			"data":    ordersWithItems,
		})
	})

	// Get single order by ID
	app.Get("/api/orders/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		var order Order
		
		if err := DB.First(&order, "id = ?", id).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Order not found",
			})
		}

		// Get order items
		var items []OrderItem
		DB.Where("order_id = ?", order.ID).Find(&items)

		return c.JSON(fiber.Map{
			"success": true,
			"data": OrderWithItems{
				Order: order,
				Items: items,
			},
		})
	})

	// Get orders by customer email or phone
	app.Get("/api/orders/customer/:identifier", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		identifier := c.Params("identifier")
		var orders []Order
		
		// Try to find by phone first, then by email
		result := DB.Where("customer_phone = ? OR customer_email = ?", identifier, identifier).Order("created_at DESC").Find(&orders)
		
		if result.Error != nil {
			log.Printf("Error fetching orders for %s: %v", identifier, result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to fetch orders",
			})
		}

		// Get items for each order
		var ordersWithItems []OrderWithItems
		for _, order := range orders {
			var items []OrderItem
			DB.Where("order_id = ?", order.ID).Find(&items)
			
			ordersWithItems = append(ordersWithItems, OrderWithItems{
				Order: order,
				Items: items,
			})
		}

		log.Printf("GET /api/orders/customer/%s: Returning %d orders", identifier, len(orders))

		return c.JSON(fiber.Map{
			"success": true,
			"data":    ordersWithItems,
		})
	})

	// Update order status (admin)
	app.Put("/api/orders/:id/status", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		var requestData struct {
			Status             string `json:"status"`
			CancellationReason string `json:"cancellation_reason,omitempty"`
			DeliveryPhoto      string `json:"delivery_photo,omitempty"`
		}

		if err := c.BodyParser(&requestData); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		// Validate cancellation reason if status is dibatalkan or cancelled
		if (requestData.Status == "dibatalkan" || requestData.Status == "cancelled") && requestData.CancellationReason == "" {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Alasan pembatalan harus diisi",
			})
		}

		var order Order
		if err := DB.First(&order, "id = ?", id).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Order not found",
			})
		}

		// Update status
		oldStatus := order.OrderStatus
		updateData := map[string]interface{}{
			"order_status": requestData.Status,
		}

		// If status is dibatalkan or cancelled, add cancellation reason and timestamp
		if requestData.Status == "dibatalkan" || requestData.Status == "cancelled" {
			now := time.Now()
			updateData["cancellation_reason"] = requestData.CancellationReason
			updateData["cancelled_at"] = now
		}

		// If status is completed, add delivery photo if provided
		if requestData.Status == "completed" && requestData.DeliveryPhoto != "" {
			updateData["delivery_photo"] = requestData.DeliveryPhoto
		}

		result := DB.Model(&order).Updates(updateData)

		if result.Error != nil {
			log.Printf("Error updating order status: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to update order status",
			})
		}

		order.OrderStatus = requestData.Status
		if requestData.Status == "dibatalkan" || requestData.Status == "cancelled" {
			order.CancellationReason = requestData.CancellationReason
			now := time.Now()
			order.CancelledAt = &now
		}
		log.Printf("✅ Order %s status updated: %s → %s", order.OrderNumber, oldStatus, requestData.Status)

		return c.JSON(fiber.Map{
			"success": true,
			"message": "Order status updated",
			"data":    order,
		})
	})

	// Delete order (admin)
	app.Delete("/api/orders/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		
		// Get order first for logging
		var order Order
		if err := DB.First(&order, "id = ?", id).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Order not found",
			})
		}

		// Delete order (items will be deleted by CASCADE)
		result := DB.Delete(&order)
		
		if result.Error != nil {
			log.Printf("Error deleting order: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to delete order",
			})
		}

		log.Printf("✅ Order deleted: %s", order.OrderNumber)

		return c.JSON(fiber.Map{
			"success": true,
			"message": "Order deleted successfully",
		})
	})

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("🚀 Server starting on http://localhost:%s", port)
	log.Fatal(app.Listen(":" + port))
}
