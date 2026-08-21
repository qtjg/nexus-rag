# NEXUS RAG external scheduler handoff

## Scope and decision boundary

This record describes the **existing** ingestion-retry worker so an accountable deployment owner can adapt it to an approved external runtime. It does not activate a worker, expose a new endpoint, change authentication, or authorize sensitive-data processing.

> The current implementation is deliberately tied to the managed runtime's authenticated scheduled-callback identity. An arbitrary external scheduler must **not** call the existing callback directly or bypass its cron-only authorization check.

## Verified current behavior

| Concern | Implemented behavior | Source of truth |
| --- | --- | --- |
| Retry selection | Selects jobs in `retry_scheduled` whose `nextAttemptAt` is unset or due, oldest first | `server/nexus/service.ts` |
| Batch bound | Defaults to 10 jobs per invocation and clamps any requested value to 1–25 | `processDueIngestionJobs(limit)` |
| Processing model | Processes the selected jobs sequentially through the ordinary ingestion path | `processDueIngestionJobs()` |
| Existing cadence | The managed scheduler is configured for every five minutes (`0 */5 * * * *`, UTC) | `configureIngestionRetrySchedule()` |
| Existing callback | `POST /api/scheduled/ingestion-retry` rejects non-cron callers and returns structured failures | `server/nexus/scheduled.ts` |
| Worker ownership record | The managed job ID is persisted on the organization and enabling it is audited | `organizations.ingestionRetryTaskUid` and audit trail |

## External-runtime contract

An external deployment should run a **server-side worker entry point** that imports and invokes `processDueIngestionJobs()` inside the deployed application trust boundary. It must not use browser automation, an unauthenticated HTTP request, or an API key intended for customer query access.

| Requirement | Minimum deployment-owner responsibility |
| --- | --- |
| Trigger | Run every five minutes initially, matching the verified implementation; adjust only after a measured load review |
| Exclusivity | Prevent overlapping executions while the current worker has no cross-process lease/claim operation; add a database-backed lease before horizontally scaling workers |
| Credentials | Grant the worker only the production database, object-storage, and approved LLM/gateway permissions that the ingestion path needs; store credentials in the host's secret manager |
| Runtime | Use the same reviewed Node.js release and locked dependency graph as the web process; invoke the existing business function rather than duplicating retry rules |
| Limits | Retain the 1–25 bounded batch size; begin with the verified default of 10 and alarm on sustained backlog rather than raising limits blindly |
| Failure handling | Preserve the existing retry/dead-letter state machine; propagate failures to the scheduler for alerting without discarding the job error context |
| Observability | Record run start/end, selected and processed count, failure count, retry backlog age, dead-letter count, and any skipped/concurrent invocation |
| Network access | Restrict database and storage access to the worker's workload identity and private network path; do not make the scheduled route publicly callable |

## Required pre-activation checks

The deployment owner must complete the following in a non-production environment before enabling the external worker.

1. Create controlled retry-scheduled and dead-letter jobs, then demonstrate that each due job is processed once under a single scheduled run.
2. Trigger a simulated storage, parser, and LLM/gateway failure; verify attempt progression, backoff, error preservation, and dead-letter recovery.
3. Trigger two near-simultaneous scheduler invocations and demonstrate that the scheduler's overlap rule or a database lease prevents duplicate execution.
4. Verify the worker cannot access data outside its organization-scoped application paths and that no customer query API credential can invoke it.
5. Capture run logs and metrics for the realistic load/failure exercise referenced in `external-review-handoff.md`.

## Cutover and rollback

Deploy the worker disabled. Confirm database connectivity, secret scoping, logging, and alarms first; then enable one scheduled invocation under observation. Keep the managed scheduler disabled when an external worker is enabled, because two active schedulers can race on the same retry queue. Roll back by disabling the external schedule, preserving job rows and error history, then investigating before any replay.

## Related records

| Record | Use |
| --- | --- |
| `README.md` | Runtime dependencies, external-hosting boundaries, validation commands, and activation gates |
| `docs/operations/external-review-handoff.md` | Backup/restore, realistic load/failure, and security-review package |
| `docs/operations/external-review-evidence-register.md` | Evidence and reviewer sign-off register |
| `docs/qa/phase-4-guarded-verification.md` | Guarded controls that remain inactive pending review |
