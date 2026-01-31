#!/bin/bash
# analyze-helm-values.sh - Compare resource limits across environments
#
# Usage: analyze-helm-values.sh [service]
#
# This script compares resource limits between test and production environments
# for web-app services.

set -euo pipefail

SERVICE="${1:-all}"
REPO_ROOT="${REPO_ROOT:-.}"

echo "🔍 Analyzing Helm values resource limits"
echo "════════════════════════════════════════════════════════════════"
echo ""

analyze_service() {
  local service=$1
  local test_file="$REPO_ROOT/kubernetes/helm/$service/values.test.yaml"
  local prod_file="$REPO_ROOT/kubernetes/helm/$service/values.prod.yaml"

  echo "📦 Service: $service"
  echo "─────────────────────────────────────────────────────"

  if [ ! -f "$test_file" ] || [ ! -f "$prod_file" ]; then
    echo "⚠️  Warning: Values files not found for $service"
    echo "  Test: $test_file"
    echo "  Prod: $prod_file"
    echo ""
    return
  fi

  echo "Test Environment:"
  grep -A3 "resources:" "$test_file" | grep -E "cpu:|memory:" || echo "  No resource limits found"
  echo ""

  echo "Production Environment:"
  grep -A3 "resources:" "$prod_file" | grep -E "cpu:|memory:" || echo "  No resource limits found"
  echo ""
}

if [ "$SERVICE" = "all" ]; then
  analyze_service "web-app"
else
  analyze_service "$SERVICE"
fi

echo "════════════════════════════════════════════════════════════════"
echo "💡 Tip: To see full pod configuration:"
echo "  kubectl get pod <pod-name> -n <namespace> -o yaml"
