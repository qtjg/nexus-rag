# NEXUS RAG PRD phase-gate alignment

## Decision status

This record aligns the implemented NEXUS RAG platform with the user-supplied **AI Knowledge Base (RAG System) PRD v3**, dated 2026-08-21. The current guarded implementation checkpoint is **6a2db833**, and a public-corpus evaluation update is pending checkpoint. The platform must not be described as having passed every PRD phase gate: the PRD makes representative-corpus evaluation, database-backed tenant-isolation evidence, realistic-load evidence, and qualified human security review explicit gates rather than implementation details.

> **Operating rule:** NEXUS RAG will not process sensitive multi-tenant knowledge until the unfinished evaluation, isolation, backup/restore, load, and human-review gates below have documented evidence and the responsible owner approves progression.

## Phase-by-phase reconciliation

| PRD phase | Implemented coverage | PRD gate status | Required next evidence |
| --- | --- | --- | --- |
| **Phase 1 — Core RAG loop** | File ingestion, structure-aware chunking, hybrid sparse/vector retrieval with reranking, evidence-gated abstention, grounded generation, and resolvable citations are implemented. The user-authorized public CISA/NIST corpus evaluation reached 88.5% precision@5, 90.6% recall@10, 93.8% faithfulness, 100.0% abstention accuracy, and 3,551 ms p95 latency. | **Public-corpus quality gate passed.** This evidence is limited to a public non-sensitive corpus and does not authorize sensitive-data ingestion. | Repeat the same evaluation on owner-approved internal representative documents before relying on quality for a future internal rollout. |
| **Phase 2 — Multi-source and multi-tenant** | URL, pasted text, binary document, and code-oriented ingestion paths; organizations, collections, roles, grants, invitations, revocation, organization policies, and audit events are implemented. A database-backed two-organization test now exercises the actual grounded-query path and tears down all QA rows. | **Isolation proof passed for the authorized test fixture.** The suite rejects a foreign scope request and confirms broad cross-tenant probes return no foreign source, excerpt, citation, or persisted query. | Re-run the isolation proof on every deployment and include it in the qualified human security review. |
| **Phase 3 — Production hardening** | Durable retry/replay and dead-letter handling, rate limits, release gates, audit trail, route/storage defenses, production dependency hardening, accessibility QA, and authenticated lifecycle checks are complete. The final validation rerun passed type checking, 19 automated tests, production build, and production dependency audit. | **Implementation verification complete; production gate open.** The PRD requires realistic-load results, cost-control evidence, and qualified security sign-off before sensitive multi-tenant use. | Backup/restore rehearsal, representative load and failure exercise, evaluated cost controls, human line-by-line security review, and documented sign-off. |
| **Phase 4 — Polish and expansion** | Guarded Enterprise SSO readiness, scoped read-only service API keys, governed connector drafts/provenance, and aggregate-only analytics are implemented. | **Guarded implementation complete; external activation blocked.** No IdP enforcement, provider synchronization, sensitive analytics expansion, or production client key is activated. | Complete Phase 4 security/external review, select provider/client inputs, and approve a staging pilot for each activation. |

## Completed verification evidence

| Evidence area | Recorded result | Supporting project record |
| --- | --- | --- |
| Grounded retrieval lifecycle | A non-sensitive temporary source reached indexed status, returned a cited grounded answer, and was then disabled from retrieval. | `docs/qa/accessibility-and-responsive-verification.md` |
| Access-management lifecycle | A user-authorized temporary member invitation appeared as pending, was captured in the audit trail, and was revoked; no active invitation remained. | `docs/qa/accessibility-and-responsive-verification.md` |
| Release governance | An attempted release decision was correctly blocked because telemetry baselines remained unmet, and the blocked result was added to the audit trail. | `docs/qa/accessibility-and-responsive-verification.md` |
| Software verification | `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm audit --prod` completed successfully; the test suite contains 19 passing tests across 10 suites and the audit reported no known vulnerabilities. | `docs/qa/hardening-test-report.md` |
| Golden evaluation and isolation | The user-authorized public CISA/NIST corpus passed all aggregate quality targets and cleaned up every temporary evaluation organization; the database-backed two-organization isolation suite passed and cleaned up its QA rows. | `docs/qa/public-corpus-evaluation-report.md` |
| Guarded Phase 4 | SSO, service API, connector, and analytics increments have database-backed guarded verification, with external activation deliberately blocked. | `docs/qa/phase-4-guarded-verification.md` |

## Deployment and scheduled-retry gate

The retry worker is intentionally **not active** in preview. The control plane shows **Publish required**, consistent with the production-readiness runbook. After the project owner publishes the site, an organization owner can select **Enable retry** to create the platform-managed job that invokes the bounded, cron-authenticated ingestion-retry callback every five minutes. The worker must be verified after activation; it must not be created while the site remains unpublished.

## Explicit approvals required

The following actions require an explicit owner decision and must not be inferred from the presence of this document.

| Decision | Owner action |
| --- | --- |
| Activate scheduled ingestion recovery | Publish the site, then authorize the control-plane **Enable retry** action. |
| Run PRD golden evaluation | Supply or approve a representative, non-sensitive corpus and authorize its ingestion for evaluation. |
| Verify cross-tenant isolation against actual persistence | Authorize creation of isolated test organizations and test data in the configured environment. |
| Proceed with sensitive organizational knowledge | Provide completion evidence for backup/restore, load/failure exercise, and qualified human security review; then approve the rollout decision. |
| Begin Phase 4 expansion | Explicitly approve SSO, connectors, usage analytics, and API-access scope after review of preceding gates. |

## References

[1] User-supplied *AI Knowledge Base (RAG System) PRD v3*, Sections 9, 14, 19, 21, and 22, provided in this task on 2026-08-21.

[2] `docs/operations/production-readiness.md` — NEXUS RAG pre-sensitive-data rollout runbook.

[3] `docs/qa/hardening-test-report.md` — NEXUS RAG validation and hardening evidence.
