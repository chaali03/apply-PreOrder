package product

import (
	"time"
)

// Create Product Request
type CreateProductRequest struct {
	Name     string  `json:"name" validate:"required,min=3,max=255"`
	Desc     string  `json:"desc" validate:"omitempty,max=1000"`
	Quantity int     `json:"quantity" validate:"min=0"`
	Price    float64 `json:"price" validate:"min=0"`
	ImageURL string  `json:"image_url,omitempty"`
}

// Update Product Request
type UpdateProductRequest struct {
	Name     *string  `json:"name" validate:"omitempty,min=3,max=255"`
	Desc     *string  `json:"desc" validate:"omitempty,max=1000"`
	Quantity *int     `json:"quantity" validate:"omitempty,min=0"`
	Price    *float64 `json:"price" validate:"omitempty,min=0"`
	ImageURL *string  `json:"image_url,omitempty"`
}

// Product Response
type ProductResponse struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Desc      string    `json:"desc,omitempty"`
	Quantity  int       `json:"quantity"`
	Price     float64   `json:"price"`
	ImageURL  string    `json:"image_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Converter functions
func ToResponse(entity Product) ProductResponse {
	return ProductResponse{
		ID:        entity.ID,
		Name:      entity.Name,
		Desc:      entity.Desc,
		Quantity:  entity.Quantity,
		Price:     entity.Price,
		ImageURL:  entity.ImageURL,
		CreatedAt: entity.CreatedAt,
		UpdatedAt: entity.UpdatedAt,
	}
}

func ToResponses(entities []Product) []ProductResponse {
	responses := make([]ProductResponse, len(entities))
	for i, entity := range entities {
		responses[i] = ToResponse(entity)
	}
	return responses
}