package routes

import (
	"github.com/gofiber/fiber/v2"
	"scaff-food-backend/internal/product"
)

func SetupProductRoutes(router fiber.Router) {
	app := router.Group("/products")
	
	app.Get("/", product.GetProductsHandler)
	app.Get("/:id", product.GetProductByIDHandler)
	app.Post("/", product.CreateProductHandler)
	app.Put("/:id", product.UpdateProductHandler)
	app.Patch("/:id", product.UpdateProductHandler)
	app.Delete("/:id", product.DeleteProductHandler)
}