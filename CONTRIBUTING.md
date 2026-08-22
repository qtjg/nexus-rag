# Contributing to NEXUS RAG

## Contribution boundary

NEXUS RAG is delivered as a **GitHub source package**. Contributions should improve source code, tests, migrations, and documentation without activating a hosted deployment, Cloud Run preflight, scheduler, external connector, SSO enforcement, or production service client.

> A passing test suite is evidence of the repository state, not approval to process sensitive data or enable an external enterprise integration.

## Change workflow

Create a focused branch from `main`, keep each change reviewable, and describe its operational impact in the pull request. Do not include customer documents, access tokens, database URLs, session secrets, OAuth secrets, model-provider keys, or object-storage credentials in source control, issue text, pull requests, or fixtures.

```bash
git checkout main
git pull --ff-only
git checkout -b concise-change-name
```

## Required validation

Run this sequence from the repository root before requesting review. GitHub Actions repeats these checks for changes pushed to the repository.

```bash
pnpm check
pnpm test
pnpm build
pnpm audit --prod
```

The current baseline is **23 tests across 12 suites**, a successful type check, a production build, and no known production dependency vulnerabilities. Document any intentional deviation from that baseline in the pull request.

## Change-specific expectations

| Change type | Required contribution discipline |
| --- | --- |
| Retrieval or grounded-answer logic | Add or update retrieval/faithfulness/abstention coverage; do not weaken citation or no-answer safeguards |
| Organization, membership, grant, or policy logic | Preserve organization scoping; add authorization and isolation coverage where behavior changes |
| Source ingestion or document parsing | Preserve provenance, status transitions, replay/DLQ behavior, and deletion safety |
| Database schema | Prefer additive, reviewed Drizzle migrations; validate against a non-production database before promotion |
| LLM or external API code | Keep credentials server-side; document the replacement boundary and avoid placing secrets in client code |
| Phase 4 controls | Retain disabled-by-default behavior until accountable owner and human-review gates are accepted |
| Documentation-only updates | Confirm commands, paths, scope statements, and active/inactive deployment claims remain accurate |

## Pull request checklist

Before requesting review, explain the user-visible and operational effect of the change. Confirm that relevant tests were added or updated, all validation commands passed, and documentation has been revised when contracts or procedures changed. If the change could affect tenant isolation, governance, groundedness, data retention, retry behavior, or secret handling, request a security-focused review.

## Migration and evaluation discipline

Use the ordered files in `drizzle/` for schema evolution. Never apply unreviewed migrations to a sensitive or production database. Use disposable/non-production tenants for testing, and retain the public evaluation corpus separately from customer data. For changes that affect retrieval, response generation, or latency, re-run the appropriate quality evidence before making rollout claims.

## Deferred operational actions

The following remain outside routine source contribution and require explicit owner authorization plus the documented acceptance evidence: external hosting, Cloud Run preflight, scheduler activation, backup/restore rehearsal, realistic load/failure testing, sensitive-data onboarding, qualified security review, SSO enforcement, external connector synchronization, and production service API clients.

See [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) for local setup and [README.md](README.md) for the managed-runtime boundary and evidence records.
