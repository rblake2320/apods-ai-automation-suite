#!/bin/bash

#############################################################################
# APODS AI-Automation Suite - Build All Script
#
# This script builds all projects in the monorepo with proper error handling
# and logging
#
# Usage:
#   ./scripts/build-all.sh [options]
#
# Options:
#   --clean      Clean before building
#   --watch      Watch mode for development
#############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

print_header() {
  echo -e "\n${BOLD}${BLUE}========================================${NC}"
  echo -e "${BOLD}${BLUE}$1${NC}"
  echo -e "${BOLD}${BLUE}========================================${NC}\n"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse arguments
CLEAN=false
WATCH=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --clean)
      CLEAN=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

cd "$PROJECT_ROOT"

print_header "APODS AI-Automation Suite - Build All"

# Clean if requested
if [ "$CLEAN" = true ]; then
  print_info "Cleaning build artifacts..."
  ./scripts/clean.sh --build
  print_success "Clean complete"
fi

# Check for dependencies
print_info "Checking dependencies..."
if [ ! -d "node_modules" ]; then
  print_error "Dependencies not installed!"
  echo "Run: pnpm install"
  exit 1
fi
print_success "Dependencies found"

# Type check
print_header "Type Checking"
print_info "Running TypeScript type check..."

if pnpm typecheck; then
  print_success "Type check passed"
else
  print_error "Type check failed!"
  exit 1
fi

# Build projects
print_header "Building Projects"

# Build order (respecting dependencies)
BUILD_ORDER=(
  "backend"
  "frontend"
  "@apods/mcp-filesystem"
  "@apods/mcp-playwright"
  "@apods/mcp-memory"
)

for project in "${BUILD_ORDER[@]}"; do
  print_info "Building $project..."

  if pnpm --filter "$project" build; then
    print_success "$project built successfully"
  else
    print_error "$project build failed!"
    exit 1
  fi
done

# Summary
print_header "Build Summary"

echo "${GREEN}✓ All projects built successfully!${NC}"
echo ""
echo "Build artifacts:"
echo "  - Frontend:   apps/frontend/dist"
echo "  - Backend:    apps/backend/dist"
echo "  - MCP Servers: apps/mcp-servers/*/dist"
echo ""

if [ "$WATCH" = true ]; then
  print_info "Starting watch mode..."
  pnpm -r --parallel build:watch
fi
