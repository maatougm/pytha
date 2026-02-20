# =============================================================================
# Nginx Production Image with Domain Substitution
# =============================================================================
# This Dockerfile creates an nginx image that substitutes environment variables
# into the nginx configuration at runtime.
# =============================================================================

FROM nginx:alpine

# Install envsubst for template substitution
RUN apk add --no-cache gettext

# Copy the nginx configuration template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create directories for SSL certs and web content
RUN mkdir -p /etc/nginx/ssl /var/www/certbot /var/log/nginx

# Forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
