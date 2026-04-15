# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=22.18.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Enable corepack for package manager version management
RUN corepack enable

################################################################################
# Create a stage for building the application.
FROM base AS build

# API Configuration
ARG NUXT_PUBLIC_API_BASE=/apidev
ARG NUXT_PUBLIC_API_REMOTE
ARG NUXT_PUBLIC_API_RUNS
ARG NUXT_PUBLIC_FEDERATED_ENABLED=false
ARG NUXT_COG_APP_VERSION
ARG URL_PREFIX=/uidev/

# DEX Authentication Configuration (from GitHub Secrets)
# Note: Sensitive values (password, username) will be passed via build secrets
ARG NUXT_DEX_HOST
ARG NUXT_DEX_AUTH_TYPE=local
ARG NUXT_DEX_SKIP_TLS_VERIFY=false

# Set environment variables for non-sensitive data
ENV NUXT_COG_APP_VERSION=$NUXT_COG_APP_VERSION
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_API_REMOTE=$NUXT_PUBLIC_API_REMOTE
ENV NUXT_PUBLIC_API_RUNS=$NUXT_PUBLIC_API_RUNS
ENV NUXT_PUBLIC_FEDERATED_ENABLED=$NUXT_PUBLIC_FEDERATED_ENABLED
ENV URL_PREFIX=$URL_PREFIX
ENV NUXT_DEX_HOST=$NUXT_DEX_HOST
ENV NUXT_DEX_AUTH_TYPE=$NUXT_DEX_AUTH_TYPE
ENV NUXT_DEX_SKIP_TLS_VERIFY=$NUXT_DEX_SKIP_TLS_VERIFY
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NUXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage bind mounts to package.json and pnpm-lock.yaml to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy the rest of the source files into the image.
COPY . .

# Inject DEX credentials from build secrets if available
# This avoids exposing credentials in ARG/ENV
RUN --mount=type=secret,id=dex_username \
    --mount=type=secret,id=dex_password \
    echo "=== DEX Secrets Debug ===" && \
    echo "Checking for dex_username secret..." && \
    if [ -f /run/secrets/dex_username ]; then \
    echo "✓ dex_username secret found (length: $(wc -c < /run/secrets/dex_username))"; \
    export NUXT_DEX_USERNAME=$(cat /run/secrets/dex_username); \
    else \
    echo "✗ dex_username secret NOT found"; \
    fi && \
    echo "Checking for dex_password secret..." && \
    if [ -f /run/secrets/dex_password ]; then \
    echo "✓ dex_password secret found (length: $(wc -c < /run/secrets/dex_password))"; \
    export NUXT_DEX_PASSWORD=$(cat /run/secrets/dex_password); \
    else \
    echo "✗ dex_password secret NOT found"; \
    fi && \
    echo "=== Environment Variables ===" && \
    echo "NUXT_DEX_HOST: ${NUXT_DEX_HOST:-NOT SET}" && \
    echo "NUXT_DEX_USERNAME: ${NUXT_DEX_USERNAME:+SET (hidden)}" && \
    echo "NUXT_DEX_PASSWORD: ${NUXT_DEX_PASSWORD:+SET (hidden)}" && \
    echo "NUXT_DEX_AUTH_TYPE: ${NUXT_DEX_AUTH_TYPE:-NOT SET}" && \
    echo "=== Running build ===" && \
    pnpm run build

################################################################################
FROM nginx:stable-alpine AS nginx
ARG URL_PREFIX=/uidev/
ENV URL_PREFIX=$URL_PREFIX

# Copy static files to /uidev/ path
# Nuxt generates files in .output/public/, we copy them to nginx /uidev/ directory
COPY --from=build /usr/src/app/.output/public /usr/share/nginx/html/uidev

COPY conf/proxy.conf /etc/nginx/templates/proxy.conf.template
COPY conf/no-proxy.conf /etc/nginx/templates/no_proxy.conf.template

EXPOSE 80

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
