# NEXUS RAG PRD phase-gate alignment

## Decision status

This record aligns the implemented NEXUS RAG platform with the user-supplied **AI Knowledge Base (RAG System) PRD v3**, dated 2026-08-21. The application has a verified implementation checkpoint, **48fc90d6**, but it must not be described as having passed every PRD phase gate. The PRD makes representative-corpus evaluation, database-backed tenant-isolation evidence, realistic-load evidence, and qualified human security review explicit gates rather than implementation details.

> **Operating rule:** NEXUS RAG will not process sensitive multi-tenant knowledge until the unfinished evaluation, isolation, backup/restore, load, and human-review gates below have documented evidence and the responsible owner approves progression.

## Phase-by-phase reconciliation

| PRD phase | Implemented coverage | PRD gate status | Required next evidence |
| --- | --- | --- | --- |
| **Phase 1 — Core RAG loop** | File ingestion, structure-aware chunking, hybrid sparse/vector retrieval with reranking, evidence-gated abstention, grounded generation, and resolvable citations are implemented. A temporary non-sensitive source was indexed, queried successfully with citations, and removed from retrieval. | **Functionally implemented; acceptance gate open.** The temporary single-source QA exercise is not a substitute for the PRD’s golden evaluation on a representative corpus. | User-approved representative documents and a golden set reporting precision@5, recall@10, faithfulness, and unanswerable-case abstention accuracy. |
| **Phase 2 — Multi-source and multi-tenant** | URL, pasted text, binary document, and code-oriented ingestion paths; organizations, collections, roles, grants, invitations, revocation, organization policies, and audit events are implemented. Collection-scoped policy helpers have automated coverage. | **Functionally implemented; isolation gate open.** The current suite verifies grant behavior but does not yet provide the PRD-required two-organization, database-backed retrieval proof through the full query path. | An automated integration test with two organizations and distinct content, asserting zero cross-tenant retrieved chunks for broad and adversarial queries. |
| **Phase 3 — Production hardening** | Durable retry/replay and dead-letter handling, rate limits, release gates, audit trail, route/storage defenses, production dependency hardening, accessibility QA, and authenticated lifecycle checks are complete. The final validation rerun passed type checking, 10 automated tests, production build, and production dependency audit. | **Implementation verification complete; production gate open.** The PRD requires realistic-load results, cost-control evidence, and qualified security sign-off before sensitive multi-tenant use. | Backup/restore rehearsal, representative load and failure exercise, evaluated cost controls, human line-by-line security review, and documented sign-off. |
| **Phase 4 — Polish and expansion** | The existing responsive web workspace and operational views are intentionally limited to the verified build scope. | **Not started by approval.** The PRD lists SSO, third-party connectors, usage analytics, and API access as expansion work. | Explicit user authorization after the preceding phase gates are reviewed and accepted. |

## Completed verification evidence

| Evidence area | Recorded result | Supporting project record |
| --- | --- | --- |
| Grounded retrieval lifecycle | A non-sensitive temporary source reached indexed status, returned a cited grounded answer, and was then disabled from retrieval. | `docs/qa/accessibility-and-responsive-verification.md` |
| Access-management lifecycle | A user-authorized temporary member invitation appeared as pending, was captured in the audit trail, and was revoked; no active invitation remained. | `docs/qa/accessibility-and-responsive-verification.md` |
| Release governance | An attempted release decision was correctly blocked because telemetry baselines remained unmet, and the blocked result was added to the audit trail. | `docs/qa/accessibility-and-responsive-verification.md` |
| Software verification | `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm audit --prod` completed successfully; the test suite contains 10 passing tests across 3 suites and the audit reported no known vulnerabilities. | `docs/qa/hardening-test-report.md` |

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
