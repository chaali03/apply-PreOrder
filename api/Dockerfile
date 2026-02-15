# Dockerfile
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install git (diperlukan untuk go mod)
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code (exclude utility scripts)
COPY . .
RUN rm -f _*.go

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/main .

# Copy uploads folder structure
RUN mkdir -p /root/uploads/products

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"]