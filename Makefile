COMPOSE := docker compose

.PHONY: help up down restart status logs

help:
	@echo "Available commands:"
	@echo "  make up       Build and start all services"
	@echo "  make down     Stop and remove all containers (data is preserved)"
	@echo "  make restart  Restart all services"
	@echo "  make status   Show service status"
	@echo "  make logs     Follow logs from all services"

up:
	$(COMPOSE) up -d --build
	@$(COMPOSE) ps
	@echo ""
	@echo "Frontend:    http://localhost:3001"
	@echo "Backend API: http://localhost:4000/api"
	@echo "CloudBeaver: http://localhost:8978"

down:
	$(COMPOSE) down

restart: down up

status:
	$(COMPOSE) ps

logs:
	$(COMPOSE) logs -f
