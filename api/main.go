package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/smtp"
	"os"
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
		AllowOrigins: "http://localhost:3000, http://localhost:3001",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Routes
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
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

	// Start server
	port := getEnv("PORT", "8080")
	log.Printf("🚀 Server starting on http://localhost:%s", port)
	log.Fatal(app.Listen(":" + port))
}
