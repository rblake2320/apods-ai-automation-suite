#!/bin/bash

#############################################################################
# APODS AI-Automation Suite - OWASP Dependency Check Script
#
# This script runs OWASP Dependency-Check to identify project dependencies
# and check if there are any known, publicly disclosed, vulnerabilities.
#
# Prerequisites:
#   - Java 8 or higher
#   - OWASP Dependency-Check CLI
#
# Installation:
#   macOS: brew install dependency-check
#   Linux: Download from https://owasp.org/www-project-dependency-check/
#
# Usage:
#   ./scripts/owasp-check.sh [options]
#
# Options:
#   --format FORMAT    Report format: HTML, XML, JSON, CSV, ALL (default: HTML)
#   --out DIR          Output directory (default: ./owasp-reports)
#   --fail-on LEVEL    Fail build on CVSS score (0-10, default: 7)
#############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_ROOT/owasp-reports"
REPORT_FORMAT="HTML"
FAIL_ON_CVSS=7
NVD_API_KEY="${NVD_API_KEY:-}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --format)
      REPORT_FORMAT="$2"
      shift 2
      ;;
    --out)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --fail-on)
      FAIL_ON_CVSS="$2"
      shift 2
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

# Check if dependency-check is installed
check_installation() {
  print_header "Checking OWASP Dependency-Check Installation"

  if command -v dependency-check &> /dev/null; then
    print_success "OWASP Dependency-Check is installed"
    dependency-check --version
    return 0
  fi

  # Check for common installation locations
  if [ -f "/usr/local/bin/dependency-check" ]; then
    print_success "Found dependency-check at /usr/local/bin/dependency-check"
    return 0
  fi

  print_error "OWASP Dependency-Check is not installed"
  echo ""
  echo "Please install it using one of the following methods:"
  echo ""
  echo "  macOS:"
  echo "    brew install dependency-check"
  echo ""
  echo "  Linux/Windows:"
  echo "    Download from: https://github.com/jeremylong/DependencyCheck/releases"
  echo ""
  exit 1
}

# Update vulnerability database
update_database() {
  print_header "Updating Vulnerability Database"

  print_info "Updating NVD CVE data..."
  print_warning "This may take several minutes on first run..."

  # Update database
  local nvd_args=""
  if [ -n "$NVD_API_KEY" ]; then
    nvd_args="--nvdApiKey $NVD_API_KEY"
    print_info "Using NVD API key for faster updates"
  fi

  dependency-check --updateonly $nvd_args || {
    print_warning "Database update had issues, but continuing..."
  }

  print_success "Database update completed"
}

# Run dependency check
run_dependency_check() {
  print_header "Running OWASP Dependency-Check"

  # Create output directory
  mkdir -p "$OUTPUT_DIR"

  # Prepare arguments
  local nvd_args=""
  if [ -n "$NVD_API_KEY" ]; then
    nvd_args="--nvdApiKey $NVD_API_KEY"
  fi

  print_info "Scanning project: $PROJECT_ROOT"
  print_info "Output directory: $OUTPUT_DIR"
  print_info "Report format: $REPORT_FORMAT"
  print_info "Fail on CVSS: $FAIL_ON_CVSS"

  # Run the check
  dependency-check \
    --project "APODS AI-Automation Suite" \
    --scan "$PROJECT_ROOT" \
    --out "$OUTPUT_DIR" \
    --format "$REPORT_FORMAT" \
    --failOnCVSS "$FAIL_ON_CVSS" \
    --suppression "$PROJECT_ROOT/owasp-suppressions.xml" \
    --exclude "**/node_modules/**" \
    --exclude "**/dist/**" \
    --exclude "**/build/**" \
    --exclude "**/.git/**" \
    --exclude "**/coverage/**" \
    --exclude "**/test/**" \
    --exclude "**/tests/**" \
    $nvd_args

  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    print_success "No vulnerabilities found above CVSS $FAIL_ON_CVSS"
  else
    print_error "Vulnerabilities found with CVSS score >= $FAIL_ON_CVSS"
    print_info "Check the report at: $OUTPUT_DIR/dependency-check-report.html"
    return $exit_code
  fi
}

# Create suppressions file if it doesn't exist
create_suppressions_file() {
  local suppressions_file="$PROJECT_ROOT/owasp-suppressions.xml"

  if [ ! -f "$suppressions_file" ]; then
    print_info "Creating suppressions file template..."

    cat > "$suppressions_file" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<suppressions xmlns="https://jeremylong.github.io/DependencyCheck/dependency-suppression.1.3.xsd">
  <!--
    OWASP Dependency-Check Suppressions

    Use this file to suppress false positives or known issues that are not applicable.

    Example suppression:

    <suppress>
      <notes><![CDATA[
        Suppression reason goes here
      ]]></notes>
      <packageUrl regex="true">^pkg:npm/package\-name@.*$</packageUrl>
      <cve>CVE-2021-12345</cve>
    </suppress>
  -->
</suppressions>
EOF

    print_success "Created suppressions file at $suppressions_file"
  fi
}

# Display summary
show_summary() {
  print_header "OWASP Dependency-Check Summary"

  echo -e "${BOLD}Scan Date:${NC} $(date)"
  echo -e "${BOLD}Project:${NC} APODS AI-Automation Suite"
  echo -e "${BOLD}CVSS Threshold:${NC} $FAIL_ON_CVSS"
  echo -e "${BOLD}Report Format:${NC} $REPORT_FORMAT"
  echo ""

  if [ -f "$OUTPUT_DIR/dependency-check-report.html" ]; then
    echo -e "${BOLD}Report Location:${NC}"
    echo "  HTML: $OUTPUT_DIR/dependency-check-report.html"

    if [ "$REPORT_FORMAT" = "ALL" ]; then
      echo "  XML:  $OUTPUT_DIR/dependency-check-report.xml"
      echo "  JSON: $OUTPUT_DIR/dependency-check-report.json"
      echo "  CSV:  $OUTPUT_DIR/dependency-check-report.csv"
    fi

    echo ""
    print_info "Open the HTML report in your browser to view details"
  fi
}

# Main execution
main() {
  print_header "APODS AI-Automation Suite - OWASP Dependency-Check"

  check_installation
  create_suppressions_file
  update_database

  # Run the check
  if run_dependency_check; then
    show_summary
    print_success "OWASP Dependency-Check completed successfully!"
    exit 0
  else
    show_summary
    print_error "OWASP Dependency-Check found vulnerabilities!"
    exit 1
  fi
}

# Execute main function
main
