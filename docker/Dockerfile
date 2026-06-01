# Stage 1: Build stage
FROM node:20-slim AS build

USER root

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

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

RUN npm --version && \
    NODE_OPTIONS="--max-old-space-size=4096" npm install -g flowise \
    --fetch-timeout=600000

# Stage 2: Runtime stage
FROM node:20-slim

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

COPY --from=build /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=build /usr/local/bin /usr/local/bin

EXPOSE 3000

ENTRYPOINT ["flowise", "start"]