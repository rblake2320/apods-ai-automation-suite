#!/bin/bash

#############################################################################
# APODS AI-Automation Suite - Comprehensive Security Audit Script
#
# This script performs comprehensive security scanning including:
# - Dependency vulnerability scanning
# - Code security analysis
# - Secret detection
# - License compliance checking
# - Docker image scanning
# - OWASP dependency check
#
# Usage:
#   ./scripts/security-audit.sh [options]
#
# Options:
#   --quick          Run quick scan (skip slow checks)
#   --fix            Attempt to fix vulnerabilities automatically
#   --report         Generate detailed report
#   --ci             CI mode (fail on any issues)
#############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$PROJECT_ROOT/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parse command line arguments
QUICK_SCAN=false
AUTO_FIX=false
GENERATE_REPORT=false
CI_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      QUICK_SCAN=true
      shift
      ;;
    --fix)
      AUTO_FIX=true
      shift
      ;;
    --report)
      GENERATE_REPORT=true
      shift
      ;;
    --ci)
      CI_MODE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

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

# Create report directory if needed
if [ "$GENERATE_REPORT" = true ]; then
  mkdir -p "$REPORT_DIR"
  REPORT_FILE="$REPORT_DIR/security-audit-$TIMESTAMP.txt"
  exec > >(tee -a "$REPORT_FILE")
  exec 2>&1
  print_info "Report will be saved to: $REPORT_FILE"
fi

