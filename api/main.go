package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/smtp"
	"os"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

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
	codes map[string]*CodeData // email -> code data
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

func sendEmail(to, code string) error {
	config := getSMTPConfig()

	if config.Username == "" || config.Password == "" {
		log.Printf("SMTP not configured. Code for %s: %s", to, code)
		return nil
	}

	// Email template
	subject := "Your SCAFF*FOOD Verification Code"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #FDF9F0;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border: 3px solid #000;
            box-shadow: 8px 8px 0 rgba(0,0,0,0.2);
            padding: 40px;
        }
        .logo {
            font-size: 32px;
            font-weight: 900;
            color: #000;
            margin-bottom: 30px;
            text-align: center;
        }
        .title {
            font-size: 24px;
            font-weight: 800;
            color: #000;
            margin-bottom: 20px;
            text-align: center;
        }
        .code-box {
            background-color: #bff000;
            border: 3px solid #000;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
        }
        .code {
            font-size: 48px;
            font-weight: 900;
            letter-spacing: 8px;
            color: #000;
        }
        .message {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
            text-align: center;
            margin: 20px 0;
        }
        .expiry {
            font-size: 14px;
            color: #ff4d00;
            font-weight: 700;
            text-align: center;
            margin-top: 20px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">SCAFF*FOOD</div>
        <div class="title">Kode Verifikasi Anda</div>
        <div class="message">
            Gunakan kode berikut untuk menyelesaikan proses login Anda:
        </div>
        <div class="code-box">
            <div class="code">%s</div>
        </div>
        <div class="expiry">
            ⏰ Kode ini akan kadaluarsa dalam 5 menit
        </div>
        <div class="message">
            Jika Anda tidak meminta kode ini, abaikan email ini.
        </div>
        <div class="footer">
            © 2025 SCAFF*FOOD GROUP<br>
            Email ini dikirim secara otomatis, mohon tidak membalas.
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

	// Connect to SMTP server with TLS
	addr := config.Host + ":" + config.Port

	// Create TLS config
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         config.Host,
	}

	// Connect to server
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		// Try without TLS for port 587
		client, err := smtp.Dial(addr)
		if err != nil {
			return fmt.Errorf("failed to connect to SMTP server: %v", err)
		}
		defer client.Close()

		// Start TLS
		if err = client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("failed to start TLS: %v", err)
		}

		// Authenticate
		if err = client.Auth(auth); err != nil {
			return fmt.Errorf("failed to authenticate: %v", err)
		}

		// Send email
		if err = client.Mail(config.From); err != nil {
			return fmt.Errorf("failed to set sender: %v", err)
		}

		if err = client.Rcpt(to); err != nil {
			return fmt.Errorf("failed to set recipient: %v", err)
		}

		w, err := client.Data()
		if err != nil {
			return fmt.Errorf("failed to get data writer: %v", err)
		}

		_, err = w.Write([]byte(message))
		if err != nil {
			return fmt.Errorf("failed to write message: %v", err)
		}

		err = w.Close()
		if err != nil {
			return fmt.Errorf("failed to close writer: %v", err)
		}

		return client.Quit()
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, config.Host)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %v", err)
	}
	defer client.Close()

	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("failed to authenticate: %v", err)
	}

	if err = client.Mail(config.From); err != nil {
		return fmt.Errorf("failed to set sender: %v", err)
	}

	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %v", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get data writer: %v", err)
	}

	_, err = w.Write([]byte(message))
	if err != nil {
		return fmt.Errorf("failed to write message: %v", err)
	}

	err = w.Close()
	if err != nil {
		return fmt.Errorf("failed to close writer: %v", err)
	}

	return client.Quit()
}

func sendEmailHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
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
	if err := sendEmail(req.Email, code); err != nil {
		log.Printf("Failed to send email to %s: %v", req.Email, err)
		log.Printf("Code for %s: %s (email failed, showing in logs)", req.Email, code)
	} else {
		log.Printf("Verification code sent to %s", req.Email)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: fmt.Sprintf("Kode verifikasi telah dikirim ke %s", req.Email),
	})
}

func verifyCodeHandler(w http.ResponseWriter, r *http.Request) {
	var req VerifyCodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Code == "" {
		http.Error(w, "Email and code are required", http.StatusBadRequest)
		return
	}

	// Check code
	codeStore.mu.RLock()
	codeData, exists := codeStore.codes[req.Email]
	codeStore.mu.RUnlock()

	if !exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(Response{
			Success: false,
			Message: "Kode verifikasi tidak ditemukan",
		})
		return
	}

	// Check if code expired
	if time.Now().After(codeData.ExpiresAt) {
		// Remove expired code
		codeStore.mu.Lock()
		delete(codeStore.codes, req.Email)
		codeStore.mu.Unlock()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(Response{
			Success: false,
			Message: "Kode verifikasi telah kadaluarsa",
		})
		return
	}

	// Check if code matches
	if codeData.Code != req.Code {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(Response{
			Success: false,
			Message: "Kode verifikasi salah",
		})
		return
	}

	// Generate token (in production, use JWT)
	token := fmt.Sprintf("token_%s_%d", req.Email, time.Now().Unix())

	// Remove used code
	codeStore.mu.Lock()
	delete(codeStore.codes, req.Email)
	codeStore.mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Login successful",
		Token:   token,
	})
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
	})
}

func main() {
	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/api/health", healthHandler).Methods("GET")
	r.HandleFunc("/api/auth/send-code", sendEmailHandler).Methods("POST")
	r.HandleFunc("/api/auth/verify-code", verifyCodeHandler).Methods("POST")

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:3001"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	port := ":8080"
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(port, handler))
}
