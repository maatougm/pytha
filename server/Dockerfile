# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Compile seed.ts to JavaScript
RUN npx tsc prisma/seed.ts --outDir dist --esModuleInterop --target ES2020 --module commonjs --moduleResolution node --skipLibCheck

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev for prisma/seed)
RUN npm ci && npm cache clean --force

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create uploads and logs directories
RUN mkdir -p uploads logs

# Set ownership for app
RUN chown -R nestjs:nodejs /app

# Copy and set up entrypoint script (must be after ownership setup for root-owned script)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]

# Start application
CMD ["node", "dist/main"]
