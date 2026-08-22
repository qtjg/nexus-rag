# NEXUS RAG

NEXUS RAG is an organization-scoped AI knowledge-intelligence platform with grounded retrieval, source ingestion, citations, governance controls, evaluation, release gates, and guarded Phase 4 enterprise controls.

## Delivery mode: GitHub source package

The selected deliverable is the private GitHub source repository: [qtjg/nexus-rag](https://github.com/qtjg/nexus-rag). It includes the full application source, database schema and migrations, test suites, continuous validation workflow, quality evidence, and operations documentation. **No hosted deployment, Cloud Run preflight, Cloud Run service, scheduler, or cloud credential is activated by this repository handoff.**

Clone the repository and run the commands in [Run and validate](#run-and-validate) to work with the code locally or in a future owner-selected environment. The Google Cloud Run records are retained only as optional, inactive architecture guidance should an accountable owner later elect to host the system externally.

For a source-only setup walkthrough, see [Local development and GitHub handoff](docs/LOCAL_DEVELOPMENT.md).

For branch, review, validation, migration, and security expectations, see [Contributing to NEXUS RAG](CONTRIBUTING.md).

For the component map, data flows, security boundaries, and evidence records, see the [NEXUS RAG architecture overview](docs/ARCHITECTURE.md).

## Git intelligence

The 1.1.0 source-package upgrade adds governed repository snapshot registration and cited Git-diff review. Submitted code is manually scoped to an authorized collection, bounded before storage, and treated as untrusted evidence; NEXUS never clones the repository, stores repository credentials, or executes submitted content. See the [Git intelligence example](docs/examples/git-intelligence-example.md), [architecture](docs/architecture/git-intelligence.md), and [changelog](CHANGELOG.md).

Repository maintenance artifacts are also included: [Security policy](SECURITY.md), [pull-request template](.github/pull_request_template.md), structured issue forms, and default [review ownership](.github/CODEOWNERS).

For GitHub Actions runtime maintenance and self-hosted runner compatibility, see [GitHub Actions runtime maintenance](docs/operations/github-actions-runtime-maintenance.md).

The owner-approved separation between the complete source package and deferred operational gates is recorded in [GitHub source handoff decision](docs/operations/source-handoff-decision.md).

## Verified project state

The latest project checkpoint includes a public, non-sensitive CISA/NIST evaluation corpus. Its isolated 20-case run met the configured acceptance targets: **88.5% precision@5**, **90.6% recall@10**, **93.8% faithfulness**, **100.0% correct abstention**, and **3,551 ms p95** end-to-end latency. The run cleaned up all temporary database rows. The current 1.1.0 source package also passes `pnpm check`, **23 automated tests across 12 suites**, `pnpm build`, and `pnpm audit --prod`.

> The public-corpus result demonstrates the pipeline on approved public material. It does **not** authorize sensitive-data onboarding or replace the external backup/restore, load/failure, and qualified human security-review gates.

## Run and validate

| Action | Command |
| --- | --- |
| Install dependencies | `pnpm install --frozen-lockfile` |
| Type check | `pnpm check` |
| Test | `pnpm test` |
| Production build | `pnpm build` |
| Production dependency audit | `pnpm audit --prod` |
| Start bundled server | `NODE_ENV=production node dist/index.js` |

The application targets Node.js 22 and uses `pnpm`. The server honors the runtime-provided port; do not hardcode a port in a deployment command or application change.

## GitHub and external hosting boundary

This repository is the private source of record in GitHub. The current implementation is designed for the managed project runtime and uses platform-managed authentication, object storage, the built-in LLM proxy, and scheduled retry facilities. The user has **not** selected an external host for this handoff. If the code is later moved to an external host, that is not a drop-in deployment: the listed services need equivalent production adapters, credentials, security review, and tested rollback first.

| Capability in this project | Current managed dependency | Required external-hosting decision |
| --- | --- | --- |
| Authentication | Managed OAuth callback/session flow | Select and configure an OIDC/OAuth provider, callback URLs, session/cookie security, and an owner bootstrap path |
| Database | MySQL/TiDB-compatible database via `DATABASE_URL` | Provision TLS-enabled database, apply reviewed migrations, secure backups, and least-privilege runtime credentials |
| Grounded generation and faithfulness evaluation | Built-in Forge LLM proxy | Select an approved provider or internal gateway, store keys server-side, set cost/timeout limits, and re-run evaluations |
| Object storage | Managed object-storage helpers | Configure an approved S3-compatible backend, server-side credentials, retention, signed access, and deletion behavior |
| Scheduled ingestion retry | Managed Heartbeat | Select a cron/queue worker, authenticate callbacks, verify retry/dead-letter/replay, and monitor executions |

## Environment inventory

Do **not** commit any secret values. These identifiers describe the current runtime contract and must be replaced or supplied by the chosen external platform.

| Variable | Purpose | External-hosting requirement |
| --- | --- | --- |
| `DATABASE_URL` | MySQL/TiDB-compatible database connection | Required |
| `JWT_SECRET` | Cookie/session signing secret | Required; high-entropy secret managed outside Git |
| `OAUTH_SERVER_URL` | Managed OAuth server endpoint | Replace with chosen IdP integration or adapter |
| `OWNER_OPEN_ID` | Initial platform owner mapping | Replace with an approved bootstrap mechanism |
| `VITE_APP_ID` | Managed application identifier | Replace/remove based on the external host architecture |
| `BUILT_IN_FORGE_API_URL` | Managed LLM proxy endpoint | Replace with an approved LLM gateway/provider |
| `BUILT_IN_FORGE_API_KEY` | Managed LLM proxy credential | Replace with server-only provider credential |
| `VITE_FRONTEND_FORGE_API_URL` | Managed client configuration | Reassess; client-side LLM credentials must not be exposed |
| `VITE_FRONTEND_FORGE_API_KEY` | Managed client configuration | Reassess; client-side LLM credentials must not be exposed |

## Migration and release discipline

The project uses Drizzle schema definitions and ordered SQL migrations in `drizzle/`. Apply reviewed additive migrations to a non-production database first, verify query behavior, then promote through the chosen deployment process. Do not use test or evaluation fixtures as production data.

Before any external deployment, run the validation commands above and review the following project records:

| Record | Purpose |
| --- | --- |
| `docs/qa/public-corpus-evaluation-report.md` | Public-corpus quality evaluation, retrieval hardening, and cleanup proof |
| `docs/qa/phase-4-guarded-verification.md` | Guarded SSO, API, connector, and analytics boundaries |
| `docs/operations/external-review-handoff.md` | Backup, load/failure, and security-review execution package |
| `docs/operations/external-scheduler-handoff.md` | External scheduler contract for the bounded ingestion-retry worker; no worker is activated by this record |
| `docs/operations/google-cloud-run-deployment.md` | Google Cloud Run architecture, workload-identity preflight, runtime-replacement checklist, and deployment gate |
| `docs/operations/external-review-evidence-register.md` | Evidence ledger and owner/reviewer sign-off fields |
| `docs/architecture/prd-phase-gate-alignment.md` | Current PRD reconciliation and remaining gates |

## Activation gates

The following remain intentionally open and must be completed by accountable owners/reviewers before sensitive-data use or external enterprise activation.

1. Complete an external backup/restore rehearsal and record reconciliation evidence.
2. Complete a realistic load and failure exercise, including retry/dead-letter behavior.
3. Obtain a qualified human security-review sign-off and disposition of material findings.
4. Re-run the quality evaluation on owner-approved internal representative documents before an internal/sensitive rollout.
5. For external hosting, implement and test the replacement adapters in the table above before enabling SSO enforcement, external connector synchronization, or service API clients.

## References

[1] [CISA, Federal Government Cybersecurity Incident and Vulnerability Response Playbooks](https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks)

[2] [NIST, SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
