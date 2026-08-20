# Stage 1: Build stage
FROM node:20-slim AS build

USER root

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

# Install system dependencies needed to compile native addons (e.g. canvas, sqlite3, faiss-node)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    pkg-config \
    libsqlite3-dev \
    git \
    cmake \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /usr/src/flowise

# Copy workspace configuration and root metadata
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./

# Copy local packages (server and components)
COPY packages/server ./packages/server
COPY packages/components ./packages/components

# Disable Cypress download in build context to avoid DNS/network failures
ENV CYPRESS_INSTALL_BINARY=0

# Install dependencies and build our custom code
RUN pnpm install
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# Stage 2: Runtime stage
FROM node:20-slim

# Install runtime system dependencies (e.g. chromium for browser scraping, git, cairo, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    git \
    python3 \
    python3-pip \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    libsqlite3-dev \
    curl \
    cmake \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV HTTP_SECURITY_CHECK=false
ENV FLOWISE_SECRETKEY_OVERWRITE=devxhub_permanent_secret_key_2026_xyz

# Install pnpm globally in runtime stage as well
RUN npm install -g pnpm

WORKDIR /usr/src/flowise

# Copy built workspace from Stage 1
COPY --from=build /usr/src/flowise /usr/src/flowise

# Create data directory and set correct ownership
RUN mkdir -p /home/node/.flowise && chown -R node:node /usr/src/flowise /home/node/.flowise

VOLUME ["/home/node/.flowise"]

USER node

EXPOSE 3000

ENTRYPOINT ["pnpm", "start"]