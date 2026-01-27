.PHONY: help install migrate run test clean

# Detect if venv exists and use it
VENV_PYTHON := $(shell if [ -d "venv" ]; then echo "venv/bin/python"; else echo "python3"; fi)
VENV_ALEMBIC := $(shell if [ -d "venv" ]; then echo "venv/bin/alembic"; else echo "alembic"; fi)
VENV_PIP := $(shell if [ -d "venv" ]; then echo "venv/bin/pip"; else echo "pip3"; fi)
VENV_UVICORN := $(shell if [ -d "venv" ]; then echo "venv/bin/uvicorn"; else echo "uvicorn"; fi)
VENV_PYTEST := $(shell if [ -d "venv" ]; then echo "venv/bin/pytest"; else echo "pytest"; fi)

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make migrate    - Run database migrations"
	@echo "  make run        - Run the development server"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Clean up generated files"

install:
	@if [ ! -d "venv" ]; then \
		echo "Creating virtual environment..."; \
		python3 -m venv venv; \
	fi
	$(VENV_PIP) install -r requirements.txt

migrate:
	@if [ ! -d "venv" ]; then \
		echo "Error: Virtual environment not found. Run 'make install' first."; \
		exit 1; \
	fi
	$(VENV_ALEMBIC) upgrade head

run:
	@if [ ! -d "venv" ]; then \
		echo "Error: Virtual environment not found. Run 'make install' first."; \
		exit 1; \
	fi
	$(VENV_UVICORN) app.main:app --reload --host 0.0.0.0 --port 8000

test:
	@if [ ! -d "venv" ]; then \
		echo "Error: Virtual environment not found. Run 'make install' first."; \
		exit 1; \
	fi
	$(VENV_PYTEST) -v

clean:
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
