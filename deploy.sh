#!/bin/bash

set -e

echo "🚀 Starting CTM Credentials App Deployment..."

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker compose down || true

# Remove dangling images to free up space
echo "🧹 Cleaning up Docker images..."
docker image prune -f || true

# Build and start the application
echo "🔨 Building and starting containers..."
docker compose up --build -d

# Wait for API to be healthy
echo "⏳ Waiting for API to be healthy..."
for i in {1..30}; do
    if docker compose exec api curl -f http://localhost:3001/api/v1/health/ >/dev/null 2>&1; then
        print_status "API is healthy!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        print_error "API failed to become healthy within 30 attempts"
        echo "📋 Showing API logs:"
        docker compose logs api
        exit 1
    fi
    
    echo "Attempt $i/30: API not ready yet, waiting 2 seconds..."
    sleep 2
done

# Show container status
echo "📊 Container Status:"
docker compose ps

# Show logs to verify everything is working
echo "📋 Recent API logs:"
docker compose logs --tail=10 api

echo "📋 Recent Web logs:"
docker compose logs --tail=10 web

print_status "Deployment completed successfully!"
echo "🌐 Application URLs:"
echo "  - API: http://localhost:3001"
echo "  - Web: http://localhost:8080"
echo "  - Health Check: http://localhost:3001/api/v1/health"

echo ""
echo "📝 Useful commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Stop app: docker compose down"
echo "  - Restart app: docker compose restart"
echo "  - Shell into API: docker compose exec api sh"
