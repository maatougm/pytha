#!/bin/bash
# =============================================================================
# Hostinger K2 VPS - Docker Setup & Fix Script
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Hostinger K2 - Docker Setup${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root: sudo ./hostinger-setup.sh${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: System Check${NC}"
echo "----------------------------------------"
echo "Memory: $(free -h | awk '/^Mem:/{print $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $4}') free"
echo "CPU: $(nproc) cores"
echo ""

# Install Docker if not present
echo -e "${YELLOW}Step 2: Installing Docker${NC}"
echo "----------------------------------------"
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed ($(docker --version))${NC}"
fi

# Install Docker Compose
echo ""
echo -e "${YELLOW}Step 3: Installing Docker Compose${NC}"
echo "----------------------------------------"
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed ($(docker-compose --version))${NC}"
fi

# Add swap for low-memory systems
echo ""
echo -e "${YELLOW}Step 4: Checking Swap${NC}"
echo "----------------------------------------"
if [ $(free | grep Swap | awk '{print $2}') -eq 0 ]; then
    echo "Creating 2GB swap file (recommended for K2)..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${GREEN}✓ Swap created${NC}"
else
    echo -e "${GREEN}✓ Swap already exists ($(free -h | grep Swap | awk '{print $2}'))${NC}"
fi

# Optimize Docker for low memory
echo ""
echo -e "${YELLOW}Step 5: Optimizing Docker${NC}"
echo "----------------------------------------"
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "live-restore": true
}
EOF
systemctl restart docker
echo -e "${GREEN}✓ Docker optimized${NC}"

# Open firewall ports
echo ""
echo -e "${YELLOW}Step 6: Configuring Firewall${NC}"
echo "----------------------------------------"
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw --force enable
    echo -e "${GREEN}✓ UFW configured${NC}"
else
    echo "UFW not installed, skipping..."
fi

# Create app directory
echo ""
echo -e "${YELLOW}Step 7: Setup Complete${NC}"
echo "----------------------------------------"
echo -e "${GREEN}✓ Hostinger K2 ready for Docker!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy your project to /opt/school-hub/"
echo "2. cd /opt/school-hub"
echo "3. cp .env.production .env && nano .env"
echo "4. docker-compose -f docker-compose.prod.yml up -d --build"
