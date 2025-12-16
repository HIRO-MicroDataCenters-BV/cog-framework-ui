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
ARG NUXT_PUBLIC_APP_VERSION=1.0.0
ARG URL_PREFIX=/uidev/

# DEX Authentication Configuration (from GitHub Secrets)
ARG NUXT_DEX_HOST
ARG NUXT_DEX_USERNAME
ARG NUXT_DEX_PASSWORD
ARG NUXT_DEX_AUTH_TYPE=local
ARG NUXT_DEX_SKIP_TLS_VERIFY=false

# Set environment variables
ENV NUXT_PUBLIC_APP_VERSION=$NUXT_PUBLIC_APP_VERSION
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_API_REMOTE=$NUXT_PUBLIC_API_REMOTE
ENV NUXT_PUBLIC_API_RUNS=$NUXT_PUBLIC_API_RUNS
ENV URL_PREFIX=$URL_PREFIX
ENV NUXT_DEX_HOST=$NUXT_DEX_HOST
ENV NUXT_DEX_USERNAME=$NUXT_DEX_USERNAME
ENV NUXT_DEX_PASSWORD=$NUXT_DEX_PASSWORD
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
# Run the build script.
RUN pnpm run build

################################################################################
FROM nginx:stable-alpine AS nginx

COPY --from=build /usr/src/app/.output/public /usr/share/nginx/html/uidev

COPY conf/proxy.conf /etc/nginx/templates/proxy.conf.template
COPY conf/no-proxy.conf /etc/nginx/templates/no_proxy.conf

EXPOSE 80

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
