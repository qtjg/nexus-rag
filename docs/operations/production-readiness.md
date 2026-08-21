# NEXUS RAG production-readiness runbook

## Purpose

This runbook is the operational gate for enabling NEXUS RAG with sensitive organizational knowledge. A green internal release decision in the product is not, by itself, authorization to process regulated, confidential, or production-critical content.

## Required pre-rollout controls

| Control | Required evidence | Owner |
| --- | --- | --- |
| Backup and restore | A documented export of source metadata and object-store inventory; a restore rehearsal in a non-production workspace with a recorded recovery time. | Platform owner |
| Access review | Review all organization roles, collection grants, pending invitations, and the audit trail. Revoke unused access. | Organization owner |
| Retrieval evaluation | At least 10 representative queries, five feedback events, and every release gate passing in the Evaluation lab. | Knowledge owner |
| Security review | Human review of tenant predicates, file parsing limits, retention rules, object-storage access, injection resistance, and incident response. | Security reviewer |
| Load and failure exercise | Test concurrent query and ingestion behavior, retry recovery, dead-letter replay, model failure abstention, and rate limiting. | Platform owner |
| Monitoring | Confirm query latency, evidence coverage, abstention rate, ingestion failures, and audit events are visible to the responsible owner. | Operations owner |

## Scheduled ingestion recovery

After publishing the site, an organization owner must select **Enable retry** in **Control plane**. The action creates a platform-managed job that invokes `/api/scheduled/ingestion-retry` every five minutes. The callback accepts cron-authenticated requests only and processes a bounded set of due retry records. It is safe to re-run because ingestion records and chunks are versioned and replayed idempotently.

## Incident handling

1. Disable retrieval for the affected source from the source library.
2. Revoke suspicious member access or pending invitations from the control plane.
3. Review the audit trail, source job state, and release-gate status.
4. Record the corrective action in the organization’s incident process outside the application.
5. Re-enable source ingestion or release approval only after validation.

## Explicit limitations

The application contains a local hybrid retrieval implementation and durable operational metadata. It does not substitute for a managed vector database, enterprise SIEM, external backup service, penetration test, regulatory assessment, or a qualified human security review. Those controls remain mandatory before sensitive production rollout.
