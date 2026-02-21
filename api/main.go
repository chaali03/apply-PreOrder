package main

import (
	"encoding/json"
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
	ID               string           `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name             string           `gorm:"not null" json:"name"`
	ShortDescription string           `json:"short_description"`
	Description      string           `json:"description"`
	Price            float64          `gorm:"not null" json:"price"`
	Category         string           `json:"category"`
	Tag              string           `json:"tag"`
	TagColor         string           `json:"tag_color"`
	ImageURL1        string           `gorm:"column:image_url_1" json:"image_url_1"`
	ImageURL2        string           `gorm:"column:image_url_2" json:"image_url_2"`
	ImageURL3        string           `gorm:"column:image_url_3" json:"image_url_3"`
	Stock            int              `gorm:"default:0" json:"stock"`
	IsAvailable      bool             `gorm:"default:true" json:"is_available"`
	MinOrder         int              `gorm:"default:1" json:"min_order"`
	Conditions       string           `gorm:"type:jsonb;default:'[]'" json:"conditions,omitempty"`
	QRISId           *string          `gorm:"type:uuid" json:"qris_id,omitempty"`
	Variants         []ProductVariant `gorm:"foreignKey:ProductID" json:"variants,omitempty"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
}

// ProductVariant model
type ProductVariant struct {
	ID          string    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	ProductID   string    `gorm:"type:uuid;not null" json:"product_id"`
	Name        string    `gorm:"not null" json:"name"`
	Price       float64   `gorm:"not null" json:"price"`
	Stock       int       `gorm:"default:0" json:"stock"`
	IsAvailable bool      `gorm:"default:true" json:"is_available"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// QRISCode model
type QRISCode struct {
	ID        string    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	ImageURL  string    `gorm:"type:text;not null" json:"image_url"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Event model
type Event struct {
	ID          string    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	ImageURL    string    `gorm:"type:text;not null" json:"image_url"`
	MusicURL    string    `gorm:"type:text" json:"music_url,omitempty"`
	MusicTitle  string    `json:"music_title,omitempty"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// EventComment model
type EventComment struct {
	ID            string    `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	EventID       string    `gorm:"type:uuid;not null" json:"event_id"`
	ParentID      *string   `gorm:"type:uuid" json:"parent_id,omitempty"`
	CommenterName string    `gorm:"not null" json:"commenter_name"`
	CommentText   string    `gorm:"type:text;not null" json:"comment_text"`
	IsAdmin       bool      `gorm:"default:false" json:"is_admin"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// EventWithComments for response
type EventWithComments struct {
	Event
	CommentCount int            `json:"comment_count"`
	Comments     []EventComment `json:"comments,omitempty"`
}

// Order model
type Order struct {
	ID                   string     `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	OrderNumber          string     `gorm:"unique;not null" json:"order_number"`
	CustomerName         string     `gorm:"not null" json:"customer_name"`
	CustomerEmail        string     `gorm:"not null" json:"customer_email"`
	CustomerPhone        string     `gorm:"not null" json:"customer_phone"`
	DeliveryAddress      string     `json:"delivery_address"`
	DeliveryLocation     string     `gorm:"default:'TB'" json:"delivery_location"`
	Subtotal             float64    `json:"subtotal"`
	DeliveryFee          float64    `json:"delivery_fee"`
	Total                float64    `json:"total"`
	PaymentMethod        string     `json:"payment_method"`
	PaymentStatus        string     `gorm:"default:'pending'" json:"payment_status"`
	PaymentProof         string     `json:"payment_proof,omitempty"`
	OrderStatus          string     `gorm:"default:'pending'" json:"order_status"`
	DeliveryPhoto        string     `json:"delivery_photo,omitempty"`
	AppreciationMessage  string     `json:"appreciation_message,omitempty"`
	CancellationReason   string     `json:"cancellation_reason,omitempty"`
	CancelledAt          *time.Time `json:"cancelled_at,omitempty"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`
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

// Resolve public directory for uploads both in local dev and Docker/production
func getPublicDir() string {
	// Try ./public relative to current working directory
	if _, err := os.Stat("public"); err == nil {
		return "public"
	}

	// Try ../public (when binary is run from api/ directory)
	if _, err := os.Stat(filepath.Join("..", "public")); err == nil {
		return filepath.Join("..", "public")
	}

	// Fallback to ./public
	return "public"
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
		// Allow all origins for frontend (localhost:3000, Netlify, etc.)
		AllowOrigins: "*",
		// Include custom header used by frontend to bypass ngrok warning
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, ngrok-skip-browser-warning",
		AllowMethods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
		// We don't use cookies/credentials from browser
		AllowCredentials: false,
	}))

	// Static files for uploaded images (QRIS, product images, etc.)
	publicDir := getPublicDir()
	app.Static("/produk", filepath.Join(publicDir, "produk"))

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

		// Resolve base public directory and ensure upload folder exists
		publicDir := getPublicDir()
		uploadDir := filepath.Join(publicDir, "produk")

		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			log.Printf("Error creating upload directory %s: %v", uploadDir, err)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to prepare upload directory",
			})
		}

		// Save to public/produk directory
		uploadPath := filepath.Join(uploadDir, filename)

		if err := c.SaveFile(file, uploadPath); err != nil {
			log.Printf("Error saving file to %s: %v", uploadPath, err)
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
		result := DB.Preload("Variants").Where("is_available = ?", true).Find(&products)
		
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
		result := DB.Preload("Variants").Where("id = ? AND is_available = ?", id, true).First(&product)
		
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
		result := DB.Preload("Variants").Order("created_at DESC").Find(&products)
		
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

		var requestData struct {
			Product
			Variants   []ProductVariant        `json:"variants"`
			Conditions []map[string]interface{} `json:"conditions"`
		}
		
		if err := c.BodyParser(&requestData); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		// Convert conditions array to JSON string
		if len(requestData.Conditions) > 0 {
			conditionsJSON, err := json.Marshal(requestData.Conditions)
			if err == nil {
				requestData.Product.Conditions = string(conditionsJSON)
			}
		} else {
			requestData.Product.Conditions = "[]"
		}

		// Set default values
		if requestData.Stock == 0 {
			requestData.Stock = 100
		}
		// Always set new products as available
		requestData.IsAvailable = true
		if requestData.MinOrder == 0 {
			requestData.MinOrder = 1
		}

		// Create product
		product := requestData.Product
		result := DB.Create(&product)
		if result.Error != nil {
			log.Printf("Error creating product: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to create product",
			})
		}

		// Create variants if provided
		if len(requestData.Variants) > 0 {
			for i := range requestData.Variants {
				requestData.Variants[i].ProductID = product.ID
				if requestData.Variants[i].Stock == 0 {
					requestData.Variants[i].Stock = 100
				}
				requestData.Variants[i].IsAvailable = true
			}
			
			if err := DB.Create(&requestData.Variants).Error; err != nil {
				log.Printf("Error creating variants: %v", err)
				// Don't fail the whole request, just log the error
			}
		}

		// Reload product with variants
		DB.Preload("Variants").First(&product, "id = ?", product.ID)

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

		// Parse update data including variants
		var requestData struct {
			Product
			Variants   []ProductVariant        `json:"variants"`
			Conditions []map[string]interface{} `json:"conditions"`
		}
		if err := c.BodyParser(&requestData); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		// Convert conditions array to JSON string
		if len(requestData.Conditions) > 0 {
			conditionsJSON, err := json.Marshal(requestData.Conditions)
			if err == nil {
				requestData.Product.Conditions = string(conditionsJSON)
			}
		} else {
			requestData.Product.Conditions = "[]"
		}

		// Update product fields
		updateData := requestData.Product
		result := DB.Model(&product).Updates(updateData)
		if result.Error != nil {
			log.Printf("Error updating product: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to update product",
			})
		}

		// Handle variants update - always delete and recreate
		// Delete existing variants first
		DB.Where("product_id = ?", id).Delete(&ProductVariant{})
		
		// Create new variants if provided
		if len(requestData.Variants) > 0 {
			log.Printf("📦 Received %d variants for product %s", len(requestData.Variants), id)
			
			// Filter and prepare valid variants - create new objects without ID
			var validVariants []ProductVariant
			for _, v := range requestData.Variants {
				if v.Name != "" {
					stock := v.Stock
					if stock == 0 {
						stock = 100
					}
					// Create new variant object (without ID so PostgreSQL generates it)
					newVariant := ProductVariant{
						ProductID:   id,
						Name:        v.Name,
						Price:       v.Price,
						Stock:       stock,
						IsAvailable: v.IsAvailable,
					}
					validVariants = append(validVariants, newVariant)
					log.Printf("  - Variant: %s, Price: %.0f, Available: %v", v.Name, v.Price, v.IsAvailable)
				}
			}
			
			if len(validVariants) > 0 {
				if err := DB.Create(&validVariants).Error; err != nil {
					log.Printf("❌ Error creating variants: %v", err)
				} else {
					log.Printf("✅ Created %d variants successfully", len(validVariants))
				}
			}
		} else {
			log.Printf("📦 No variants received for product %s", id)
		}

		// Reload product with variants
		DB.Preload("Variants").First(&product, "id = ?", id)

		log.Printf("✅ Product updated: %s with %d variants", product.Name, len(product.Variants))

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

	// ==================== QRIS MANAGEMENT ====================
	
	// Get all QRIS codes
	app.Get("/api/admin/qris", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var qrisCodes []QRISCode
		result := DB.Order("created_at DESC").Find(&qrisCodes)
		if result.Error != nil {
			log.Printf("Error fetching QRIS codes: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to fetch QRIS codes",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    qrisCodes,
		})
	})

	// Create QRIS code
	app.Post("/api/admin/qris", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var qris QRISCode
		if err := c.BodyParser(&qris); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		if qris.Name == "" || qris.ImageURL == "" {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Name and image URL are required",
			})
		}

		qris.IsActive = true
		result := DB.Create(&qris)
		if result.Error != nil {
			log.Printf("Error creating QRIS: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to create QRIS",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    qris,
			"message": "QRIS created successfully",
		})
	})

	// Update QRIS code
	app.Put("/api/admin/qris/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		var qris QRISCode

		if err := DB.First(&qris, "id = ?", id).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "QRIS not found",
			})
		}

		var updateData QRISCode
		if err := c.BodyParser(&updateData); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		result := DB.Model(&qris).Updates(updateData)
		if result.Error != nil {
			log.Printf("Error updating QRIS: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to update QRIS",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    qris,
			"message": "QRIS updated successfully",
		})
	})

	// Delete QRIS code
	app.Delete("/api/admin/qris/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		
		// Check if any products are using this QRIS
		var count int64
		DB.Model(&Product{}).Where("qris_id = ?", id).Count(&count)
		if count > 0 {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": fmt.Sprintf("Tidak dapat menghapus QRIS. Masih digunakan oleh %d produk", count),
			})
		}

		result := DB.Delete(&QRISCode{}, "id = ?", id)
		if result.Error != nil {
			log.Printf("Error deleting QRIS: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to delete QRIS",
			})
		}

		if result.RowsAffected == 0 {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "QRIS not found",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"message": "QRIS deleted successfully",
		})
	})

	// Get QRIS by product ID
	app.Get("/api/products/:id/qris", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		productId := c.Params("id")
		var product Product

		if err := DB.First(&product, "id = ?", productId).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Product not found",
			})
		}

		// If product has no QRIS assigned, return null
		if product.QRISId == nil {
			return c.JSON(fiber.Map{
				"success": true,
				"data":    nil,
				"message": "No QRIS assigned to this product",
			})
		}

		// Get QRIS details
		var qris QRISCode
		if err := DB.First(&qris, "id = ?", *product.QRISId).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "QRIS not found",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    qris,
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

		// Total Customers - count from orders (each order = 1 customer)
		DB.Model(&Order{}).Count(&stats.TotalCustomers)

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

		// Customer growth - based on orders
		var customersLast7, customersPrevious7 int64
		DB.Model(&Order{}).Where("created_at >= ?", sevenDaysAgo).Count(&customersLast7)
		DB.Model(&Order{}).Where("created_at >= ? AND created_at < ?", fourteenDaysAgo, sevenDaysAgo).Count(&customersPrevious7)
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
			Status              string `json:"status"`
			CancellationReason  string `json:"cancellation_reason,omitempty"`
			DeliveryPhoto       string `json:"delivery_photo,omitempty"`
			AppreciationMessage string `json:"appreciation_message,omitempty"`
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

		// If status is completed, add delivery photo and appreciation message if provided
		if requestData.Status == "completed" {
			if requestData.DeliveryPhoto != "" {
				updateData["delivery_photo"] = requestData.DeliveryPhoto
			}
			if requestData.AppreciationMessage != "" {
				updateData["appreciation_message"] = requestData.AppreciationMessage
			}
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
		if requestData.Status == "completed" {
			if requestData.DeliveryPhoto != "" {
				order.DeliveryPhoto = requestData.DeliveryPhoto
			}
			if requestData.AppreciationMessage != "" {
				order.AppreciationMessage = requestData.AppreciationMessage
			}
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

	// ============================================
	// SETTINGS ENDPOINTS
	// ============================================

	// Get setting by key
	app.Get("/api/settings", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		key := c.Query("key")
		if key == "" {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Key parameter is required",
			})
		}

		var setting struct {
			ID          string    `json:"id"`
			Key         string    `json:"key"`
			Value       string    `json:"value"`
			Description string    `json:"description"`
			CreatedAt   time.Time `json:"created_at"`
			UpdatedAt   time.Time `json:"updated_at"`
		}

		err := DB.Raw("SELECT id, key, value, description, created_at, updated_at FROM settings WHERE key = ?", key).Scan(&setting).Error
		if err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Setting not found",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    setting,
		})
	})

	// Update setting
	app.Put("/api/settings", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var requestData struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		}

		if err := c.BodyParser(&requestData); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		if requestData.Key == "" {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Key is required",
			})
		}

		// Upsert setting
		result := DB.Exec(`
			INSERT INTO settings (key, value, updated_at) 
			VALUES (?, ?, CURRENT_TIMESTAMP)
			ON CONFLICT (key) 
			DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
		`, requestData.Key, requestData.Value, requestData.Value)

		if result.Error != nil {
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to update setting",
			})
		}

		log.Printf("✅ Setting updated: %s", requestData.Key)

		return c.JSON(fiber.Map{
			"success": true,
			"message": "Setting updated successfully",
		})
	})

	// ============================================
	// REPORT ENDPOINTS
	// ============================================

	// Get financial report
	app.Get("/api/reports", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		startDate := c.Query("start_date")
		endDate := c.Query("end_date")

		if startDate == "" {
			startDate = time.Now().AddDate(0, 0, -30).Format("2006-01-02")
		}
		if endDate == "" {
			endDate = time.Now().Format("2006-01-02")
		}

		type ProductSales struct {
			ProductID     string  `json:"product_id"`
			ProductName   string  `json:"product_name"`
			TotalQuantity int     `json:"total_quantity"`
			TotalRevenue  float64 `json:"total_revenue"`
			OrderCount    int     `json:"order_count"`
		}

		type DailySales struct {
			Date    string  `json:"date"`
			Revenue float64 `json:"revenue"`
			Orders  int     `json:"orders"`
		}

		type ReportData struct {
			TotalRevenue       float64        `json:"total_revenue"`
			TotalOrders        int            `json:"total_orders"`
			TotalProductsSold  int            `json:"total_products_sold"`
			AverageOrderValue  float64        `json:"average_order_value"`
			ProductSales       []ProductSales `json:"product_sales"`
			DailySales         []DailySales   `json:"daily_sales"`
		}

		report := ReportData{}

		// Excluded statuses: cancelled orders should not be counted
		excludedStatuses := []string{"cancelled", "deleted"}

		// Get total revenue and orders (all orders except cancelled/deleted)
		DB.Model(&Order{}).
			Where("order_status NOT IN ? AND DATE(created_at) BETWEEN ? AND ?", excludedStatuses, startDate, endDate).
			Select("COALESCE(SUM(total), 0) as total_revenue, COUNT(*) as total_orders").
			Scan(&report)

		// Get total products sold (all orders except cancelled/deleted)
		DB.Table("order_items").
			Joins("JOIN orders ON order_items.order_id = orders.id").
			Where("orders.order_status NOT IN ? AND DATE(orders.created_at) BETWEEN ? AND ?", excludedStatuses, startDate, endDate).
			Select("COALESCE(SUM(order_items.quantity), 0)").
			Scan(&report.TotalProductsSold)

		// Calculate average order value
		if report.TotalOrders > 0 {
			report.AverageOrderValue = report.TotalRevenue / float64(report.TotalOrders)
		}

		// Get product sales (all orders except cancelled/deleted)
		var productSales []ProductSales
		DB.Table("products").
			Select("products.id as product_id, products.name as product_name, COALESCE(SUM(order_items.quantity), 0) as total_quantity, COALESCE(SUM(order_items.subtotal), 0) as total_revenue, COUNT(DISTINCT orders.id) as order_count").
			Joins("LEFT JOIN order_items ON products.id = order_items.product_id").
			Joins("LEFT JOIN orders ON order_items.order_id = orders.id AND orders.order_status NOT IN ? AND DATE(orders.created_at) BETWEEN ? AND ?", excludedStatuses, startDate, endDate).
			Group("products.id, products.name").
			Having("COALESCE(SUM(order_items.quantity), 0) > 0").
			Order("total_revenue DESC").
			Scan(&productSales)
		report.ProductSales = productSales

		// Get daily sales (all orders except cancelled/deleted)
		var dailySales []DailySales
		DB.Table("orders").
			Select("DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue, COUNT(*) as orders").
			Where("order_status NOT IN ? AND DATE(created_at) BETWEEN ? AND ?", excludedStatuses, startDate, endDate).
			Group("DATE(created_at)").
			Order("date ASC").
			Scan(&dailySales)
		report.DailySales = dailySales

		log.Printf("📊 Report generated: %s to %s", startDate, endDate)

		return c.JSON(report)
	})

	// ==================== EVENTS SYSTEM ====================
	
	// Get all active events (public)
	app.Get("/api/events", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var events []Event
		result := DB.Where("is_active = ?", true).Order("created_at DESC").Find(&events)
		if result.Error != nil {
			log.Printf("Error fetching events: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to fetch events",
			})
		}

		// Get comment count for each event
		var eventsWithCount []EventWithComments
		for _, event := range events {
			var commentCount int64
			DB.Model(&EventComment{}).Where("event_id = ?", event.ID).Count(&commentCount)
			
			eventsWithCount = append(eventsWithCount, EventWithComments{
				Event:        event,
				CommentCount: int(commentCount),
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    eventsWithCount,
		})
	})

	// Get single event with comments (public)
	app.Get("/api/events/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		var event Event
		
		if err := DB.Where("id = ? AND is_active = ?", id, true).First(&event).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Event not found",
			})
		}

		// Get comments (only top-level, replies will be nested)
		var comments []EventComment
		DB.Where("event_id = ? AND parent_id IS NULL", id).Order("created_at DESC").Find(&comments)

		// Get comment count
		var commentCount int64
		DB.Model(&EventComment{}).Where("event_id = ?", id).Count(&commentCount)

		return c.JSON(fiber.Map{
			"success": true,
			"data": EventWithComments{
				Event:        event,
				CommentCount: int(commentCount),
				Comments:     comments,
			},
		})
	})

	// Get replies for a comment (public)
	app.Get("/api/events/:eventId/comments/:commentId/replies", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		commentId := c.Params("commentId")
		var replies []EventComment
		
		DB.Where("parent_id = ?", commentId).Order("created_at ASC").Find(&replies)

		return c.JSON(fiber.Map{
			"success": true,
			"data":    replies,
		})
	})

	// Add comment to event (public)
	app.Post("/api/events/:id/comments", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		
		var requestData struct {
			CommenterName string  `json:"commenter_name"`
			CommentText   string  `json:"comment_text"`
			ParentID      *string `json:"parent_id"`
		}
		
		if err := c.BodyParser(&requestData); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		// Validate
		if requestData.CommenterName == "" || requestData.CommentText == "" {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Name and comment are required",
			})
		}

		comment := EventComment{
			EventID:       id,
			ParentID:      requestData.ParentID,
			CommenterName: requestData.CommenterName,
			CommentText:   requestData.CommentText,
			IsAdmin:       false,
		}

		if err := DB.Create(&comment).Error; err != nil {
			log.Printf("Error creating comment: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to create comment",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    comment,
			"message": "Comment added successfully",
		})
	})

	// Admin: Get all events
	app.Get("/api/admin/events", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var events []Event
		result := DB.Order("created_at DESC").Find(&events)
		if result.Error != nil {
			log.Printf("Error fetching events: %v", result.Error)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to fetch events",
			})
		}

		// Get comment count for each event
		var eventsWithCount []EventWithComments
		for _, event := range events {
			var commentCount int64
			DB.Model(&EventComment{}).Where("event_id = ?", event.ID).Count(&commentCount)
			
			eventsWithCount = append(eventsWithCount, EventWithComments{
				Event:        event,
				CommentCount: int(commentCount),
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    eventsWithCount,
		})
	})

	// Admin: Create event
	app.Post("/api/admin/events", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		var event Event
		if err := c.BodyParser(&event); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		event.IsActive = true
		
		if err := DB.Create(&event).Error; err != nil {
			log.Printf("Error creating event: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to create event",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    event,
			"message": "Event created successfully",
		})
	})

	// Admin: Update event
	app.Put("/api/admin/events/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		var event Event
		
		if err := DB.First(&event, "id = ?", id).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{
				"success": false,
				"message": "Event not found",
			})
		}

		var updateData Event
		if err := c.BodyParser(&updateData); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		if err := DB.Model(&event).Updates(updateData).Error; err != nil {
			log.Printf("Error updating event: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to update event",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    event,
			"message": "Event updated successfully",
		})
	})

	// Admin: Delete event
	app.Delete("/api/admin/events/:id", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		
		if err := DB.Delete(&Event{}, "id = ?", id).Error; err != nil {
			log.Printf("Error deleting event: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to delete event",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"message": "Event deleted successfully",
		})
	})

	// Admin: Add comment (verified)
	app.Post("/api/admin/events/:id/comments", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		id := c.Params("id")
		
		var requestData struct {
			CommentText string  `json:"comment_text"`
			ParentID    *string `json:"parent_id"`
		}
		
		if err := c.BodyParser(&requestData); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Invalid request body",
			})
		}

		if requestData.CommentText == "" {
			return c.Status(400).JSON(fiber.Map{
				"success": false,
				"message": "Comment text is required",
			})
		}

		comment := EventComment{
			EventID:       id,
			ParentID:      requestData.ParentID,
			CommenterName: "SCAFF*FOOD",
			CommentText:   requestData.CommentText,
			IsAdmin:       true,
		}

		if err := DB.Create(&comment).Error; err != nil {
			log.Printf("Error creating admin comment: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to create comment",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"data":    comment,
			"message": "Comment added successfully",
		})
	})

	// Admin: Delete comment
	app.Delete("/api/admin/events/:eventId/comments/:commentId", func(c *fiber.Ctx) error {
		if DB == nil {
			return c.Status(503).JSON(fiber.Map{
				"success": false,
				"message": "Database not connected",
			})
		}

		commentId := c.Params("commentId")
		
		if err := DB.Delete(&EventComment{}, "id = ?", commentId).Error; err != nil {
			log.Printf("Error deleting comment: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"success": false,
				"message": "Failed to delete comment",
			})
		}

		return c.JSON(fiber.Map{
			"success": true,
			"message": "Comment deleted successfully",
		})
	})

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("🚀 Server starting on http://localhost:%s", port)
	log.Fatal(app.Listen(":" + port))
}
