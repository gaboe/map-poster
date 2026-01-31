#!/bin/bash
# check-logs.sh - Extract and filter pod logs with timing information
#
# Usage: check-logs.sh <pod-name> [namespace]
#
# This script retrieves logs from a Kubernetes pod and filters for key timing
# patterns and error messages to help diagnose performance issues.

set -euo pipefail

POD_NAME="${1:?Error: pod-name is required}"
NAMESPACE="${2:-map-poster}"

echo "📋 Fetching logs for pod: $POD_NAME in namespace: $NAMESPACE"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Get recent logs (last 1000 lines)
LOGS=$(kubectl logs "$POD_NAME" -n "$NAMESPACE" --tail=1000 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Error fetching logs: $LOGS"
  exit 1
fi

echo "🔍 Searching for key timing patterns..."
echo ""

# Server timing
echo "🖥️  Server Timing:"
echo "$LOGS" | grep "\[Server\]" || echo "  No [Server] logs found"
echo ""

# SSR timing
echo "⚡ SSR Timing:"
echo "$LOGS" | grep "\[SSR\]" || echo "  No [SSR] logs found"
echo ""

# TRPC timing
echo "🔌 TRPC Timing:"
echo "$LOGS" | grep "\[tRPC\]" || echo "  No [tRPC] logs found"
echo ""

# DB Pool status
echo "🗄️  DB Pool Status:"
echo "$LOGS" | grep "\[DB Pool\]" || echo "  No [DB Pool] logs found"
echo ""

# Errors and warnings
echo "⚠️  Errors and Warnings:"
echo "$LOGS" | grep -E "ERROR|WARN" || echo "  No errors or warnings found"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "✅ Log analysis complete"
