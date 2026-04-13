.PHONY: help build up down logs clean rebuild dev prod

help:
	@echo "Media Center Management System - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Run development environment"
	@echo "  make build            - Build Docker images"
	@echo "  make up               - Start services"
	@echo "  make down             - Stop services"
	@echo "  make logs             - View logs"
	@echo "  make clean            - Remove containers and volumes"
	@echo "  make rebuild          - Rebuild without cache"
	@echo ""
	@echo "Production:"
	@echo "  make prod             - Run production environment"
	@echo "  make prod-build       - Build production images"
	@echo "  make prod-up          - Start production services"
	@echo "  make prod-down        - Stop production services"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell         - Access database shell"
	@echo "  make db-reset         - Reset database (removes volumes)"
	@echo ""

# Development commands
dev:
	docker-compose up -d

build:
	docker-compose build

up:
	docker-compose up

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

clean:
	docker-compose down -v

rebuild:
	docker-compose build --no-cache
	docker-compose up -d

# Production commands
prod:
	docker-compose -f docker-compose.prod.yml up -d

prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Database commands
db-shell:
	docker-compose exec postgres psql -U postgres -d media_center

db-reset:
	docker-compose down -v
	docker-compose up -d

# Utility commands
ps:
	docker-compose ps

exec-backend:
	docker-compose exec backend sh

exec-frontend:
	docker-compose exec frontend sh

exec-db:
	docker-compose exec postgres sh

# Build commands
build-backend:
	docker-compose build backend

build-frontend:
	docker-compose build frontend

# Stop commands
stop:
	docker-compose stop

stop-backend:
	docker-compose stop backend

stop-frontend:
	docker-compose stop frontend

stop-db:
	docker-compose stop postgres

# Restart commands
restart:
	docker-compose restart

restart-backend:
	docker-compose restart backend

restart-frontend:
	docker-compose restart frontend

restart-db:
	docker-compose restart postgres
