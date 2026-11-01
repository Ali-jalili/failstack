# FailStack

FailStack is an incident-reporting application. It provides routes to create and edit incident reports, view published reports, manage an author's reports, and review submitted incidents.

## Prerequisites

- Node.js: the repository does not pin a version in `package.json` or a root `.nvmrc`.
- pnpm `10.22.0` (pinned by the `packageManager` field in `package.json`).

## Installation and local development

```bash
git clone <repository-url>
cd failstack
pnpm install
```

Create a local `.env.local` file and configure the following variable names with values provided for your development environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Start the development server:

```bash
pnpm dev
```

## Available commands

These commands are defined in `package.json`:

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js development server. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Start the production server. |
| `pnpm lint` | Run ESLint. |
| `pnpm test` | Run the Vitest test suite. |

The app imports fonts through `next/font/google` in `src/app/layout.tsx`. The build may need network access to retrieve those fonts and can take longer or fail in an offline environment.

## Project structure

- `src/app/` contains the Next.js routes and page/layout entry points.
- `src/features/` groups feature-specific components, validation, and server-side actions and queries.
- `src/lib/` contains shared helpers and Supabase client setup.
- `src/types/` contains shared TypeScript types.

## Tests

Run the suite with:

```bash
pnpm test
```

The latest recorded full-suite run passed 404 tests. Server-side tests use mocks; they do not verify integration with Supabase. The repository has no E2E test suite.

## Known limitations

Database behavior, including RLS policies and RPC definitions, must be verified separately; the application test mocks do not establish those database guarantees. No E2E suite is currently present.
