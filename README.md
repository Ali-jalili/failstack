# FailStack

**A peer-reviewed incident postmortem platform for turning production failures into reusable engineering knowledge.**

FailStack helps engineering teams document what happened, understand why it happened, and make corrective actions visible. Authors create structured postmortems; reviewers assess submissions before they become part of the public incident archive.

[Open the hosted demo](https://failstack.vercel.app/)

## Demo access

Use this account to explore the hosted application:

- **Email:** `adminfailstack@gmail.com`
- **Password:** `<123456>`

This is a shared demo account for trying the project.

## Product workflows

### Create an incident report

A six-step authoring flow captures:

1. Incident summary and impact
2. Affected systems and technologies
3. Event timeline, including affected components and CLI commands
4. Root-cause analysis and architecture changes
5. Prevention actions
6. A final report preview

Authors can save incomplete reports as drafts, edit and resubmit reports that need changes, and track report status from their account.

### Review and publish

Reviewers and administrators can inspect reports in a review queue, approve them for publication, or request changes with an explanation. Published reports become available in the public archive.

### Explore the archive

Visitors can search and filter published incidents by severity and system. Each report has a detail page with its timeline, impact, causes, evidence, architecture or fix details, and prevention actions. The archive also suggests related reports based on shared systems, patterns, and technologies.

## Engineering highlights

- **Structured domain validation:** Zod schemas validate form steps and server-side submissions. Drafts have a separate, less restrictive schema; submitting a draft triggers full report validation.
- **Feature-oriented organization:** Incident, authentication, and review code is grouped under `src/features/`, alongside each feature's components, schemas, and server logic.
- **Server-side data access:** App Router pages load data on the server, with shared Supabase clients and helpers in `src/lib/`.
- **Resilient report creation:** Create flows use an idempotency key to recognize retried submissions. Correct duplicate handling depends on a matching uniqueness constraint in the configured database.
- **Publication and review flow:** Public queries select published reports, while review decisions are sent through a database RPC. Change requests require a reason.
- **Automated tests:** Vitest and Testing Library cover validation, component behavior, and mocked Supabase query and action paths.

## Technology

| Area | Technologies |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Backend and authentication | Supabase JS, Supabase SSR |
| Forms and validation | React Hook Form, Zod |
| Styling and UI | Tailwind CSS 4, Lucide React, Sonner |
| Testing and quality | Vitest, Testing Library, jsdom, ESLint |
| Package manager | pnpm 10 |

## Architecture

```text
src/
  app/        App Router pages and route entry points
  features/   Feature-specific UI, schemas, and server logic
  lib/        Shared utilities and Supabase clients
  types/      Shared application types
```

The report lifecycle is `DRAFT` → `PENDING_REVIEW` → `PUBLISHED`, with `CHANGES_REQUESTED` as the reviewer feedback state. The application validates report data before writes and revalidates drafts when they are submitted for review.

## Run locally

### Requirements

- Node.js
- pnpm 10.22.0
- A Supabase project configured with the tables and RPC functions expected by the application

### Setup

```bash
git clone https://github.com/Ali-jalili/failstack.git
cd failstack
pnpm install
```

Create a `.env.local` file in the project root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
```

Start the development server:

```bash
pnpm dev
```

The project loads Geist fonts through `next/font/google`; a build may need network access to download them.

## Project commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm lint` | Run ESLint |
| `pnpm exec tsc --noEmit` | Type-check without emitting files |
| `pnpm test` | Run the Vitest suite |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the production build |

## Testing

Run the automated suite with:

```bash
pnpm test
```

Supabase-facing tests use mocks. They verify application logic and expected query or RPC calls, but do not validate a live database integration. The repository does not currently include browser-based end-to-end tests.

## Scope and known limitations

- The Supabase schema, migrations, and RPC implementations are not included. The application expects the `incidents`, `user_roles`, and `incident_review_feedback` tables, along with RPC functions such as `get_my_reports`, `get_author_identities`, and `review_incident`.
- The external database must provide the constraints expected by the application, including unique report slugs and author-scoped idempotency keys.
- Mocked tests do not establish that the hosted demo or a separately configured Supabase project has a working end-to-end integration.
