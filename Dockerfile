FROM node:20-alpine

# Install system dependencies and build tools
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

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy only the backend and component logic
COPY packages/server ./packages/server
COPY packages/components ./packages/components

# Install dependencies
RUN pnpm install

# Build the backend packages
RUN pnpm build

# Give the node user ownership
RUN chown -R node:node .

USER node

EXPOSE 3000

CMD [ "pnpm", "start" ]