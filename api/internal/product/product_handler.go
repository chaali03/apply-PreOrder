package product

import (
	"log"

	"scaff-food-backend/internal/db"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var validate = validator.New()

// get all produk
func GetProductsHandler(c *fiber.Ctx) error {
	log.Printf("[HANDLER] GetProductsHandler called")
	
	var products []Product
	
	result := db.DB.Find(&products)
	if result.Error != nil {
		log.Printf("[ERROR] GetProductsHandler: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch products",
			"error":   result.Error.Error(),
		})
	}
	
	response := ToResponses(products)
	
	log.Printf("[HANDLER] GetProductsHandler returned %d products", len(products))
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Products retrieved successfully",
		"data":    response,
	})
}

// get produk pake id
func GetProductByIDHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[HANDLER] GetProductByIDHandler called for ID: %s", id)
	
	var product Product
	
	result := db.DB.First(&product, "id = ?", id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Printf("[ERROR] Product not found: %s", id)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"status":  "error",
				"message": "Product not found",
			})
		}
		log.Printf("[ERROR] GetProductByIDHandler: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch product",
			"error":   result.Error.Error(),
		})
	}
	
	response := ToResponse(product)
	log.Printf("[HANDLER] Found product: %s", product.Name)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Product retrieved successfully",
		"data":    response,
	})
}

// create produk
func CreateProductHandler(c *fiber.Ctx) error {
	log.Printf("[HANDLER] CreateProductHandler called")
	
	var req CreateProductRequest
	
	// Parse JSON request
	if err := c.BodyParser(&req); err != nil {
		log.Printf("[ERROR] CreateProductHandler parse error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}
	
	// validasi request
	if err := validate.Struct(req); err != nil {
		log.Printf("[ERROR] CreateProductHandler validation error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Validation failed",
			"errors":  err.Error(),
		})
	}
	
	// create entity dari dto
	product := Product{
		Name:     req.Name,
		Desc:     req.Desc,
		Quantity: req.Quantity,
		Price:    req.Price,
		ImageURL: req.ImageURL,
	}
	
	// Save ke db
	result := db.DB.Create(&product)
	if result.Error != nil {
		log.Printf("[ERROR] CreateProductHandler database error: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to create product",
			"error":   result.Error.Error(),
		})
	}
	
	response := ToResponse(product)
	log.Printf("[HANDLER] Product created with ID: %d", product.ID)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"status":  "success",
		"message": "Product created successfully",
		"data":    response,
	})
}

// update produkl
func UpdateProductHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[HANDLER] UpdateProductHandler called for ID: %s", id)
	
	var req UpdateProductRequest
	
	// Parse JSON request
	if err := c.BodyParser(&req); err != nil {
		log.Printf("[ERROR] UpdateProductHandler parse error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}
	
	// validasi request
	if err := validate.Struct(req); err != nil {
		log.Printf("[ERROR] UpdateProductHandler validation error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "Validation failed",
			"errors":  err.Error(),
		})
	}
	
	// cari produk yg ad
	var product Product
	result := db.DB.First(&product, "id = ?", id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			log.Printf("[ERROR] Product not found: %s", id)
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"status":  "error",
				"message": "Product not found",
			})
		}
		log.Printf("[ERROR] UpdateProductHandler database error: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to fetch product",
			"error":   result.Error.Error(),
		})
	}
	
	// update field kalo ada
	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Desc != nil {
		product.Desc = *req.Desc
	}
	if req.Quantity != nil {
		product.Quantity = *req.Quantity
	}
	if req.Price != nil {
		product.Price = *req.Price
	}
	if req.ImageURL != nil {
		product.ImageURL = *req.ImageURL
	}
	
	// siumpen changes
	result = db.DB.Save(&product)
	if result.Error != nil {
		log.Printf("[ERROR] UpdateProductHandler save error: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to update product",
			"error":   result.Error.Error(),
		})
	}
	
	response := ToResponse(product)
	log.Printf("[HANDLER] Product updated ID: %s", id)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Product updated successfully",
		"data":    response,
	})
}

// Delete produk
func DeleteProductHandler(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[HANDLER] DeleteProductHandler called for ID: %s", id)
	
	result := db.DB.Delete(&Product{}, "id = ?", id)
	if result.Error != nil {
		log.Printf("[ERROR] DeleteProductHandler database error: %v", result.Error)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "Failed to delete product",
			"error":   result.Error.Error(),
		})
	}
	
	if result.RowsAffected == 0 {
		log.Printf("[ERROR] Product not found: %s", id)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "Product not found",
		})
	}
	
	log.Printf("[HANDLER] Product deleted ID: %s", id)
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Product deleted successfully",
	})
}