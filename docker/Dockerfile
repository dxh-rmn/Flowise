# Stage 1: Build stage
FROM node:20-alpine AS build

USER root

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

# Add ALL native build dependencies upfront
RUN apk add --no-cache \
    python3 make g++ build-base \
    cairo-dev pango-dev \
    pixman-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    librsvg-dev \
    pkgconfig \
    libc6-compat

# Increase npm timeout + memory for heavy ARM64 compilation
RUN node --max-old-space-size=4096 $(which npm) install -g flowise \
    --fetch-timeout=600000 \
    --prefer-online

# Stage 2: Runtime stage
FROM node:20-alpine

RUN apk add --no-cache \
    chromium git \
    python3 py3-pip \
    make g++ build-base \
    cairo-dev pango-dev \
    pixman-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    librsvg-dev \
    curl \
    libc6-compat

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=true

COPY --from=build /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=build /usr/local/bin /usr/local/bin

ENTRYPOINT ["flowise", "start"]