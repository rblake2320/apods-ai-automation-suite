#!/bin/bash

#############################################################################
# APODS AI-Automation Suite - Test All Script
#
# This script runs all test suites (unit, integration, e2e) with proper
# reporting and error handling
#
# Usage:
#   ./scripts/test-all.sh [options]
#
# Options:
#   --unit           Run unit tests only
#   --integration    Run integration tests only
#   --e2e            Run e2e tests only
#   --coverage       Generate coverage report
#   --watch          Watch mode
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

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse arguments
RUN_UNIT=true
RUN_INTEGRATION=true
RUN_E2E=true
COVERAGE=false
WATCH=false

# If specific test type is specified, only run that
if [[ "$*" == *"--unit"* ]] || [[ "$*" == *"--integration"* ]] || [[ "$*" == *"--e2e"* ]]; then
  RUN_UNIT=false
  RUN_INTEGRATION=false
  RUN_E2E=false
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    --unit)
      RUN_UNIT=true
      shift
      ;;
    --integration)
      RUN_INTEGRATION=true
      shift
      ;;
    --e2e)
      RUN_E2E=true
      shift
      ;;
    --coverage)
      COVERAGE=true
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

print_header "APODS AI-Automation Suite - Test Suite"

# Test results tracking
UNIT_PASSED=false
INTEGRATION_PASSED=false
E2E_PASSED=false

# Unit tests
if [ "$RUN_UNIT" = true ]; then
  print_header "Running Unit Tests"

  if [ "$COVERAGE" = true ]; then
    print_info "Running unit tests with coverage..."
    if pnpm test:coverage; then
      UNIT_PASSED=true
      print_success "Unit tests passed with coverage"
    else
      print_error "Unit tests failed"
    fi
  else
    print_info "Running unit tests..."
    if [ "$WATCH" = true ]; then
      pnpm test:watch
    else
      if pnpm test:unit; then
        UNIT_PASSED=true
        print_success "Unit tests passed"
      else
        print_error "Unit tests failed"
      fi
    fi
  fi
fi

# Integration tests
if [ "$RUN_INTEGRATION" = true ]; then
  print_header "Running Integration Tests"

  # Check if Docker services are running
  if ! docker-compose ps | grep -q "postgres.*Up"; then
    print_warning "PostgreSQL is not running. Starting Docker services..."
    docker-compose up -d postgres redis
    sleep 10
  fi

  print_info "Running integration tests..."
  if pnpm test:integration; then
    INTEGRATION_PASSED=true
    print_success "Integration tests passed"
  else
    print_error "Integration tests failed"
  fi
fi

# E2E tests
if [ "$RUN_E2E" = true ]; then
  print_header "Running E2E Tests"

  print_info "Installing Playwright browsers..."
  pnpm exec playwright install --with-deps chromium || print_warning "Browser installation may have issues"

  print_info "Running E2E tests..."
  if pnpm test:e2e; then
    E2E_PASSED=true
    print_success "E2E tests passed"
  else
    print_error "E2E tests failed"
  fi
fi

# Summary
print_header "Test Summary"

echo "Test Results:"
if [ "$RUN_UNIT" = true ]; then
  if [ "$UNIT_PASSED" = true ]; then
    echo "  ${GREEN}✓ Unit Tests:        PASSED${NC}"
  else
    echo "  ${RED}✗ Unit Tests:        FAILED${NC}"
  fi
fi

if [ "$RUN_INTEGRATION" = true ]; then
  if [ "$INTEGRATION_PASSED" = true ]; then
    echo "  ${GREEN}✓ Integration Tests: PASSED${NC}"
  else
    echo "  ${RED}✗ Integration Tests: FAILED${NC}"
  fi
fi

if [ "$RUN_E2E" = true ]; then
  if [ "$E2E_PASSED" = true ]; then
    echo "  ${GREEN}✓ E2E Tests:         PASSED${NC}"
  else
    echo "  ${RED}✗ E2E Tests:         FAILED${NC}"
  fi
fi

echo ""

# Exit with error if any tests failed
if [ "$RUN_UNIT" = true ] && [ "$UNIT_PASSED" = false ]; then
  exit 1
fi

if [ "$RUN_INTEGRATION" = true ] && [ "$INTEGRATION_PASSED" = false ]; then
  exit 1
fi

if [ "$RUN_E2E" = true ] && [ "$E2E_PASSED" = false ]; then
  exit 1
fi

print_success "All tests passed!"
echo ""

if [ "$COVERAGE" = true ]; then
  echo "Coverage reports:"
  echo "  - Combined:  coverage/index.html"
  echo "  - Frontend:  apps/frontend/coverage/index.html"
  echo "  - Backend:   apps/backend/coverage/index.html"
  echo ""
fi
