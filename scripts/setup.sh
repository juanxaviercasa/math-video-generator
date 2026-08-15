#!/usr/bin/env bash

# 🚀 Math Video Generator - Quick Start Script

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      Math Video Generator - Installation Script            ║"
echo "║              v0.1.0 - Project Bootstrap                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo -e "${BLUE}[1/4]${NC} Checking prerequisites..."
echo ""

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js not found. Please install Node.js 18+ from https://nodejs.org${NC}"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js${NC} $NODE_VERSION"
fi

if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}⚠️  Git not found. Please install Git from https://git-scm.com${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Git${NC} installed"
fi

# Install pnpm if not exists
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}Installing pnpm...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm${NC} $(pnpm -v)"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}[2/4]${NC} Installing dependencies..."
echo ""
pnpm install --frozen-lockfile
echo ""

# Step 3: Setup backend
echo -e "${BLUE}[3/4]${NC} Setting up backend..."
echo ""

if [ ! -f backend/.env ]; then
    echo "Creating backend/.env..."
    cp .env.example backend/.env
    echo -e "${YELLOW}⚠️  Update backend/.env with your configuration${NC}"
fi

echo ""

# Step 4: Instructions
echo -e "${BLUE}[4/4]${NC} Next steps..."
echo ""
echo -e "${GREEN}Frontend development:${NC}"
echo "  cd frontend"
echo "  pnpm dev"
echo "  → Open http://localhost:5173"
echo ""
echo -e "${GREEN}Backend development:${NC}"
echo "  cd backend"
echo "  pnpm dev"
echo "  → Server at http://localhost:3001"
echo ""
echo -e "${GREEN}Database setup:${NC}"
echo "  cd backend"
echo "  pnpm prisma migrate dev"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "  - Setup: docs/SETUP.md"
echo "  - API: docs/API.md"
echo "  - Architecture: docs/ARCHITECTURE.md"
echo "  - Monetization: docs/MONETIZATION.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
