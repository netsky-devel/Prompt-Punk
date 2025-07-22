#!/bin/bash

# Prompt Punk Docker Compose Startup Script

echo "🎸 Starting Prompt Punk Development Environment..."

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker compose down

# Build and start all services
echo "🔨 Building and starting services..."
docker compose --env-file .env.docker up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
echo "Redis:"
docker compose exec redis redis-cli ping

echo "Backend API:"
curl -s http://localhost:3000/api/v1/health | jq .

echo "Frontend:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173

echo ""
echo "✅ Prompt Punk is running! 🎸"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:3000"
echo "📊 API Health: http://localhost:3000/api/v1/health"
echo ""
echo "📝 To view logs: docker compose logs -f [service_name]"
echo "🛑 To stop: docker compose down"