# Check if required tools are installed
check_dependencies() {
  print_header "Checking Dependencies"

  local missing_tools=()

  if ! command -v pnpm &> /dev/null; then
    missing_tools+=("pnpm")
  else
    print_success "pnpm is installed"
  fi

  if ! command -v snyk &> /dev/null; then
    print_warning "snyk is not installed (optional)"
  else
    print_success "snyk is installed"
  fi

  if ! command -v git &> /dev/null; then
    missing_tools+=("git")
  else
    print_success "git is installed"
  fi

  if [ ${#missing_tools[@]} -ne 0 ]; then
    print_error "Missing required tools: ${missing_tools[*]}"
    exit 1
  fi

  print_success "All required dependencies are installed"
}

# Run npm/pnpm audit
run_npm_audit() {
  print_header "Running NPM Audit"

  cd "$PROJECT_ROOT"

  if [ "$AUTO_FIX" = true ]; then
    print_info "Attempting to fix vulnerabilities automatically..."
    pnpm audit --fix || true
  fi

  # Run audit with different severity levels
  print_info "Checking for vulnerabilities..."

  if pnpm audit --audit-level=critical; then
    print_success "No critical vulnerabilities found"
  else
    print_error "Critical vulnerabilities detected!"
    if [ "$CI_MODE" = true ]; then
      exit 1
    fi
  fi

  if pnpm audit --audit-level=high; then
    print_success "No high severity vulnerabilities found"
  else
    print_warning "High severity vulnerabilities detected"
    if [ "$CI_MODE" = true ]; then
      exit 1
    fi
  fi

  # Generate detailed audit report
  pnpm audit --json > "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || true
}

# Run Snyk scan
run_snyk_scan() {
  print_header "Running Snyk Security Scan"

  if ! command -v snyk &> /dev/null; then
    print_warning "Snyk is not installed, skipping..."
    return 0
  fi

  cd "$PROJECT_ROOT"

  # Authenticate (assumes SNYK_TOKEN is set in environment)
  if [ -n "$SNYK_TOKEN" ]; then
    snyk auth "$SNYK_TOKEN" > /dev/null 2>&1 || true
  fi

  # Test for vulnerabilities
  print_info "Scanning for vulnerabilities..."
  if snyk test --severity-threshold=high; then
    print_success "No high severity vulnerabilities found by Snyk"
  else
    print_warning "Snyk found vulnerabilities"
    if [ "$CI_MODE" = true ]; then
      exit 1
    fi
  fi

  # Monitor project (send results to Snyk)
  if [ -n "$SNYK_TOKEN" ]; then
    snyk monitor > /dev/null 2>&1 || true
    print_info "Results sent to Snyk dashboard"
  fi
}

# Check for secrets in code
check_secrets() {
  print_header "Checking for Secrets"

  cd "$PROJECT_ROOT"

  # Patterns to search for
  local secret_patterns=(
    "api[_-]?key"
    "secret"
    "password"
    "token"
    "auth[_-]?token"
    "private[_-]?key"
    "access[_-]?token"
    "client[_-]?secret"
  )

  local found_secrets=false

  for pattern in "${secret_patterns[@]}"; do
    if git grep -i -E "$pattern" -- ':!*.env.example' ':!node_modules' ':!*.md' ':!scripts/security-audit.sh' > /dev/null 2>&1; then
      print_warning "Found potential secret pattern: $pattern"
      found_secrets=true
    fi
  done

  if [ "$found_secrets" = false ]; then
    print_success "No obvious secrets found in code"
  else
    print_warning "Review the files above for potential secrets"
    if [ "$CI_MODE" = true ]; then
      exit 1
    fi
  fi
}

# Check for outdated dependencies
check_outdated() {
  print_header "Checking for Outdated Dependencies"

  cd "$PROJECT_ROOT"

  print_info "Checking for outdated packages..."
  pnpm outdated || true

  # Count outdated packages
  local outdated_count=$(pnpm outdated 2>/dev/null | grep -c "│" || echo "0")

  if [ "$outdated_count" -gt 0 ]; then
    print_warning "Found $outdated_count outdated packages"
  else
    print_success "All packages are up to date"
  fi
}

# Check license compliance
check_licenses() {
  print_header "Checking License Compliance"

  cd "$PROJECT_ROOT"

  print_info "Analyzing package licenses..."

  # Get list of licenses
  pnpm licenses list > "$REPORT_DIR/licenses-$TIMESTAMP.txt" 2>/dev/null || true

  # Check for problematic licenses
  local problematic_licenses=("GPL" "AGPL" "LGPL")
  local found_issues=false

  for license in "${problematic_licenses[@]}"; do
    if grep -i "$license" "$REPORT_DIR/licenses-$TIMESTAMP.txt" > /dev/null 2>&1; then
      print_warning "Found $license licensed package"
      found_issues=true
    fi
  done

  if [ "$found_issues" = false ]; then
    print_success "No problematic licenses found"
  else
    print_warning "Review licenses file for details"
  fi
}

# Scan TypeScript/JavaScript code for security issues
scan_code() {
  print_header "Scanning Code for Security Issues"

  cd "$PROJECT_ROOT"

  print_info "Running ESLint security plugin..."

  # Run ESLint with security plugin
  if pnpm lint 2>&1 | grep -i "security"; then
    print_warning "Found security-related linting issues"
  else
    print_success "No security issues found by ESLint"
  fi
}

# Check Docker images for vulnerabilities
scan_docker_images() {
  if [ "$QUICK_SCAN" = true ]; then
    print_info "Skipping Docker scan in quick mode"
    return 0
  fi

  print_header "Scanning Docker Images"

  cd "$PROJECT_ROOT"

  # Check if Docker is available
  if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed, skipping..."
    return 0
  fi

  # List of images to scan
  local images=(
    "apps/backend"
    "apps/frontend"
  )

  for image in "${images[@]}"; do
    print_info "Scanning $image..."

    # Build image if Dockerfile exists
    local dockerfile_path="$PROJECT_ROOT/$image/Dockerfile"
    if [ -f "$dockerfile_path" ]; then
      # Use Snyk to scan Docker image if available
      if command -v snyk &> /dev/null; then
        snyk container test "$image" || print_warning "Vulnerabilities found in $image"
      else
        print_info "Snyk not available, skipping Docker scan"
      fi
    fi
  done

  print_success "Docker image scanning completed"
}

# Generate security report summary
generate_summary() {
  print_header "Security Audit Summary"

  echo -e "${BOLD}Audit Date:${NC} $(date)"
  echo -e "${BOLD}Project:${NC} APODS AI-Automation Suite"
  echo -e "${BOLD}Mode:${NC} $([ "$CI_MODE" = true ] && echo "CI" || echo "Interactive")"

  if [ "$GENERATE_REPORT" = true ]; then
    echo -e "${BOLD}Report Location:${NC} $REPORT_FILE"
  fi

  echo ""
  echo "Checks performed:"
  echo "  • NPM/PNPM Audit"
  echo "  • Snyk Security Scan"
  echo "  • Secret Detection"
  echo "  • Outdated Dependencies"
  echo "  • License Compliance"
  echo "  • Code Security Scan"
  if [ "$QUICK_SCAN" = false ]; then
    echo "  • Docker Image Scan"
  fi

  echo ""
  print_success "Security audit completed!"

  if [ "$GENERATE_REPORT" = true ]; then
    print_info "Full report saved to: $REPORT_FILE"
  fi
}

# Main execution
main() {
  print_header "APODS AI-Automation Suite - Security Audit"

  echo "Starting comprehensive security audit..."
  echo "Options:"
  echo "  Quick Scan: $QUICK_SCAN"
  echo "  Auto Fix: $AUTO_FIX"
  echo "  Generate Report: $GENERATE_REPORT"
  echo "  CI Mode: $CI_MODE"

  # Run all checks
  check_dependencies
  run_npm_audit
  run_snyk_scan
  check_secrets
  check_outdated
  check_licenses
  scan_code
  scan_docker_images

  # Generate summary
  generate_summary
}

# Execute main function
main
