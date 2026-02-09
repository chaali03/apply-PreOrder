# Makefile
.PHONY: up down seed reset logs clean

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

seed:
	docker exec -i product-db psql -U postgres -d management_preorder < db/seed.sql

reset:
	docker-compose down -v
	docker-compose up -d

clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

run-seed:
	go run cmd/seed/main.go

migrate:
	docker exec product-api ./app migrate  # Jika kamu buat migrate command

test-db:
	docker exec -it product-db psql -U postgres -d management_preorder -c "SELECT id, name, quantity, price FROM products;"