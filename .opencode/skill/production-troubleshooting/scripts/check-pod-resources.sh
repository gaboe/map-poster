#!/bin/bash
# check-pod-resources.sh - Show CPU/memory usage for all pods in namespace
#
# Usage: check-pod-resources.sh <namespace>
#
# This script displays resource usage (CPU and memory) for all pods in a
# namespace with color-coded warnings for high utilization.

set -euo pipefail

NAMESPACE="${1:-map-poster}"

echo "📊 Resource usage for namespace: $NAMESPACE"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Get pod resource usage
METRICS=$(kubectl top pod -n "$NAMESPACE" --no-headers 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Error fetching metrics: $METRICS"
  echo ""
  echo "Note: Metrics server might not be installed or ready."
  echo "Install with: kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
  exit 1
fi

printf "%-40s %-15s %-15s %-10s\n" "POD" "CPU" "MEMORY" "STATUS"
printf "%-40s %-15s %-15s %-10s\n" "═══" "═══" "══════" "══════"

while IFS= read -r line; do
  POD=$(echo "$line" | awk '{print $1}')
  CPU=$(echo "$line" | awk '{print $2}')
  MEMORY=$(echo "$line" | awk '{print $3}')

  # Extract numeric values for comparison (remove 'm' for millicores, 'Mi' for memory)
  CPU_NUM=$(echo "$CPU" | sed 's/m$//')
  MEM_NUM=$(echo "$MEMORY" | sed 's/Mi$//')

  # Determine status based on usage (simplified heuristic)
  STATUS="✅ OK"
  if [ "$CPU_NUM" -gt 700 ] 2>/dev/null || [ "$MEM_NUM" -gt 800 ] 2>/dev/null; then
    STATUS="⚠️  HIGH"
  fi

  printf "%-40s %-15s %-15s %-10s\n" "$POD" "$CPU" "$MEMORY" "$STATUS"
done <<< "$METRICS"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Legend:"
echo "  ✅ OK    - Normal resource usage"
echo "  ⚠️  HIGH  - CPU >700m or Memory >800Mi (potential throttling)"
echo ""
echo "Note: Thresholds are approximate. Check pod limits with:"
echo "  kubectl get pod <pod-name> -n $NAMESPACE -o yaml | grep -A5 resources"
