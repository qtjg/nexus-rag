# NEXUS RAG external review evidence register

## Use of this register

This register records **observed external evidence**, not planned work. It must be completed by the accountable platform owner and qualified reviewer in a non-production environment before sensitive-data rollout. Empty fields are evidence that the gate is still open, not evidence of completion.

## Gate summary

| Gate | Accountable owner | Current status | Completion condition |
| --- | --- | --- | --- |
| Backup and restore rehearsal | Platform owner | **Open** | Protected backup, isolated restore, reconciliation, cleanup, and owner sign-off recorded |
| Realistic load and failure exercise | Platform owner | **Open** | Observed load/failure results, defect disposition, and owner sign-off recorded |
| Qualified human security review | Security reviewer | **Open** | Named qualified reviewer, findings disposition, residual-risk decision, and sign-off recorded |

## A. Backup and restore evidence

| Evidence field | Record |
| --- | --- |
| Rehearsal identifier | _To be completed_ |
| Backup service and configuration reference | _To be completed_ |
| Source environment | _To be completed_ |
| Isolated restore target | _To be completed_ |
| Corpus classification and approval | _To be completed_ |
| Manifest timestamp, item count, and integrity check | _To be completed_ |
| Backup execution ID and retention control | _To be completed_ |
| Restore start/end time and measured recovery time | _To be completed_ |
| Metadata/source/citation/access reconciliation outcome | _To be completed_ |
| Cleanup confirmation | _To be completed_ |
| Platform owner name and date | _To be completed_ |
| Independent reviewer name and date | _To be completed_ |

## B. Realistic load and failure evidence

| Evidence field | Record |
| --- | --- |
| Exercise identifier and environment | _To be completed_ |
| Corpus version and pipeline fingerprint | _To be completed_ |
| Concurrent query profile and duration | _To be completed_ |
| Concurrent ingestion profile and document types | _To be completed_ |
| Observed requests, success/error rates, p50, p95 | _To be completed_ |
| Citation completeness and abstention result | _To be completed_ |
| Model-timeout and cited-fallback result | _To be completed_ |
| Retry, dead-letter, and replay result | _To be completed_ |
| Rate-limit result | _To be completed_ |
| Post-deployment tenant-isolation retest result | _To be completed_ |
| Defects, severity, and approved disposition | _To be completed_ |
| Platform owner approval and date | _To be completed_ |

## C. Qualified human security-review evidence

| Evidence field | Record |
| --- | --- |
| Reviewer name, role, employer, and qualification | _To be completed_ |
| Code checkpoint and deployment configuration reviewed | _To be completed_ |
| Review date and method | _To be completed_ |
| Organization and collection isolation finding | _To be completed_ |
| Role/invitation/revocation finding | _To be completed_ |
| Source parsing and storage-access finding | _To be completed_ |
| Prompt-injection and grounding finding | _To be completed_ |
| Secret, logging, and dependency finding | _To be completed_ |
| Retention and incident-response finding | _To be completed_ |
| Findings by severity and remediation owner | _To be completed_ |
| Residual risk accepted by | _To be completed_ |
| Reviewer decision and date | _To be completed_ |

## Approval ledger

| Decision | Prerequisites | Authorizer | Status | Evidence reference |
| --- | --- | --- | --- | --- |
| Use representative corpus for evaluation | Completed intake and classification confirmation | Organization owner | **Open** | `docs/qa/representative-corpus-intake.md` |
| Enable sensitive-data onboarding | Representative-corpus gate plus all three external gates | Organization owner and security reviewer | **Blocked** | This register |
| Enable post-publication retry worker | Published application and organization owner action | Organization owner | **Deferred** | Control plane |
| Begin a Phase 4 implementation increment | Phase 4 scope decision and dependency approval | Organization owner | **Open** | `docs/architecture/phase-4-expansion-plan.md` |

## References

[1] `docs/operations/external-review-handoff.md` — required procedures and acceptance evidence.

[2] `docs/operations/production-readiness.md` — NEXUS RAG pre-sensitive-data rollout controls.
