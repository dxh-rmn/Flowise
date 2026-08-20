# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install system build dependencies
RUN apk update && \
    apk add --no-cache \
        libc6-compat \
        python3 \
        make \
        g++ \
        build-base \
        curl && \
    npm install -g pnpm

WORKDIR /usr/src/flowise

# Copy workspace and root configurations
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./

# Copy backend and component packages
COPY packages/server ./packages/server
COPY packages/components ./packages/components

# Disable Cypress download in build context to avoid DNS/network failures
ENV CYPRESS_INSTALL_BINARY=0

# Install all dependencies
RUN pnpm install

# Build backend and components
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# Stage 2: Runtime stage
FROM node:20-alpine

# Install runtime dependencies (e.g. chromium for scraper/puppeteer tools)
RUN apk update && \
    apk add --no-cache \
        chromium \
        git \
        curl && \
    npm install -g pnpm

# Set environment variables for Puppeteer/Playwright and security/encryption defaults
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
ENV HTTP_SECURITY_CHECK=false
ENV FLOWISE_SECRETKEY_OVERWRITE=devxhub_permanent_secret_key_2026_xyz

WORKDIR /usr/src/flowise

# Copy built workspace from builder stage
COPY --from=builder /usr/src/flowise /usr/src/flowise

# Create data directory and set correct ownership
RUN mkdir -p /home/node/.flowise && chown -R node:node /usr/src/flowise /home/node/.flowise

VOLUME ["/home/node/.flowise"]

USER node

EXPOSE 3000

CMD [ "pnpm", "start" ]