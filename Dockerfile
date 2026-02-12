# Multi-stage Dockerfile for Go API only
# This explicitly builds ONLY the Go backend, ignoring all frontend files

# Stage 1: Build Go application
FROM golang:1.23-alpine AS go-builder

# Set working directory
WORKDIR /build

# Copy ONLY Go files from api directory
COPY api/go.mod api/go.sum ./
RUN go mod download && go mod verify

# Copy ONLY api source code (no frontend files)
COPY api/ ./

# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o /build/main ./cmd/main.go

# Stage 2: Runtime
FROM alpine:3.19

# Install runtime dependencies
RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    wget

# Create non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

WORKDIR /app

# Copy binary from builder
COPY --from=go-builder --chown=appuser:appuser /build/main ./main

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run the application
ENTRYPOINT ["./main"]
