#!/bin/bash
# =============================================================================
# Git Setup Script for Production
# =============================================================================
# Run this script to set up git hooks and production-ready configuration
# =============================================================================

set -e

echo "========================================"
echo "  School Hub - Git Setup"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# =============================================================================
# 1. Configure Git Hooks Path
# =============================================================================

echo -e "${BLUE}[1/6]${NC} Configuring git hooks path..."
git config core.hooksPath .githooks
echo -e "${GREEN}✓${NC} Git hooks path set to .githooks"

# =============================================================================
# 2. Make Hooks Executable
# =============================================================================

echo -e "${BLUE}[2/6]${NC} Making hooks executable..."
chmod +x .githooks/pre-commit 2>/dev/null || true
echo -e "${GREEN}✓${NC} Hooks are now executable"

# =============================================================================
# 3. Set Git Attributes
# =============================================================================

echo -e "${BLUE}[3/6]${NC} Configuring git attributes..."
git config core.attributesfile .gitattributes
echo -e "${GREEN}✓${NC} Git attributes configured"

# =============================================================================
# 4. Configure Line Endings
# =============================================================================

echo -e "${BLUE}[4/6]${NC} Configuring line endings..."
git config core.autocrlf input
git config core.eol lf
echo -e "${GREEN}✓${NC} Line endings configured (LF)"

# =============================================================================
# 5. Set Up Production Branch Protection (Optional)
# =============================================================================

echo -e "${BLUE}[5/6]${NC} Setting up branch configuration..."

# Ensure main branch exists
if ! git show-ref --verify --quiet refs/heads/main; then
    if git show-ref --verify --quiet refs/heads/master; then
        git branch -m master main
        echo -e "${GREEN}✓${NC} Renamed master to main"
    fi
fi

# Set default push behavior
git config push.default simple

# Set pull to rebase (cleaner history)
git config pull.rebase true

echo -e "${GREEN}✓${NC} Branch configuration complete"

# =============================================================================
# 6. Check for Sensitive Files
# =============================================================================

echo -e "${BLUE}[6/6]${NC} Checking for sensitive files in history..."

# Check if .env files exist and are not tracked
if [ -f ".env" ]; then
    if git ls-files --error-unmatch .env > /dev/null 2>&1; then
        echo -e "${RED}⚠ WARNING: .env is tracked by git!${NC}"
        echo "Run: git rm --cached .env && echo '.env' >> .gitignore"
    else
        echo -e "${GREEN}✓${NC} .env is not tracked (good!)"
    fi
fi

if [ -f ".env.production" ]; then
    if git ls-files --error-unmatch .env.production > /dev/null 2>&1; then
        echo -e "${RED}⚠ WARNING: .env.production is tracked by git!${NC}"
        echo "Run: git rm --cached .env.production && echo '.env.production' >> .gitignore"
    else
        echo -e "${GREEN}✓${NC} .env.production is not tracked (good!)"
    fi
fi

echo ""
echo "========================================"
echo -e "${GREEN}Git setup complete!${NC}"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Create .env.production from .env.production.example"
echo "  2. Run: git add . && git commit -m 'Prepare for production'"
echo "  3. Push to remote: git push origin main"
echo ""
