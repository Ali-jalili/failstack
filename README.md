# FailStack

FailStack is an incident postmortem platform for documenting how software failures unfold, investigating their causes, and preserving the lessons in a reviewed public archive. Authors build structured reports with timelines, root-cause analysis, architecture changes, and prevention actions; reviewers assess each submission before publication.

[Live Demo](https://failstack.vercel.app/)

### Demo Account

Use this account to test the deployed application:

- **Email:** `adminfailstack@gmail.com`
- **Password:** `<123456>`

## Key workflows

### Write and submit a structured report

The six-step report flow guides authors through basic incident details, the affected system and technologies, an event timeline, a root-cause tree and architecture comparison, prevention actions, and a final preview. Timeline events can include affected components and CLI commands. When an architecture change is reconstructed rather than a verified fact, the report requires explanatory notes.

Authors can save incomplete reports as drafts, return to edit them, and submit them once complete. Submitted reports appear in the author's report list with their current status. Authors can edit non-published reports, respond to change requests, resubmit, and delete drafts or reports returned for changes.

### Review and publish

Reviewers and administrators get a queue of reports awaiting a decision. They can inspect a report, move through the queue, approve it for publication, or request changes with a reason. Approved reports become available in the public archive.

### Browse published incidents

The public archive supports text, severity, and system filters. Each published report has a detailed page with its timeline, impact, root-cause tree, evidence, architecture/fix details, and prevention actions. Related reports are suggested using shared system, pattern, and technologies.

Account creation and email/password sign-in are supported. Review and author destinations are selected according to the account role; contributions require sign-in.

## Technology stack

| Technology                                                         | Use in FailStack                                                                    |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Next.js 16.3.8 App Router                                          | Route pages, server-rendered data access, layouts, and server actions.              |
| React 19.2.8 and TypeScript 5.9.3                                  | User interface and application code; TypeScript is configured in strict mode.       |
| Supabase JS 2.117.2 and Supabase SSR 0.12.7                        | Cookie-aware authentication and server-side queries, mutations, and RPC calls.      |
| React Hook Form 7.89.0, Zod 4.6.5, and `@hookform/resolvers` 5.9.1 | Multi-step form state and schema-based client and server validation.                |
| Tailwind CSS 4.3.3                                                 | Utility styling, with additional project styles in `src/app/globals.css`.           |
| Vitest 5.0.5, Testing Library 16.3.3, and jsdom 30.1.3             | Unit and component tests for validation, UI behavior, and mocked server data paths. |
| ESLint 9.39.5 with Next.js configs                                 | Static linting using the Next.js Core Web Vitals and TypeScript rulesets.           |
| pnpm 10.22.0                                                       | Package manager version pinned by the project.                                      |

Lucide React supplies interface icons, and Sonner provides toast notifications.

## Architecture and engineering decisions

The App Router pages in `src/app/` define route entry points and perform server-side data loading. Feature-oriented modules under `src/features/` keep incident, authentication, and review UI near their validation schemas, server actions, and queries. Shared Supabase clients and helpers live under `src/lib/`; shared incident types live under `src/types/`.

The report form validates each step in the browser with React Hook Form and Zod. Before writing, server actions validate the full payload again. Drafts use a separate, less restrictive schema; submitting a draft revalidates the complete report before moving it to review. Cross-field rules for the initial timeline event are explicitly reapplied in the composed form schema.

Create-mode forms use a stable idempotency key to recognize retried or concurrent submissions. The action handles a database unique-violation response by looking up the matching report; this behavior depends on the external database having the expected uniqueness constraint. It is not a guarantee established by this repository alone.

Public queries explicitly select published reports. Review actions validate the decision and require a reason for change requests before calling the database function. Several server actions log backend errors and return user-facing messages; error handling varies by action.

## Database Design

The configured Supabase database is expected to use the following PostgreSQL model. Its schema and migrations are not included in this repository.

| Table                      | Purpose                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `incidents`                | Stores report details, status and timestamps, technologies, and structured timeline, root-cause, architecture-change, and prevention data. |
| `user_roles`               | Associates application users with their application roles.                                                                                 |
| `incident_review_feedback` | Records review decisions, optional feedback, reviewer references, and timestamps.                                                          |

Incident records use UUID identifiers and reference their authors; review-feedback records reference the incident and reviewer using UUIDs. Structured report content, including timelines, root-cause trees, architecture changes, and prevention actions, uses PostgreSQL `jsonb`. The report lifecycle uses `DRAFT`, `PENDING_REVIEW`, `CHANGES_REQUESTED`, and `PUBLISHED` statuses. The intended database constraints cover unique report slugs, author-scoped idempotency keys, valid status values, and required feedback for change requests.

Review decisions are applied by a PostgreSQL function that updates the incident status and records the corresponding feedback. The function implementation and table definitions are external to this repository.

## Local development

### Prerequisites

- Node.js (the repository does not pin a Node.js version)
- pnpm 10.22.0
- Supabase project configuration for authentication and data access

### Install and configure

```bash
git clone <repository-url>
cd failstack
pnpm install
```

Create a `.env.local` file in the project root with configuration for your Supabase project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon key>
```

These values are used by the Supabase server and session-refresh clients. Use configuration for a project that provides the tables and RPC functions expected by the application. Their definitions are not included in this repository; see [Known limitations](#known-limitations).

### Run locally

```bash
pnpm dev
```

The project imports Geist fonts with `next/font/google`, so a build may require network access to retrieve them.

### Project commands

| Command                  | Purpose                                             |
| ------------------------ | --------------------------------------------------- |
| `pnpm dev`               | Start the development server.                       |
| `pnpm lint`              | Run ESLint.                                         |
| `pnpm exec tsc --noEmit` | Run the TypeScript compiler without emitting files. |
| `pnpm test`              | Run the Vitest suite.                               |
| `pnpm build`             | Create a production build.                          |
| `pnpm start`             | Start the production server after a build.          |

## Testing

The Vitest suite includes schema and server-action validation, mocked Supabase query paths, and component behavior for the report form, public archive, authentication forms, and reviewer workflow. Run it with:

```bash
pnpm test
```

Supabase-facing tests use mocks. They exercise application logic and expected query/RPC calls, but do not verify a live database or its functions. The repository does not include browser-based end-to-end tests. No current passing test count is claimed here.

## Known limitations

- The repository does not include the Supabase schema, migrations, or RPC implementations. The application expects the `incidents`, `user_roles`, and `incident_review_feedback` tables and RPC functions including `get_my_reports`, `get_author_identities`, and `review_incident`. The configured database cannot be recreated from this repository alone, and its runtime behavior cannot be verified here.
- Mocked tests do not establish live Supabase integration.
- No deployment configuration or verified live deployment is included. Replace the demo link above when a deployment URL is available.
