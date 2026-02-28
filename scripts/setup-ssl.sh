#!/bin/bash
#
# SSL Certificate Setup Script for School Hub
# Automates Let's Encrypt certificate generation and renewal
# Supports Certbot with Nginx integration
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@example.com}"
DOMAIN_NAME="${DOMAIN_NAME:-localhost}"
NGINX_CONF_DIR="${NGINX_CONF_DIR:-./nginx}"
SSL_DIR="${SSL_DIR:-./nginx/ssl}"
STAGING="${STAGING:-false}"
AUTO_RENEW="${AUTO_RENEW:-true}"

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

SSL Certificate Setup for School Hub

OPTIONS:
    -d, --domain DOMAIN          Domain name (required)
    -e, --email EMAIL            Email for Let's Encrypt notifications (required)
    -s, --staging                Use Let's Encrypt staging environment
    -n, --no-auto-renew          Disable automatic renewal setup
    -h, --help                   Show this help message

ENVIRONMENT VARIABLES:
    DOMAIN_NAME                  Domain name
    CERTBOT_EMAIL                Email for notifications
    NGINX_CONF_DIR               Nginx configuration directory
    SSL_DIR                      SSL certificates directory
    STAGING                      Set to 'true' for staging mode
    AUTO_RENEW                   Set to 'false' to disable auto-renewal

EXAMPLES:
    $0 -d schoolhub.example.com -e admin@example.com
    $0 --domain schoolhub.example.com --email admin@example.com --staging
    DOMAIN_NAME=schoolhub.example.com CERTBOT_EMAIL=admin@example.com $0

EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        -e|--email)
            CERTBOT_EMAIL="$2"
            shift 2
            ;;
        -s|--staging)
            STAGING="true"
            shift
            ;;
        -n|--no-auto-renew)
            AUTO_RENEW="false"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ "$DOMAIN_NAME" == "localhost" || -z "$DOMAIN_NAME" ]]; then
    print_error "Domain name is required. Use -d or set DOMAIN_NAME environment variable."
    usage
    exit 1
fi

if [[ "$CERTBOT_EMAIL" == "admin@example.com" || -z "$CERTBOT_EMAIL" ]]; then
    print_error "Email address is required. Use -e or set CERTBOT_EMAIL environment variable."
    usage
    exit 1
fi

print_status "Setting up SSL certificates for: $DOMAIN_NAME"
print_status "Email: $CERTBOT_EMAIL"

# Check if running as root for certbot
if [[ $EUID -ne 0 ]] && command -v certbot &> /dev/null; then
    print_warning "Certbot may require root privileges. Running with sudo recommended."
fi

# Create SSL directory
mkdir -p "$SSL_DIR"

# Check if we're in a Docker environment
IN_DOCKER=false
if [[ -f /.dockerenv ]] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    IN_DOCKER=true
    print_status "Running inside Docker container"
fi

# Function to generate self-signed certificate (for development)
generate_self_signed() {
    print_status "Generating self-signed certificate for development..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
        -keyout "$SSL_DIR/privkey.pem" \
        -out "$SSL_DIR/fullchain.pem" \
        -subj "/CN=$DOMAIN_NAME" \
        -addext "subjectAltName=DNS:$DOMAIN_NAME,DNS:www.$DOMAIN_NAME"
    
    # Create certificate chain
    cp "$SSL_DIR/fullchain.pem" "$SSL_DIR/cert.pem"
    
    print_success "Self-signed certificate generated"
    print_warning "Self-signed certificates are for development only!"
}

