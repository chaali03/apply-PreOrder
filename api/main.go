package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
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

type CodeStore struct {
	mu    sync.RWMutex
	codes map[string]string // email -> code
}

var codeStore = &CodeStore{
	codes: make(map[string]string),
}

func generateCode() string {
	rand.Seed(time.Now().UnixNano())
	return fmt.Sprintf("%06d", rand.Intn(1000000))
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

	// Store code (in production, use Redis or database)
	codeStore.mu.Lock()
	codeStore.codes[req.Email] = code
	codeStore.mu.Unlock()

	// In production, send email here
	log.Printf("Code for %s: %s", req.Email, code)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: fmt.Sprintf("Verification code sent to %s (Code: %s)", req.Email, code),
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
	storedCode, exists := codeStore.codes[req.Email]
	codeStore.mu.RUnlock()

	if !exists || storedCode != req.Code {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(Response{
			Success: false,
			Message: "Invalid verification code",
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
