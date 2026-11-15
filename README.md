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

## Supabase migrations

The SQL files in [supabase/migrations](supabase/migrations/) were written from the app's expected behavior, not exported from a live database. Apply them to a fresh project only. The inspected live `app_role` enum contains `reviewer`; the fresh-project migration also defines `admin` to match the app's access checks. Reconcile this difference before applying. Verify which project is linked, run `supabase db push --dry-run --remote`, and review the proposed changes.

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

The latest full-suite run passed 408 tests. Server-side tests use mocks; they do not verify integration with Supabase. The repository has no E2E test suite.

## Scope and known limitations

The migrations in [supabase/migrations](supabase/migrations/) describe the schema, RLS policies, and RPC behavior inferred from the app. They are not a live database export, and the application test mocks do not prove that a deployed project matches them. Compare with and verify the target Supabase project before applying. No E2E suite is currently present.
