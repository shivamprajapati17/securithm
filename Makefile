.PHONY: help install dev db-start db-stop migrate migrate-auto shell check lint

help:
	@echo "Securithm Backend — Available Commands"
	@echo "─────────────────────────────────────"
	@echo "make install       Install Python dependencies"
	@echo "make dev           Start the FastAPI dev server (hot-reload)"
	@echo "make db-start      Start PostgreSQL + Redis via Docker"
	@echo "make db-stop       Stop Docker services"
	@echo "make migrate       Run Alembic migrations (creates tables)"
	@echo "make migrate-auto  Auto-generate a new migration from model changes"
	@echo "make shell         Open a Python shell with the app context"
	@echo "make lint          Run ruff linter on backend code"

install:
	pip install -r backend/requirements.txt
	pip install email-validator ruff

dev:
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

db-start:
	docker compose up -d

db-stop:
	docker compose down

migrate:
	alembic upgrade head

migrate-auto:
	alembic revision --autogenerate -m "$(message)"

shell:
	python -c "from backend.core.database import SessionLocal; db = SessionLocal(); print('DB session ready')"

lint:
	ruff check backend/ --fix
