#!/bin/bash

set -e

echo "🚀 Initializing Blogic Template TypeScript development environment..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Array of .env.example file locations
ENV_EXAMPLES=(
  "apps/web-app/.env.example"
  "packages/db/.env.example"
  "jobs/pre-deployment/.env.example"
  "jobs/post-deployment/.env.example"
)

echo "📝 Step 1: Creating .env files from .env.example templates..."
echo ""

for example_file in "${ENV_EXAMPLES[@]}"; do
  if [ -f "$example_file" ]; then
    env_file="${example_file%.example}"

    # Only copy if .env doesn't exist
    if [ ! -f "$env_file" ]; then
      cp "$example_file" "$env_file"
      printf "${GREEN}✓${NC} Created: $env_file\n"
    else
      printf "${BLUE}ℹ${NC} Skipped (already exists): $env_file\n"
    fi
  else
    printf "${YELLOW}⚠${NC} Warning: $example_file not found, skipping...\n"
  fi
done

echo ""
echo "🐳 Step 2: Starting PostgreSQL database via Docker Compose..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  printf "${YELLOW}⚠${NC} Docker is not running. Please start Docker Desktop and run this script again.\n"
  exit 1
fi

# Start only the database service
docker-compose up -d db

echo ""
printf "${GREEN}✓${NC} Database started successfully!\n"
echo ""

# Wait a moment for the database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 3

echo ""
printf "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
printf "${GREEN}✨ Initial setup complete!${NC}\n"
printf "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo ""

echo "📦 Step 3: Installing dependencies..."
echo ""
bun install
echo ""
printf "${GREEN}✓${NC} Dependencies installed successfully!\n"
echo ""

echo "📚 Step 4: Syncing external source code (opensrc)..."
echo ""
if [ -d "opensrc/repos" ]; then
  printf "${BLUE}ℹ${NC} Skipped (opensrc/repos already exists)\n"
else
  if [ -f "opensrc/sources.json" ]; then
    bun run opensrc:sync
    printf "${GREEN}✓${NC} External source code synced!\n"
  else
    printf "${YELLOW}⚠${NC} opensrc/sources.json not found, skipping...\n"
  fi
fi
echo ""

echo "🗄️  Step 5: Running database migrations..."
echo ""
bun run db:migrate
echo ""
printf "${GREEN}✓${NC} Database migrations completed!\n"
echo ""

printf "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
printf "${GREEN}✨ All setup steps completed!${NC}\n"
printf "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo ""

echo "🔌 Step 6: Checking MCP dependencies..."
echo ""

# Check if uv is installed
if ! command -v uv &> /dev/null; then
  printf "${YELLOW}⚠${NC} uv is not installed.\n"
  echo ""
  echo "To use the Postgres MCP server, you need to install uv:"
  printf "   ${BLUE}curl -LsSf https://astral.sh/uv/install.sh | sh${NC}\n"
  echo ""
  echo "After installation, restart your terminal and run this script again."
  echo ""
else
  printf "${GREEN}✓${NC} uv is installed\n"
  echo "   postgres-mcp will be automatically installed on first use via uvx"
fi

echo ""

printf "${YELLOW}⚙️  OAuth Configuration (Optional):${NC}\n"
echo ""
echo "To enable GitHub/Google social login, configure in:"
printf "   ${BLUE}apps/web-app/.env${NC}\n"
echo ""
echo "Required credentials:"
printf "   • ${BLUE}GITHUB_CLIENT_ID${NC} + ${BLUE}GITHUB_CLIENT_SECRET${NC}\n"
printf "   • ${BLUE}GOOGLE_CLIENT_ID${NC} + ${BLUE}GOOGLE_CLIENT_SECRET${NC}\n"
echo ""
echo "If not needed, remove these variables from .env"
echo "See README.md for setup instructions"
echo ""

echo "🔍 Step 7: Warming up CK semantic search index..."
printf "${YELLOW}ℹ${NC}  First run may take a few minutes to build the index (jina-code model).\n"
printf "${YELLOW}ℹ${NC}  Subsequent runs use delta indexing and are much faster.\n"
bun run ck:warmup &
echo ""

echo "🚀 Starting development server..."
echo ""
echo "🔧 Additional commands:"
printf "   • Check code quality: ${BLUE}bun run check${NC}\n"
printf "   • View database: ${BLUE}bun run db:studio${NC}\n"
printf "   • Stop database: ${BLUE}docker-compose down${NC}\n"
echo ""

bun run dev
