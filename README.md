# Cognitive Framework UI

A Nuxt 3-based machine learning workflow management UI for managing datasets, models, and pipelines with a visual pipeline builder.

## Tech Stack

- **Nuxt 3.16.2** (Vue 3.5.13) - SPA mode
- **TypeScript 5.8.3**
- **Tailwind CSS 4.1.3**
- **shadcn-nuxt** - UI component library
- **Vue Flow** - Visual pipeline builder
- **Vee-Validate + Zod** - Form validation
- **pnpm 10.20.0** - Package manager

## Prerequisites

- Node.js (LTS version recommended)
- pnpm 10.20.0 or higher

Install pnpm globally if you don't have it:

```bash
npm install -g pnpm
```

## Setup

Install dependencies:

```bash
pnpm install
```

## Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your environment variables in `.env`:

```bash
# API Base URL (change to your backend API server)
NUXT_PUBLIC_API_BASE=http://localhost:8000

# URL Prefix for deployment (leave empty for development)
URL_PREFIX=

# Enable mock data if you don't have a backend
MOCK_ENABLED=false
```

### Mock Mode

If you don't have a backend API running, you can enable mock mode to use sample data:

1. Set `MOCK_ENABLED=true` in your `.env` file
2. The app will use mock data from the `/mocks` directory

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm start
```

Or use the standard Nuxt dev command:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

Generate static site:

```bash
pnpm generate
```

## Code Quality

### Linting

Check code for linting errors:

```bash
pnpm lint
```

Auto-fix linting issues:

```bash
pnpm lint:fix
```

Start the ESLint config inspector on `http://localhost:7777`:

```bash
pnpm lint:inspector
```

### Formatting

Format code with Prettier:

```bash
pnpm format
```

## Testing

Run tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Run tests with coverage:

```bash
pnpm test:coverage
```

Run tests with UI:

```bash
pnpm test:ui
```

## Project Structure

```
├── components/          # Vue components
│   ├── app/            # Application components
│   ├── forms/          # Form components
│   └── ui/             # shadcn-vue UI components
├── composables/        # Vue composables (API, auth, state)
├── pages/              # File-based routing
│   ├── datasets/       # Dataset management
│   ├── models/         # Model management
│   └── pipelines/      # Pipeline builder
├── server/             # Nuxt server API routes
│   └── api/            # API endpoints (auth, proxy)
├── schemas/            # Zod validation schemas
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── assets/             # Static assets (CSS, icons)
├── public/             # Public static files
├── layouts/            # Nuxt layouts
├── middleware/         # Route middleware
├── plugins/            # Nuxt plugins
├── i18n/               # Internationalization
├── mocks/              # Mock data for development
└── test/               # Test files
```

## Key Features

- **Dataset Management** - Support for files, databases (PostgreSQL, MySQL, SQLite, MongoDB), and streams
- **Model Management** - Model validation and configuration
- **Pipeline Builder** - Visual flow editor for creating ML pipelines
- **DEX Authentication** - Integrated authentication system
- **Mock Mode** - Development mode with mock data
- **Internationalization** - Multi-language support

## Docker

Build Docker image:

```bash
docker build -t cog-framework-ui .
```

Run with Docker:

```bash
docker run -p 8080:8080 cog-framework-ui
```

## Contributing

1. Follow the existing code style
2. Run `pnpm lint:fix` before committing
3. Ensure all tests pass with `pnpm test`
4. Format code with `pnpm format`
