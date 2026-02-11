# Dockerfile for Koyeb deployment - Backend Go only

FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files from api directory
COPY api/go.mod api/go.sum ./
RUN go mod download

# Copy only api source code
COPY api/ ./

# Build the Go application
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o main ./cmd/main.go

# Final stage - minimal image
FROM alpine:latest

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

# Expose port (Koyeb will use PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run the application
CMD ["./main"]
