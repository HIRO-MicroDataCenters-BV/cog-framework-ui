# Cognitive Framework UI

<div align="center">

A modern machine learning workflow management UI built with Nuxt 3, featuring visual pipeline building, dataset management, and model orchestration.

[![Nuxt](https://img.shields.io/badge/Nuxt-3.16.2-00DC82?style=flat&logo=nuxt.js)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3.5.13-4FC08D?style=flat&logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.3-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
  - [Quick Start](#quick-start)
  - [Environment Configuration](#environment-configuration)
  - [Mock Mode](#mock-mode)
- [Production Build](#production-build)
- [Deployment](#deployment)
  - [Docker Deployment](#docker-deployment)
  - [Static Hosting](#static-hosting)
  - [Environment Variables for Production](#environment-variables-for-production)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Cognitive Framework UI is a comprehensive web application for managing machine learning workflows. It provides an intuitive interface for:

- Creating and managing datasets from multiple sources (files, databases, streams)
- Configuring and validating ML models
- Building complex pipelines using a visual flow editor
- Monitoring and orchestrating ML workflows

Built with modern web technologies and best practices, this application offers a seamless developer experience and production-ready deployment options.

---

## ✨ Key Features

- **📊 Dataset Management**
  - Support for multiple data sources: Files, PostgreSQL, MySQL, SQLite, MongoDB
  - Stream data handling
  - Data validation and preview

- **🤖 Model Management**
  - Model configuration and validation
  - Version control and tracking
  - Integration with ML frameworks

- **🔀 Visual Pipeline Builder**
  - Drag-and-drop interface powered by Vue Flow
  - Real-time pipeline validation
  - Node-based workflow creation

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Nuxt 3** | 3.16.2 | Vue framework (SPA mode) |
| **Vue** | 3.5.13 | Progressive JavaScript framework |
| **TypeScript** | 5.8.3 | Type-safe development |
| **Tailwind CSS** | 4.1.3 | Utility-first CSS framework |
| **shadcn-nuxt** | 2.0.0 | UI component library |
| **Vue Flow** | 1.46.3 | Visual pipeline builder |
| **Vee-Validate** | 4.15.1 | Form validation |
| **Zod** | 3.24.2 | Schema validation |
| **pnpm** | 10.20.0 | Fast, disk space efficient package manager |
| **Vitest** | 2.1.8 | Unit testing framework |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** `>= 20.x` (LTS recommended)
  ```bash
  node --version  # Should be >= v20.0.0
  ```

- **pnpm** `>= 10.20.0`
  ```bash
  # Install pnpm globally
  npm install -g pnpm
  
  # Verify installation
  pnpm --version
  ```


---

## 🚀 Local Development

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cog-framework-ui
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # For local development (recommended - never committed)
   cp .env.local.example .env.local
   
   # Or copy base configuration
   cp .env.example .env
   ```
   
   📖 **See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for detailed guide**

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3000`

The development server will start with hot-module replacement (HMR) enabled. Any changes you make to the code will be reflected immediately in the browser.

### Environment Configuration

**🔒 Best Practice: Use `.env.local` for your personal settings** (gitignored, never committed)

```bash
# Copy the local development template
cp .env.local.example .env.local

# Edit .env.local with your settings
```

**Common configuration:**

```bash
# ============================================
# API Configuration
# ============================================
# Backend API base URL
NUXT_PUBLIC_API_BASE=http://localhost:8000

# URL prefix for deployment (leave empty for local dev)
URL_PREFIX=

# App version label in the sidebar
NUXT_COG_APP_VERSION=1.0.0

# ============================================
# Development Options
# ============================================
# Enable mock data mode (use 'true' when backend is unavailable)
NUXT_PUBLIC_MOCK_ENABLED=false
```

📖 **For detailed information, see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)**

### Mock Mode

When you don't have access to a backend API, you can use mock mode for development:

1. **Enable mock mode** in your `.env.local` (recommended):
   ```bash
   # .env.local
   NUXT_PUBLIC_MOCK_ENABLED=true
   ```

2. **Restart the dev server**
   ```bash
   pnpm start
   ```

3. **Mock data configuration**
   
   - Mock data files are located in the `/mocks` directory
   - Network delay is configurable in `composables/mock.ts` (default: 3 seconds)
   - You can modify JSON files to customize the mock data

**Available mock endpoints:**
- Datasets (list, details, file, table, stream)
- Models (list, details, associations)
- Pipelines (list, runs, flow, components)
- Authentication (bypassed in mock mode)

**Network Delay Simulation:**

Mock mode includes a 3-second network delay by default to simulate real API latency. This helps test loading states and UI feedback. To adjust the delay, edit `MOCK_API_DELAY_MS` in `composables/mock.ts`.

---

## 🏗️ Production Build

### Build for Production

```bash
# Build the application
pnpm build
```

This will:
- Compile TypeScript
- Bundle and minify assets
- Generate optimized static files in `.output/public/`
- Tree-shake unused code
- Optimize images and fonts


This creates a fully static site in `.output/public/` that can be deployed to any static hosting service.

---

## 🚢 Deployment

### Docker Deployment

Docker is the recommended deployment method for production environments.

#### 1. Build Docker Image

**Basic build:**
```bash
docker build -t cog-framework-ui:latest .
```

**Build with environment variables:**
```bash
docker build \
  --build-arg NUXT_PUBLIC_API_BASE=/api \
  --build-arg URL_PREFIX=/app/ \
  --build-arg NUXT_COG_APP_VERSION=1.0.0 \
  -t cog-framework-ui:latest .
```

> `URL_PREFIX` should start and end with `/` (for example `/uidev/`, `/cogui/`, `/uiprod/`).
> Set it at build time to match the path where the app will be served.

**Build with DEX authentication secrets:**
```bash
docker build \
  --build-arg NUXT_DEX_HOST=https://dex.example.com \
  --build-arg NUXT_DEX_AUTH_TYPE=local \
  --secret id=dex_username,src=./secrets/dex_username.txt \
  --secret id=dex_password,src=./secrets/dex_password.txt \
  -t cog-framework-ui:latest .
```

#### 2. Run Docker Container

**Basic run:**
```bash
docker run -p 80:80 cog-framework-ui:latest
```

**Run with environment variables:**
```bash
docker run -p 80:80 \
  -e NUXT_PUBLIC_API_BASE=http://api.example.com \
  cog-framework-ui:latest
```

**Access the application:**
- Open `http://localhost` in your browser
- The app will be available at the configured `URL_PREFIX` (default: `/uidev/`)
- Example: if `URL_PREFIX=/cogui/`, open `http://localhost/cogui/`

#### 3. Docker Compose (Recommended for Production)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  ui:
    image: cog-framework-ui:latest
    ports:
      - "80:80"
    environment:
      - NUXT_PUBLIC_API_BASE=/api
      - URL_PREFIX=/app/
    restart: unless-stopped
    
  # Optional: Add your backend API service
  # api:
  #   image: your-backend-api:latest
  #   ports:
  #     - "8000:8000"
```

Run with Docker Compose:
```bash
docker-compose up -d
```


### Environment Variables for Production

Configure these environment variables based on your deployment method:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NUXT_PUBLIC_API_BASE` | Backend API base URL | `/apidev` | Yes |
| `URL_PREFIX` | Application URL prefix (must include leading and trailing slash) | `/uidev/` | No |
| `NUXT_COG_APP_VERSION` | Application version | `1.0.0` | No |
| `NUXT_DEX_HOST` | DEX authentication host | - | If using DEX |
| `NUXT_DEX_USERNAME` | DEX username | - | If using DEX |
| `NUXT_DEX_PASSWORD` | DEX password | - | If using DEX |
| `NUXT_DEX_AUTH_TYPE` | DEX auth type | `local` | If using DEX |
| `NUXT_DEX_SKIP_TLS_VERIFY` | Skip TLS verification | `false` | No |

#### URL Prefix Checklist

When deploying under a custom path such as `/cogui/`:

1. Set `URL_PREFIX` in build args (CI variable) to the same value.
2. Keep the trailing slash, for example `/cogui/`.
3. After deploy, verify:
   - `GET /` redirects to `/<prefix>/`
   - `GET /<prefix>/` returns `200`

---

## 🔍 Code Quality

### Linting

**Check for linting errors:**
```bash
pnpm lint
```

**Auto-fix linting issues:**
```bash
pnpm lint:fix
```

**Inspect ESLint configuration:**
```bash
pnpm lint:inspector
# Opens config inspector at http://localhost:7777
```

### Formatting

**Format code with Prettier:**
```bash
pnpm format
```

---


## 📄 License

This project is proprietary and confidential. All rights reserved.

---
