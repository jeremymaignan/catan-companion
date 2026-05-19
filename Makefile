.PHONY: lint clean build up down restart

lint:
	black api/
	isort api/

clean:
	find . -type d -name __pycache__ -not -path "*/node_modules/*" -exec rm -rf {} +

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down && docker compose up -d
