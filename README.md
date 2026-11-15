# FailStack

> Engineering knowledge, recovered from failure.

FailStack is a peer-reviewed incident archive for documenting production failures and preserving the lessons behind them. It guides contributors from evidence and timelines to root-cause analysis and prevention actions, then routes reports through human review before publication.

## Project at a glance

- **Product:** Incident reporting, review, and public postmortem archive.
- **Application:** Next.js App Router with TypeScript and React.
- **Data and authentication:** Supabase Auth and PostgreSQL, protected by row-level security and narrowly scoped review RPCs.
- **Validation:** Shared Zod schemas for incident forms and persisted incident data.
- **Quality:** ESLint, TypeScript, and Vitest; the repository includes a GitHub Actions quality workflow.

## What it does

- Builds structured incident reports with severity, failure pattern, affected system and technologies, and an optional official postmortem link.
- Captures an ordered incident timeline, a root-cause tree, before-and-after architecture notes, and prevention actions.
- Supports draft saving, editing, submission, and author report tracking.
- Enforces a review lifecycle: `DRAFT` → `PENDING_REVIEW` → `PUBLISHED` or `CHANGES_REQUESTED`; authors can revise and resubmit reports that need changes.
- Provides a reviewer queue and report detail view for approval or change requests. A change request requires a reason.
- Exposes published incidents in a public archive and detail pages; private drafts and review-stage reports follow their authorization rules.

## Product and engineering highlights

- **A report model built for learning:** timelines, causal relationships, architecture changes, and prevention steps keep the report useful beyond a short incident summary.
- **Explicit state transitions:** server actions validate input and constrain lifecycle changes; review decisions are handled through database RPCs.
- **Authorization at the data layer:** Supabase RLS policies scope access to published reports, report authors, and reviewers. The app also checks access in server-side flows.
- **Idempotent submission paths:** incident creation and draft saving account for repeated requests and unique-slug collisions.
- **Shared, inferred domain types:** Zod schemas define validation and derive TypeScript types, reducing drift between form inputs and persisted records.
- **Focused test coverage:** Vitest tests cover schemas, server actions and queries, forms, and report components.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Product introduction and incident-analysis method |
| `/incidents` | Public archive of published reports |
| `/incidents/report/[slug]` | Published incident report |
| `/incidents/new` | Create a report or draft (sign-in required) |
| `/incidents/[id]/edit` | Edit and resubmit an eligible report |
| `/my-incidents` | Author's reports and review feedback |
| `/review/incidents` | Reviewer queue |
| `/review/incidents/[incidentId]` | Review a submitted report |
| `/login`, `/signup` | Authentication |

## Tech stack

| Area | Tools |
| --- | --- |
| Web | Next.js 16 App Router, React 19, TypeScript 5 |
| Backend services | Supabase Auth, PostgreSQL, `@supabase/ssr`, Supabase JS |
| Forms and validation | React Hook Form, Zod 4, `@hookform/resolvers` |
| Styling and UI | Tailwind CSS 4, Lucide, Sonner |
| Quality | ESLint 9, Vitest 5, Testing Library, GitHub Actions |
| Package manager | pnpm (the package manifest pins `10.22.0`) |

## Run locally

### Requirements

- Node.js 22 is used by the repository's CI workflow.
- pnpm `10.22.0` is declared in `package.json`.
- A Supabase project for authentication and application data.

### Install

```bash
git clone <repository-url>
cd failstack
pnpm install
```

Create `.env.local` with the public project URL and anon key for your development project. See [.env.example](.env.example) for the variable names:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Start the development server:

```bash
pnpm dev
```

## Supabase migrations

The SQL files in [supabase/migrations](supabase/migrations/) define the base schema, RLS policies, and review RPCs. They were written from the application's expected behavior, not exported from a live database, and are intended for a **fresh project**. Compare them with the target project's schema, policies, functions, and role setup before applying them to an existing project. In particular, the inspected live `app_role` enum contains `reviewer`, while the fresh-project migration also defines `admin` to match application access checks.

Before pushing, verify the linked Supabase project and inspect the proposed changes:

```bash
supabase db push --dry-run --remote
```

Review the dry-run output and dashboard configuration before any actual push. The app's automated tests use mocks and do not establish that a remote database matches these migrations.

## Useful commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the local development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm exec tsc --noEmit` | Type-check the TypeScript project |
| `pnpm test` | Run the Vitest suite |

The build imports Google Fonts with `next/font/google`; a build may require network access to retrieve them.

## Repository map

```text
src/
  app/          App Router pages and layouts
  features/     Auth, incident, and review domains
  lib/          Shared utilities and Supabase clients
  types/        Shared application types
supabase/
  migrations/   SQL schema, RLS, and review RPC migrations
docs/
  database-contract.md  App query/RPC to database authorization map
```

## Verification and scope

The last recorded full test run passed **408 tests**. Unit and component tests use mocks where server/database behavior is involved; they do not replace integration tests against Supabase. The repository currently has no end-to-end suite, and the migrations have not been applied to or validated against a live database.

For the app-to-database access map, see [docs/database-contract.md](docs/database-contract.md). For the implementation, see the [incident](src/features/incidents/) and [review](src/features/review/) features.
