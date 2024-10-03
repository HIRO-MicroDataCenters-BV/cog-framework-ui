# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=20.17.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app

################################################################################
# Create a stage for building the application.
FROM base AS build

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage bind mounts to package.json and yarn.lock to avoid having to copy them
# Leverage a cache mount to /pnpm/store to speed up subsequent builds.
# into this layer.
RUN corepack enable
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=.yarnrc.yml,target=.yarnrc.yml \
    --mount=type=bind,source=yarn.lock,target=yarn.lock \
    --mount=type=cache,id=yarn,target=/root/.yarn \
    yarn install --immutable

# Copy the rest of the source files into the image.
COPY . .
# Run the build script.
RUN yarn build

################################################################################
FROM nginx:stable-alpine AS nginx

COPY --from=build /usr/src/app/dist/cog-framework-ui/browser /usr/share/nginx/html/cogui

COPY conf/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD [ "nginx", "-g", "daemon off;" ]
