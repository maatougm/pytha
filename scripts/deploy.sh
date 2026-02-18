#!/bin/bash

# =============================================================================
# School Hub - Production Deployment Script
# =============================================================================
# Usage: ./deploy.sh [environment]
# Environments: local (default), staging, production
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENV=${1:-local}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# Environment Validation
# =============================================================================

validate_environment() {
    log_info "Validating environment: $ENV"
    
    case $ENV in
        local|staging|production)
            log_success "Environment '$ENV' is valid"
            ;;
        *)
            log_error "Invalid environment: $ENV"
            log_info "Valid environments: local, staging, production"
            exit 1
            ;;
    esac
}

# =============================================================================
# Pre-deployment Checks
# =============================================================================

pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if .env file exists for production
    if [ "$ENV" == "production" ] && [ ! -f "$PROJECT_DIR/.env.production" ]; then
        log_warning ".env.production not found, using .env"
    fi
    
    log_success "Pre-deployment checks passed"
}

# =============================================================================
# Build Flutter Web
# =============================================================================

build_flutter() {
    log_info "Building Flutter web app..."
    
    cd "$PROJECT_DIR/mobile"
    
    # Check if Flutter is installed
    if ! command -v flutter &> /dev/null; then
        log_error "Flutter is not installed or not in PATH"
        log_info "Please install Flutter: https://flutter.dev/docs/get-started/install"
        exit 1
    fi
    
    # Get dependencies
    log_info "Getting Flutter dependencies..."
    flutter pub get
    
    # Build for web
    log_info "Building for web (release mode)..."
    flutter build web --release
    
    log_success "Flutter web build complete"
}

# =============================================================================
# Build Docker Images
# =============================================================================

build_docker_images() {
    log_info "Building Docker images..."
    
    cd "$PROJECT_DIR"
    
    # Determine which compose file to use
    case $ENV in
        production)
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        staging)
            COMPOSE_FILE="docker-compose.staging.yml"
            ;;
        *)
            COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
    
    log_info "Using compose file: $COMPOSE_FILE"
    
    # Build images
    docker-compose -f "$COMPOSE_FILE" build
    
    log_success "Docker images built successfully"
}

# =============================================================================
# Database Migrations
# =============================================================================

run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_DIR/server"
    
    # Check if running in Docker or locally
    if docker ps | grep -q sms_server; then
        log_info "Running migrations in Docker container..."
        docker exec sms_server npx prisma migrate deploy
    else
        log_info "Running migrations locally..."
        npx prisma migrate deploy
    fi
    
    log_success "Database migrations complete"
}

# =============================================================================
# Deploy Application
# =============================================================================

deploy() {
    log_info "Deploying application ($ENV)..."
    
    cd "$PROJECT_DIR"
    
    # Determine which compose file to use
    case $ENV in
        production)
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        staging)
            COMPOSE_FILE="docker-compose.staging.yml"
            ;;
        *)
            COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
    
    # Pull latest images (if using remote registry)
    if [ "$ENV" != "local" ]; then
        log_info "Pulling latest images..."
        docker-compose -f "$COMPOSE_FILE" pull
    fi
    
    # Start services
    log_info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check health
    if docker ps | grep -q "(healthy)"; then
        log_success "Services are healthy"
    else
        log_warning "Some services may still be starting..."
    fi
    
    log_success "Deployment complete!"
}

# =============================================================================
# Post-deployment Verification
# =============================================================================

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check API health
    API_URL="http://localhost:3000/api/health"
    if curl -s "$API_URL" > /dev/null; then
        log_success "API is responding at $API_URL"
    else
        log_warning "API may not be fully ready yet"
    fi
    
    # Check web app
    WEB_URL="http://localhost:8085"
    if curl -s "$WEB_URL" > /dev/null; then
        log_success "Web app is responding at $WEB_URL"
    else
        log_warning "Web app may not be fully ready yet"
    fi
    
    # Show running containers
    log_info "Running containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# =============================================================================
# Cleanup
# =============================================================================

cleanup() {
    log_info "Cleaning up old images and volumes..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove unused volumes (optional, be careful)
    # docker volume prune -f
    
    log_success "Cleanup complete"
}

# =============================================================================
# Rollback
# =============================================================================

rollback() {
    log_warning "Rolling back deployment..."
    
    cd "$PROJECT_DIR"
    
    # Stop current containers
    docker-compose down
    
    # Restart with previous version (implementation depends on your setup)
    log_info "Rollback complete - manual intervention may be required"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo "========================================"
    echo "  School Hub Deployment"
    echo "  Environment: $ENV"
    echo "========================================"
    echo ""
    
    validate_environment
    pre_deployment_checks
    
    # Build Flutter for web (skip if using pre-built)
    if [ "$SKIP_FLUTTER_BUILD" != "true" ]; then
        build_flutter
    else
        log_warning "Skipping Flutter build (SKIP_FLUTTER_BUILD=true)"
    fi
    
    build_docker_images
    run_migrations
    deploy
    verify_deployment
    cleanup
    
    echo ""
    echo "========================================"
    echo "  Deployment Complete!"
    echo "========================================"
    echo ""
    echo "API:     http://localhost:3000"
    echo "Web App: http://localhost:8085"
    echo "API Docs: http://localhost:3000/api/docs"
    echo ""
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "School Hub Deployment Script"
        echo ""
        echo "Usage: $0 [environment]"
        echo ""
        echo "Environments:"
        echo "  local       - Deploy locally for development (default)"
        echo "  staging     - Deploy to staging environment"
        echo "  production  - Deploy to production environment"
        echo ""
        echo "Options:"
        echo "  --rollback  - Rollback to previous version"
        echo "  --help      - Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  SKIP_FLUTTER_BUILD=true  - Skip Flutter build step"
        exit 0
        ;;
    --rollback)
        rollback
        exit 0
        ;;
    *)
        main
        ;;
esac
