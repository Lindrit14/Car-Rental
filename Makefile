.PHONY: help up down logs ps build keys clean

COMPOSE := docker compose

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

down: ## Stop the platform
	$(COMPOSE) down

up: ## Start the platform
	$(COMPOSE) up -d --build 

logs: ## Tail logs from all services
	$(COMPOSE) logs -f --tail=100

ps: ## Show service status
	$(COMPOSE) ps

build: ## Rebuild images without starting
	$(COMPOSE) build

clean: down ## Stop platform and remove all volumes (DATA LOSS)
	$(COMPOSE) down -v
