# NEXUS RAG local development and GitHub handoff

## Purpose

This guide is for working with the **GitHub source package**. It does not deploy NEXUS RAG, create cloud resources, configure a scheduler, or activate any guarded enterprise control. The private source repository is the selected deliverable.

> Use the repository for code review, local development, testing, and future owner-approved hosting work. Do not interpret a successful local build as authorization to onboard sensitive data or enable external service integrations.

## Repository contents

| Path | Purpose |
| --- | --- |
| `client/` | React workspace for chat, sources, collections, evaluation, and control-plane screens |
| `server/` | Express, tRPC, retrieval, ingestion, policy, and guarded control logic |
| `drizzle/` | Ordered schema migrations and snapshots |
| `docs/qa/` | Evaluation, hardening, and guarded-control verification evidence |
| `docs/operations/` | Source-handoff, external-review, scheduler, and optional future-hosting guidance |
| `.github/workflows/ci.yml` | GitHub Actions validation for type checking, tests, production build, and dependency audit |

## Prerequisites

Use **Node.js 22** and Corepack-managed **pnpm**. A MySQL/TiDB-compatible database is required for database-backed integration paths. The GitHub package does not include customer data, production secrets, or any real external-provider credentials.

```bash
corepack enable
pnpm --version
pnpm install --frozen-lockfile
```

## Validate the source package

Run the complete validation sequence from the repository root before submitting a change or creating a release candidate.

```bash
pnpm check
pnpm test
pnpm build
pnpm audit --prod
```

The expected baseline is **23 tests across 12 suites**, a successful TypeScript check, a production build, and no known production dependency vulnerabilities. GitHub Actions repeats this sequence for changes pushed to `main`.

## Local application commands

| Intent | Command | Notes |
| --- | --- | --- |
| Development server | `pnpm dev` | Runs the development server; supply runtime dependencies through the local environment only |
| Production bundle | `pnpm build` | Produces `dist/` without committing build output |
| Start a built bundle | `pnpm start` | Uses the runtime-provided `PORT`; do not hardcode a port |
| Generate and apply migrations | `pnpm db:push` | Review schema changes and use a non-production database first |

## Runtime boundary

The source package contains application logic, but several development-time dependencies were managed by the originating runtime. Their current contract and any external-hosting replacement requirements are documented in the repository README.

| Capability | Source-package status | Local or future-host requirement |
| --- | --- | --- |
| Authentication | Application integration exists | Provide an approved OAuth/OIDC adapter and safe callback/session configuration |
| Database | Drizzle schema and migrations exist | Supply a TLS-enabled MySQL/TiDB-compatible `DATABASE_URL` |
| Object storage | Application helpers exist | Supply an approved storage adapter and least-privilege credentials |
| LLM invocation | Grounded server-side flow exists | Supply an approved server-only model gateway and re-run evaluations |
| Ingestion retry | Durable job logic exists | Use an approved scheduler/worker only after duplicate-execution and review gates are met |

Never commit runtime values such as `DATABASE_URL`, session secrets, OAuth credentials, model-provider keys, or storage credentials. The repository intentionally contains no `.env` file or production credential template.

## Database and test-data discipline

Apply migrations to a disposable or non-production database first. Preserve organization boundaries during any test activity, and use the existing integration test setup/teardown helpers rather than hand-seeding long-lived test tenants. Do not turn the public CISA/NIST evaluation fixture into customer or production data.

## GitHub workflow

The private repository is available at [qtjg/nexus-rag](https://github.com/qtjg/nexus-rag). For a normal source change, create a branch, run the validation sequence above, push the branch, and review the resulting GitHub Actions run before merging. The repository already includes continuous validation; no website publication action is required for GitHub source handoff.

```bash
git checkout -b your-change
pnpm check && pnpm test && pnpm build && pnpm audit --prod
git add <changed-files>
git commit -m "describe the change"
git push -u origin your-change
```

## Read before any future hosting or sensitive-data work

External hosting is intentionally outside this GitHub-source handoff. If an accountable owner later chooses to host the system, read the referenced records before making credentials, cloud resources, or user data available.

| Record | Why it matters |
| --- | --- |
| `README.md` | Managed-runtime boundary and required adapter decisions |
| `docs/qa/public-corpus-evaluation-report.md` | Public-corpus quality evidence and its limitations |
| `docs/operations/external-review-handoff.md` | Backup/restore, load/failure, and security-review package |
| `docs/operations/external-scheduler-handoff.md` | Guarded retry-worker contract |
| `docs/operations/google-cloud-run-deployment.md` | Optional, inactive future Cloud Run architecture only |
| `docs/qa/phase-4-guarded-verification.md` | SSO, API-key, connector, and analytics activation boundaries |

Sensitive-data rollout, external scheduler activation, SSO enforcement, external connector synchronization, and production service API clients remain subject to the documented human review and acceptance gates.
