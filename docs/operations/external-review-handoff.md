# NEXUS RAG external review handoff package

## Decision boundary

This package is the execution handoff for the three controls that cannot be self-certified by application code: an **external backup/restore rehearsal**, a **realistic load and failure exercise**, and a **qualified human security review**. It must be completed before NEXUS RAG accepts sensitive multi-tenant knowledge.

> **Current decision:** Do not onboard sensitive data, rely on a release approval as a rollout authorization, or activate production operations solely on the basis of the automated test suite. The code is checkpointed and the database-isolation evidence is positive, but the external controls below remain owner-verified gates.

## Starting evidence

| Artifact | What the reviewer should inspect | Current status |
| --- | --- | --- |
| `docs/qa/golden-evaluation-report.md` | Non-sensitive retrieval quality, abstention, faithfulness, latency, and isolation evidence | Quality gate **not passed**: precision@5, faithfulness, and p95 latency miss PRD targets |
| `docs/qa/hardening-test-report.md` | Automated regression, build, and dependency-audit evidence | 12 tests across 4 suites, build passed, production audit clean |
| `docs/architecture/prd-phase-gate-alignment.md` | Explicit PRD implementation/gate reconciliation | Phase 2 isolation proof passed for fixture; Phase 1 quality and Phase 3 external gates remain open |
| `docs/operations/production-readiness.md` | Operational controls, incident steps, and scheduled-retry activation rule | Baseline runbook complete; execution evidence outstanding |
| Checkpoint `9375e153` | Exact evaluated code state | Saved and recoverable |

## 1. External backup and restore rehearsal

The platform owner should use the approved organization backup mechanism rather than treating a local sandbox directory as a backup. The rehearsal must occur in an isolated non-production workspace and must use non-sensitive test data or a formally approved sanitized subset.

| Step | Required action | Acceptance evidence |
| --- | --- | --- |
| Inventory | Export source metadata, organization/collection metadata, access controls, policies, audit records, and object-store keys. Record the export timestamp and source system versions. | Immutable inventory manifest with item counts and checksums where supported |
| Backup | Create a protected backup using the approved external backup service. Verify encryption, retention, and access controls with the backup owner. | Backup job ID, access-control evidence, retention configuration |
| Restore | Restore to a distinct non-production organization/workspace. Do not restore over live data. | Restore target identifier, start/end time, recovery time objective result |
| Verify | Compare counts, hashes, source statuses, collection scopes, citations, and a sampled retrieval result with the manifest. | Signed reconciliation checklist with discrepancies and dispositions |
| Clean up | Remove the restored non-production data according to the approved retention rule. | Cleanup confirmation and reviewer sign-off |

| Backup/restore sign-off field | Completion record |
| --- | --- |
| Owner and reviewer | _To be completed_ |
| Backup execution ID | _To be completed_ |
| Restore target | _To be completed_ |
| Recovery time | _To be completed_ |
| Reconciliation outcome | _To be completed_ |
| Date and approval | _To be completed_ |

## 2. Realistic load and failure exercise

The platform owner should execute the exercise against a non-production environment with a production-like configuration and user-approved non-sensitive corpus. The test should report observed values, not estimates.

| Scenario | Procedure | Pass evidence |
| --- | --- | --- |
| Concurrent grounded queries | Execute a defined concurrent query mix against approved collections, including answerable and unanswerable requests. | Request count, success/error rate, p50/p95 latency, citation completeness, and abstention rate |
| Concurrent ingestion | Ingest representative text, PDF, and DOCX samples while queries are active. | Ingestion latency, source state transitions, job counts, no cross-tenant results |
| Model failure | With the approved test mechanism, make generation unavailable after retrieval is available. | Cited-evidence fallback with no unsupported generated answer |
| Retry and dead letter | Trigger a bounded retryable ingestion failure and a terminal failure, then replay the terminal job. | Backoff record, dead-letter record, successful replay/cleanup evidence |
| Rate limit | Exceed the configured organization query limit in a controlled test. | `TOO_MANY_REQUESTS` response and no cross-organization impact |
| Access regression | Repeat the database-backed two-organization probe after deployment. | No foreign source, excerpt, citation, query record, or storage object disclosure |

| Load/failure sign-off field | Completion record |
| --- | --- |
| Environment and corpus version | _To be completed_ |
| Test window and load profile | _To be completed_ |
| Observed p50/p95 and error rate | _To be completed_ |
| Failure-mode evidence | _To be completed_ |
| Open defects and mitigations | _To be completed_ |
| Owner approval | _To be completed_ |

## 3. Qualified human security review

The reviewer should be independent of the implementation author where practicable. This review must include source-code inspection, configuration review, and a controlled authorization test; automated tests are supporting evidence, not a substitute for this review.

| Review area | Minimum questions | Evidence to retain |
| --- | --- | --- |
| Tenant and collection boundaries | Does every retrieval, mutation, citation, feedback, and job query enforce the active organization and authorized collection scope? Can broad queries or IDs cross the boundary? | Review notes, test cases, and evidence of rejected cross-tenant attempts |
| Authentication and authorization | Are owner/admin/member/viewer permissions consistently server-enforced? Are invitation, revocation, and owner protections correct? | Role matrix and reviewed server procedures |
| File and object storage | Are MIME/size/parser limits suitable for the rollout? Are signed URLs scoped and traversal attempts rejected? | Storage policy, code-review notes, and negative-test results |
| Grounding and prompt injection | Is untrusted evidence delimited? Are unsupported answers abstained or marked as unavailable? Are citations resolvable? | Prompt review and adversarial evidence test results |
| Secrets and logging | Are credentials server-only and excluded from client logs, source content, and test artifacts? | Secret-management review and sampled log inspection |
| Retention and incident response | Are retention, retrieval disablement, audit review, access revocation, and recovery actions operationally owned? | Policy mapping and tabletop notes |
| Dependencies and supply chain | Is the dependency audit current and are high-risk upgrade paths tracked? | Audit result and remediation record |

| Security-review sign-off field | Completion record |
| --- | --- |
| Reviewer name, role, and qualification | _To be completed_ |
| Review scope and code checkpoint | `9375e153` plus subsequent approved checkpoints |
| Findings and severity | _To be completed_ |
| Required remediations | _To be completed_ |
| Residual-risk acceptance | _To be completed_ |
| Approval date | _To be completed_ |

## Completion rule

The platform owner may record the external gate as complete only when all three tables contain dated evidence, named accountable reviewers, any material finding has an approved disposition, the retrieval quality gate has separately passed on a representative corpus, and an authorized decision approves progression. The post-publication ingestion-retry worker remains a separate deployment-dependent action.

## References

[1] User-supplied *AI Knowledge Base (RAG System) PRD v3*, Sections 14, 19, and 21, provided in this task on 2026-08-21.

[2] `docs/operations/production-readiness.md` — NEXUS RAG operational pre-rollout controls.

[3] `docs/qa/golden-evaluation-report.md` — NEXUS RAG quality and database-isolation evidence.
