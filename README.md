# GenUI

GenUI is a production-oriented generative interface platform for analytics. A user connects an authorized dataset, describes the outcome they need, and receives a validated, editable dashboard made only from approved widgets and safe analytical queries.

The repository includes a complete deterministic sales workflow so the product can be evaluated without third-party credentials, plus a Supabase/Postgres production path for OAuth, tenant isolation, versioned persistence, audit logging, and pgvector retrieval.

## What works

- Prompt-first workspace and dashboard library
- Google and GitHub OAuth through Supabase when configured
- Local D1 demo workspace when Supabase is not configured
- Tenant-scoped organizations, memberships, and Admin/Analyst/Viewer permissions
- Deterministic sample sales source and bounded CSV/TSV upload, profiling, and preview
- Safe analytical query AST; no raw SQL or executable code from a model
- Versioned Zod GenUI schema and explicit 17-widget registry
- Real Gemini structured planning, free-tier Gemini embeddings, tenant-filtered pgvector retrieval, direct-metadata fallback, citations, and operational traces
- 12-column drag/resize editor, widget actions, filters, autosave, optimistic revisions, immutable versions, undo/redo, and patch refinement
- Real Recharts visualizations, tables, CSV export, and print/PDF flow
- Supabase RLS, composite tenant foreign keys, secure pgvector matching, OAuth bootstrap, audit records, and atomic dashboard/version RPCs

## Run locally

Prerequisites: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. With no Supabase values, the app clearly identifies the local deterministic demo. Dashboard saves use the local D1 binding and survive reloads.

Quality commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run verify` runs all four gates in sequence.

## Production configuration

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (defaults to `gemini-3.1-flash-lite`)
- `GEMINI_EMBEDDING_MODEL` (defaults to `gemini-embedding-001`)

Apply the SQL files in `supabase/migrations` in timestamp order. Enable Google and GitHub in Supabase Auth and register the callback shown in `.env.example` with Supabase and both OAuth providers.

The service-role key is server-only. Never expose it in a `NEXT_PUBLIC_*` variable. Row-level security remains the primary authorization boundary; route handlers also enforce membership and role permissions server-side.

## Architecture

```text
Prompt / refinement
        │
        ▼
Tenant + source authorization
        │
        ▼
Metadata / business / component retrieval
        │
        ▼
Safe context envelope + provider abstraction
        │
        ▼
Versioned Zod GenUI schema or validated patch operations
        │
        ▼
Approved widget registry + safe query engine
        │
        ▼
Interactive renderer ── autosave ── immutable versions + audit
```

Key boundaries:

- `data/`: connector contract, sample/CSV adapters, profiling, semantic inference, and safe query execution
- `src/ai/`: provider contract, retrieval/RAG, structured dashboard schemas, orchestration, and patch application
- `src/dashboard/`: widget registry, query adapter, renderer, and responsive grid
- `src/features/`: auth, deterministic generation workflow, and application shell/editor
- `src/server/`: actor/permission checks, repositories, workspace service, and safe HTTP validation
- `db/` and `drizzle/`: local D1 schema and generated migration
- `supabase/migrations/`: production Postgres, pgvector, RLS, bootstrap, and persistence RPCs

See [Architecture](docs/architecture.md) and [Security](docs/security.md) for the detailed contracts and threat boundaries.

## Data connectors

The normalized connector contract supports connection tests, discovery, preview, typed query execution, metadata sync, and disconnect. The shipped functional paths are:

- Deterministic global sales sample
- CSV and TSV upload with UTF-8, byte, row, column, header, coercion, and scan limits

Postgres, Google Sheets, and XLSX are intentionally not shown as clickable connectors until their server-side adapters and credential lifecycle are configured. This avoids fake product controls and unsafe partial integrations.

## AI providers and RAG

All orchestration depends on the `AIProvider` interface rather than UI code. Production uses Gemini structured output for a bounded UI plan and Gemini embeddings at 1,536 dimensions. The deterministic provider remains available for repeatable unit tests and credential-free local evaluation.

The production generation route performs this sequence:

1. Authenticate the actor and enforce the generation permission and free-tier rate guard.
2. Build content-type-specific chunks for dataset metadata, metric definitions, component documentation, layout rules, and recent saved dashboard summaries.
3. Reuse unchanged content by SHA-256 checksum; embed and store only changed chunks.
4. Create a retrieval-query embedding and call the tenant-checked `match_knowledge_chunks` pgvector RPC, then narrow its RLS-authorized results to the selected source before context assembly.
5. Assemble a bounded, injection-resistant context envelope with source citations.
6. Ask Gemini for the strict `DashboardPlanSchema`, validate or repair once, then compile it into deterministic safe queries and the approved widget registry.
7. Store the generation run, exact retrieved chunk references, token/latency usage, schema version, validation status, and audit event without storing a raw prompt in the generation log.

The free Gemini tier may use submitted prompt and metadata content to improve Google products. GenUI therefore sends dataset metadata and schema summaries—not uploaded raw rows—to Gemini. Use a paid provider configuration with the appropriate data terms before processing confidential production metadata.

## Database changes

- Generate D1 SQL after local schema edits with `npm run db:generate`.
- Keep each D1 prepared statement to one SQL statement and use batches for atomic multi-statement writes.
- Add forward-only Supabase migrations; do not edit a migration already applied in a shared environment.
- Dashboard creation and saving must use the atomic RPCs in the fourth Supabase migration so the dashboard row, immutable version, and audit record cannot diverge.

## Deployment

The application uses Vinext and Cloudflare-compatible ESM output. `.openai/hosting.json` declares the logical D1 binding `DB`; Sites creates and wires the hosted resource. Supabase remains the production identity and multi-tenant data plane when its environment values are provided.

## Security notes

- Retrieved documents are filtered by organization, role, user, and source inside RLS and the vector RPC before scoring or prompt assembly.
- Retrieved content is serialized as untrusted reference data and cannot override system instructions.
- Generated dashboard JSON and refinement patches are parsed by strict Zod schemas.
- Only registry widgets and typed analytical operations execute. Arbitrary React, JavaScript, SQL DDL/DML, and callbacks are rejected.
- Source credentials belong in a secret manager or encrypted reference, never in dashboard schemas, traces, or client bundles.
- Operational traces expose timings, citations, and safe status—not hidden chain-of-thought.

## Current scope

The acceptance path is the authenticated sales workflow: select sample data or upload a compatible CSV, index authorized metadata in pgvector, retrieve cited context, create a real-AI validated dashboard, edit and move widgets, autosave/reload, inspect model/retrieval/token provenance, and refine with minimal validated patches. Sharing, broad connector coverage, and scheduled exports remain later-tier surfaces.
