#!/bin/bash

#############################################################################
# APODS AI-Automation Suite - Development Environment Setup Script
#
# This script sets up a complete development environment including:
# - Node.js dependencies
# - Git hooks
# - Environment configuration
# - Docker services
# - Database initialization
#
# Usage:
#   ./scripts/setup-dev.sh
#############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# Print functions
print_header() {
  echo -e "\n${BOLD}${BLUE}========================================${NC}"
  echo -e "${BOLD}${BLUE}$1${NC}"
  echo -e "${BOLD}${BLUE}========================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Welcome message
print_header "APODS AI-Automation Suite - Development Setup"

echo "This script will set up your development environment."
echo "It will:"
echo "  • Install Node.js dependencies"
echo "  • Set up Git hooks"
echo "  • Create environment files"
echo "  • Start Docker services"
echo "  • Initialize the database"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Setup cancelled."
  exit 0
fi

# Check prerequisites
print_header "Checking Prerequisites"

# Check Node.js
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed"
  echo "Please install Node.js 20.x or higher from: https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  print_error "Node.js version 20.x or higher is required (found: $(node -v))"
  exit 1
fi
print_success "Node.js $(node -v) is installed"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  print_warning "pnpm is not installed. Installing..."
  npm install -g pnpm
fi
print_success "pnpm $(pnpm -v) is installed"

# Check Docker
if ! command -v docker &> /dev/null; then
  print_warning "Docker is not installed"
  echo "Please install Docker from: https://www.docker.com/get-started"
  echo "You can continue without Docker, but some services won't be available."
  DOCKER_AVAILABLE=false
else
  print_success "Docker is installed"
  DOCKER_AVAILABLE=true
fi

# Check Git
if ! command -v git &> /dev/null; then
  print_error "Git is not installed"
  exit 1
fi
print_success "Git is installed"

# Install dependencies
print_header "Installing Dependencies"

cd "$PROJECT_ROOT"

print_info "Installing root dependencies..."
pnpm install --frozen-lockfile

print_success "Dependencies installed successfully"

# Setup Git hooks
print_header "Setting Up Git Hooks"

if [ ! -d ".git" ]; then
  print_warning "Not a git repository, skipping Git hooks setup"
else
  print_info "Installing Husky..."
  pnpm prepare
  print_success "Git hooks installed successfully"
fi

# Create environment files
print_header "Setting Up Environment Files"

# Root .env
if [ ! -f ".env" ]; then
  print_info "Creating .env from template..."
  cp .env.example .env
  print_success "Created .env"
  print_warning "Please edit .env and add your configuration"
else
  print_info ".env already exists, skipping..."
fi

# Frontend .env
if [ ! -f "apps/frontend/.env.local" ]; then
  print_info "Creating apps/frontend/.env.local from template..."
  cp apps/frontend/.env.example apps/frontend/.env.local
  print_success "Created apps/frontend/.env.local"
else
  print_info "apps/frontend/.env.local already exists, skipping..."
fi

# Backend .env
if [ ! -f "apps/backend/.env" ]; then
  print_info "Creating apps/backend/.env from template..."
  cp apps/backend/.env.example apps/backend/.env
  print_success "Created apps/backend/.env"
else
  print_info "apps/backend/.env already exists, skipping..."
fi

# Setup Docker services
if [ "$DOCKER_AVAILABLE" = true ]; then
  print_header "Setting Up Docker Services"

  read -p "Start Docker services (PostgreSQL, Redis, etc.)? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting Docker services..."

    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis

    print_info "Waiting for services to be ready..."
    sleep 10

    # Check if services are running
    if docker-compose ps | grep -q "postgres.*Up"; then
      print_success "PostgreSQL is running"
    else
      print_warning "PostgreSQL might not be ready yet"
    fi

    if docker-compose ps | grep -q "redis.*Up"; then
      print_success "Redis is running"
    else
      print_warning "Redis might not be ready yet"
    fi

    # Initialize database
    print_info "Initializing database..."
    # TODO: Add database migration command when available
    # pnpm --filter backend migrate

    print_success "Docker services are running"
  fi
fi

# Build projects
print_header "Building Projects"

read -p "Build all projects? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  print_info "Building all projects..."
  pnpm build
  print_success "All projects built successfully"
fi

# Run tests
print_header "Running Tests"

read -p "Run test suite? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  print_info "Running tests..."
  pnpm test || print_warning "Some tests failed"
fi

# Summary
print_header "Setup Complete!"

echo "Your development environment is ready!"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit environment files with your configuration:"
echo "   - .env"
echo "   - apps/frontend/.env.local"
echo "   - apps/backend/.env.local"
echo ""
echo "2. Start development servers:"
echo "   ${BOLD}pnpm dev${NC}"
echo ""
echo "3. Access services:"
echo "   - Frontend:       http://localhost:5173"
echo "   - Backend API:    http://localhost:3000"

if [ "$DOCKER_AVAILABLE" = true ]; then
  echo "   - PgAdmin:        http://localhost:5050"
  echo "   - Redis Commander: http://localhost:8081"
fi

echo ""
echo "4. Useful commands:"
echo "   ${BOLD}pnpm dev${NC}              - Start all services in development mode"
echo "   ${BOLD}pnpm test${NC}             - Run all tests"
echo "   ${BOLD}pnpm lint${NC}             - Lint all code"
echo "   ${BOLD}pnpm build${NC}            - Build all projects"
echo ""
echo "For more information, see the README.md"
echo ""
