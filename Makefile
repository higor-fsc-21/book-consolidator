.PHONY: help install dev build start up down logs db-up db-down db-migrate db-seed db-studio typecheck format

COMPOSE ?= docker compose
COMPOSE_DEV = $(COMPOSE) -f docker-compose.dev.yml
PNPM ?= pnpm

help:
	@printf '%s\n' \
		'install      Install dependencies' \
		'dev          Start the local Next.js development server' \
		'build        Build the production application locally' \
		'start        Start the local production server' \
		'up           Build and start the app and Postgres services' \
		'down         Stop and remove Compose services' \
		'logs         Follow application logs' \
		'db-up        Start Postgres only' \
		'db-down      Stop Postgres' \
		'db-migrate   Apply Prisma migrations locally' \
		'db-seed      Seed the local database' \
		'db-studio    Open Prisma Studio' \
		'typecheck    Run the TypeScript checker' \
		'format       Format the project'

install:
	$(PNPM) install

dev:
	$(PNPM) dev

build:
	$(PNPM) build

start:
	$(PNPM) start


# Docker Compose commands - DEV

up-dev:
	$(COMPOSE_DEV) up --build -d app postgres

rebuild-dev:
	$(COMPOSE_DEV) up --build -d app

down-dev:
	$(COMPOSE_DEV) down

logs-dev:
	$(COMPOSE_DEV) logs -f app

db-up-dev:
	$(COMPOSE_DEV) up -d postgres

db-down-dev:
	$(COMPOSE_DEV) stop postgres
# Docker Compose commands - APP

up:
	$(COMPOSE) up --build

rebuild-app:
	$(COMPOSE) up --build -d app

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f app

db-up:
	$(COMPOSE) up -d postgres

db-down:
	$(COMPOSE) stop postgres

db-migrate:
	$(PNPM) db:migrate

db-seed:
	$(PNPM) db:seed

db-studio:
	$(PNPM) db:studio

typecheck:
	$(PNPM) typecheck

format:
	$(PNPM) format