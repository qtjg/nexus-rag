# GitHub source handoff decision

## Owner decision

On **2026-08-22**, the owner selected a **GitHub-only source-package handoff** for NEXUS RAG. The private repository is the completed deliverable. External hosting, Cloud Run preflight, scheduled-worker activation, and human-review execution are intentionally deferred to a future, separately authorized operational phase.

> Deferral is not approval. No external resource, credential, identity provider, worker, connector sync, service API client, or sensitive-data workflow is activated by this decision.

## Source-package status

| Area | Status | Evidence |
| --- | --- | --- |
| Application implementation | Complete | React/tRPC/Express source, RAG retrieval, ingestion, governance, and guarded Phase 4 code are present in the repository |
| Schema and migrations | Complete | `drizzle/schema.ts` and ordered migration history under `drizzle/` |
| Quality evidence | Complete for the approved public corpus | `docs/qa/public-corpus-evaluation-report.md` |
| Automated validation | Complete | `pnpm check`, 19 tests across 10 suites, `pnpm build`, and `pnpm audit --prod` pass locally and in GitHub Actions |
| Repository maintenance | Complete | README, local-development guide, architecture overview, contribution guide, security policy, ownership, and issue/PR templates |

## Deferred operational gates

| Gate | Status | Future trigger |
| --- | --- | --- |
| External hosting selection and configuration | Deferred | A separate owner decision to host the system outside the source package |
| Cloud Run preflight and resource configuration | Deferred | A separately approved Google Cloud implementation phase |
| Scheduled ingestion-retry worker activation | Deferred | An approved external worker adaptation plus backup/load/security evidence |
| Backup/restore rehearsal and realistic load/failure exercise | Deferred | An accountable rollout owner and non-production operational environment |
| Qualified human security review | Deferred | A planned sensitive-data or production activation phase |
| SSO enforcement, connector sync, and production API clients | Deferred | Approved integration configuration and completed external-review gates |

## Re-entry conditions

Before changing any deferred item, open a new tracked phase, identify the accountable owner, select the runtime/integration boundary, validate in non-production, and retain the required evidence. Refer to `README.md`, `docs/operations/external-review-handoff.md`, `docs/operations/external-review-evidence-register.md`, and the optional Cloud Run records only when an external operational phase is explicitly authorized.
