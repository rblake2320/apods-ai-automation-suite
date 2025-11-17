#!/bin/bash

#############################################################################
# APODS AI-Automation Suite - Clean Script
#
# This script cleans build artifacts, dependencies, and temporary files
#
# Usage:
#   ./scripts/clean.sh [options]
#
# Options:
#   --all        Clean everything including node_modules
#   --build      Clean build artifacts only
#   --cache      Clean cache files only
#   --docker     Clean Docker resources
#############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse arguments
CLEAN_ALL=false
CLEAN_BUILD=false
CLEAN_CACHE=false
CLEAN_DOCKER=false

if [ $# -eq 0 ]; then
  CLEAN_BUILD=true
  CLEAN_CACHE=true
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      CLEAN_ALL=true
      shift
      ;;
    --build)
      CLEAN_BUILD=true
      shift
      ;;
    --cache)
      CLEAN_CACHE=true
      shift
      ;;
    --docker)
      CLEAN_DOCKER=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

cd "$PROJECT_ROOT"

echo ""
echo "APODS AI-Automation Suite - Clean Script"
echo ""

# Clean build artifacts
if [ "$CLEAN_BUILD" = true ] || [ "$CLEAN_ALL" = true ]; then
  print_info "Cleaning build artifacts..."

  rm -rf apps/frontend/dist
  rm -rf apps/backend/dist
  rm -rf apps/mcp-servers/*/dist
  rm -rf .turbo

  print_success "Build artifacts cleaned"
fi

# Clean cache files
if [ "$CLEAN_CACHE" = true ] || [ "$CLEAN_ALL" = true ]; then
  print_info "Cleaning cache files..."

  rm -rf .cache
  rm -rf apps/frontend/.cache
  rm -rf apps/backend/.cache
  rm -rf coverage
  rm -rf apps/frontend/coverage
  rm -rf apps/backend/coverage
  rm -rf .test-perf
  rm -rf playwright-report
  rm -rf test-results
  rm -rf .nyc_output

  print_success "Cache files cleaned"
fi

# Clean node_modules
if [ "$CLEAN_ALL" = true ]; then
  print_info "Cleaning node_modules..."
  print_warning "This may take a while..."

  rm -rf node_modules
  rm -rf apps/frontend/node_modules
  rm -rf apps/backend/node_modules
  rm -rf apps/mcp-servers/*/node_modules

  print_success "node_modules cleaned"
fi

# Clean Docker resources
if [ "$CLEAN_DOCKER" = true ]; then
  print_info "Cleaning Docker resources..."

  if command -v docker &> /dev/null; then
    # Stop containers
    docker-compose down 2>/dev/null || true

    # Remove volumes
    read -p "Remove Docker volumes? This will delete all data. (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose down -v 2>/dev/null || true
      print_warning "Docker volumes removed"
    fi

    # Remove images
    read -p "Remove Docker images? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker rmi $(docker images | grep apods | awk '{print $3}') 2>/dev/null || true
      print_success "Docker images removed"
    fi
  else
    print_warning "Docker is not installed, skipping..."
  fi
fi

echo ""
print_success "Clean complete!"
echo ""

if [ "$CLEAN_ALL" = true ]; then
  echo "To reinstall dependencies, run:"
  echo "  pnpm install"
  echo ""
fi