# Function to obtain Let's Encrypt certificate
obtain_letsencrypt() {
    print_status "Obtaining Let's Encrypt certificate..."
    
    local certbot_args=""
    
    if [[ "$STAGING" == "true" ]]; then
        certbot_args="$certbot_args --staging"
        print_warning "Using Let's Encrypt staging environment"
    fi
    
    if [[ "$IN_DOCKER" == "true" ]]; then
        # Docker mode: use webroot or standalone
        print_status "Running certbot in Docker mode..."
        
        # Check if nginx is running
        if pgrep nginx > /dev/null 2>&1; then
            certbot_args="$certbot_args --nginx"
        else
            certbot_args="$certbot_args --standalone"
        fi
    else
        # Native mode: try nginx plugin first
        if certbot plugins 2>/dev/null | grep -q nginx; then
            print_status "Using Nginx plugin for certbot"
            certbot_args="$certbot_args --nginx"
        else
            print_status "Using standalone mode for certbot"
            certbot_args="$certbot_args --standalone"
        fi
    fi
    
    # Run certbot
    certbot certonly $certbot_args \
        --agree-tos \
        --non-interactive \
        --email "$CERTBOT_EMAIL" \
        -d "$DOMAIN_NAME" \
        ${EXTRA_DOMAINS:+-d "$EXTRA_DOMAINS"}
    
    # Copy certificates to our SSL directory
    local le_dir="/etc/letsencrypt/live/$DOMAIN_NAME"
    if [[ -d "$le_dir" ]]; then
        cp "$le_dir/privkey.pem" "$SSL_DIR/"
        cp "$le_dir/fullchain.pem" "$SSL_DIR/"
        cp "$le_dir/cert.pem" "$SSL_DIR/" 2>/dev/null || cp "$le_dir/fullchain.pem" "$SSL_DIR/cert.pem"
        print_success "Let's Encrypt certificate obtained and copied to $SSL_DIR"
    else
        print_error "Let's Encrypt directory not found: $le_dir"
        exit 1
    fi
}

