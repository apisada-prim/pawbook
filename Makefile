.PHONY: start stop restart logf logb clean

start:
	docker-compose up -d

stop:
	docker-compose down

restart:
	docker-compose restart

logf:
	# No longer in docker, tail local logs if needed or remove
	@echo "Frontend is running locally. Check terminal output."

rebuild:
	@echo "Stopping containers..."
	docker-compose down
	@echo "Cleaning backend dist..."
	rm -rf backend/dist
	@echo "Rebuilding and starting backend..."
	docker-compose up -d --build backend
	@echo "Waiting for services..."
	@sleep 10
	@echo "Pushing schema changes (Safe update)..."
	docker-compose exec backend npx prisma migrate dev
	@echo "Starting frontend..."
	@make start-fe

# Update Database (run after editing schema.prisma)
db-update:
	docker-compose exec backend npx prisma migrate dev

# Run Everything (Backend+DB in Docker, Frontend Locally)
dev:
	@make start
	@echo "Waiting for services..."
	@make start-fe

migrate:
	docker-compose exec backend npx prisma migrate dev

seed:
	docker-compose exec backend npx prisma db seed

setup:
	@echo "Installing Frontend Dependencies..."
	cd frontend && npm install --legacy-peer-deps
	@echo "Starting Backend & Database..."
	@make start
	@echo "Waiting for services to be ready..."
	@sleep 10
	@make migrate
	@make seed
	@echo "Setup complete!"
	@echo "To start Frontend: cd frontend && npm run dev"

start-fe:
	cd frontend && npm run dev