# Function to setup auto-renewal
setup_auto_renewal() {
    if [[ "$AUTO_RENEW" != "true" ]]; then
        print_status "Auto-renewal disabled"
        return
    fi
    
    print_status "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > "$SSL_DIR/renew.sh" << 'EOF'
#!/bin/bash
# Auto-renewal script for Let's Encrypt certificates

LOG_FILE="/var/log/letsencrypt-renewal.log"
DOMAIN_NAME="${DOMAIN_NAME:-localhost}"
SSL_DIR="${SSL_DIR:-./nginx/ssl}"
RELOAD_CMD="${RELOAD_CMD:-nginx -s reload}"

echo "[$(date)] Starting certificate renewal check" >> "$LOG_FILE"

# Run certbot renew
if certbot renew --quiet >> "$LOG_FILE" 2>&1; then
    echo "[$(date)] Certificate renewal check completed" >> "$LOG_FILE"
    
    # Copy renewed certificates
    le_dir="/etc/letsencrypt/live/$DOMAIN_NAME"
    if [[ -d "$le_dir" ]]; then
        cp "$le_dir/privkey.pem" "$SSL_DIR/"
        cp "$le_dir/fullchain.pem" "$SSL_DIR/"
        cp "$le_dir/cert.pem" "$SSL_DIR/" 2>/dev/null || true
        echo "[$(date)] Certificates copied" >> "$LOG_FILE"
    fi
    
    # Reload nginx
    if $RELOAD_CMD >> "$LOG_FILE" 2>&1; then
        echo "[$(date)] Nginx reloaded successfully" >> "$LOG_FILE"
    else
        echo "[$(date)] Failed to reload nginx" >> "$LOG_FILE"
    fi
else
    echo "[$(date)] Certificate renewal failed" >> "$LOG_FILE"
    exit 1
fi
EOF
    
    chmod +x "$SSL_DIR/renew.sh"
    
    # Add to crontab if not already present
    if command -v crontab &> /dev/null; then
        local cron_job="0 2 * * 0 $SSL_DIR/renew.sh"
        if ! crontab -l 2>/dev/null | grep -q "$SSL_DIR/renew.sh"; then
            (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
            print_success "Auto-renewal cron job added (runs every Sunday at 2 AM)"
        else
            print_warning "Auto-renewal cron job already exists"
        fi
    else
        print_warning "Crontab not available. Please set up renewal manually."
        print_status "Run this command weekly: $SSL_DIR/renew.sh"
    fi
}

# Function to create nginx SSL configuration
create_nginx_config() {
    print_status "Creating Nginx SSL configuration..."
    
    # Check if nginx-ssl.conf template exists
    if [[ ! -f "$NGINX_CONF_DIR/nginx-ssl.conf" ]]; then
        print_warning "nginx-ssl.conf template not found in $NGINX_CONF_DIR"
        print_status "Please create the nginx configuration manually"
        return
    fi
    
    # Copy and customize the configuration
    local nginx_conf="$NGINX_CONF_DIR/nginx.conf"
    cp "$NGINX_CONF_DIR/nginx-ssl.conf" "$nginx_conf"
    
    # Replace placeholders
    sed -i "s/\${DOMAIN_NAME}/$DOMAIN_NAME/g" "$nginx_conf"
    sed -i "s|/etc/letsencrypt/live/\${DOMAIN_NAME}|$SSL_DIR|g" "$nginx_conf"
    
    print_success "Nginx configuration created: $nginx_conf"
}

# Function to verify certificates
verify_certificates() {
    print_status "Verifying SSL certificates..."
    
    if [[ ! -f "$SSL_DIR/fullchain.pem" || ! -f "$SSL_DIR/privkey.pem" ]]; then
        print_error "Certificate files not found in $SSL_DIR"
        return 1
    fi
    
    # Check certificate validity
    local expiry=$(openssl x509 -in "$SSL_DIR/fullchain.pem" -noout -dates | grep notAfter | cut -d= -f2)
    print_status "Certificate expiry: $expiry"
    
    # Check certificate subject
    local subject=$(openssl x509 -in "$SSL_DIR/fullchain.pem" -noout -subject)
    print_status "Certificate subject: $subject"
    
    # Check certificate SANs
    local sans=$(openssl x509 -in "$SSL_DIR/fullchain.pem" -noout -text | grep -A1 "Subject Alternative Name" | tail -1)
    print_status "Subject Alternative Names: $sans"
    
    print_success "Certificate verification completed"
}

# Main execution
main() {
    print_status "========================================="
    print_status "School Hub SSL Certificate Setup"
    print_status "========================================="
    
    # Check for required tools
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is required but not installed"
        exit 1
    fi
    
    # Determine certificate source
    if [[ "$DOMAIN_NAME" == "localhost" ]] || [[ "$DOMAIN_NAME" == *.local ]]; then
        print_warning "Using self-signed certificate for local development"
        generate_self_signed
    elif command -v certbot &> /dev/null; then
        obtain_letsencrypt
    else
        print_warning "Certbot not found, generating self-signed certificate"
        print_status "To use Let's Encrypt, install certbot and run this script again"
        generate_self_signed
    fi
    
    # Setup auto-renewal
    setup_auto_renewal
    
    # Create nginx configuration
    create_nginx_config
    
    # Verify certificates
    verify_certificates
    
    # Print summary
    print_status "========================================="
    print_success "SSL Setup Complete!"
    print_status "========================================="
    print_status "Domain: $DOMAIN_NAME"
    print_status "SSL Directory: $SSL_DIR"
    print_status "Certificates:"
    ls -la "$SSL_DIR/"*.pem 2>/dev/null || true
    print_status "========================================="
    
    if [[ "$STAGING" == "true" ]]; then
        print_warning "Using Let's Encrypt STAGING certificates!"
        print_status "To switch to production, run:"
        print_status "  $0 -d $DOMAIN_NAME -e $CERTBOT_EMAIL"
    fi
    
    print_status ""
    print_status "Next steps:"
    print_status "1. Ensure your domain DNS points to this server"
    print_status "2. Start/reload Nginx: nginx -s reload"
    print_status "3. Test SSL: curl -v https://$DOMAIN_NAME"
    
    if [[ "$AUTO_RENEW" == "true" ]] && [[ -f "$SSL_DIR/renew.sh" ]]; then
        print_status "4. Auto-renewal is configured (runs every Sunday at 2 AM)"
        print_status "   Manual renewal: $SSL_DIR/renew.sh"
    fi
}

# Run main function
main "$@"
