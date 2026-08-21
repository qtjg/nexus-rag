# NEXUS RAG Phase 4 expansion plan

## Authorization and boundary

The organization owner authorized **Phase 4 scope planning**, not automatic connection to an identity provider, third-party system, analytics service, or public API. No connector credentials, tenant metadata, customer content, or external side effects are created by this plan. Each implementation increment requires a separate approval after the preceding quality and external-review gates are satisfied.

> **Starting condition:** Phase 4 implementation remains blocked for sensitive-data use until the representative-corpus evaluation, backup/restore rehearsal, load/failure exercise, and qualified human security review have recorded passing evidence. Planning may proceed now; deployment-dependent retry activation remains deferred until publication.

## Product increments

| Increment | User value | Included scope | Explicit non-goals | Approval required before build |
| --- | --- | --- | --- | --- |
| **4A — Enterprise SSO** | Centralized workforce identity and deprovisioning | OIDC/SAML configuration, verified domains, group-to-role mapping, session migration, and break-glass owner path | Automatic IdP discovery, unreviewed group synchronization, SCIM provisioning in the first increment | Named identity provider, tenant metadata, domain owner, role-mapping policy, and security-review sign-off |
| **4B — Governed connectors** | Controlled ingestion from approved systems | One connector at a time, incremental sync, source provenance, per-collection scopes, rate limits, disconnect/delete workflow, audit events | Bulk all-system ingestion, autonomous permission escalation, storing credentials in client code | System owner, connector OAuth/app configuration, data classification, source-retention policy, and vendor review |
| **4C — Usage analytics** | Operational visibility without exposing knowledge content | Organization-scoped aggregate query/ingestion/latency/feedback metrics, retention window, export controls, role-gated dashboards | Raw prompt/content analytics by default, cross-organization analytics, third-party tracking pixels | Metrics owner, retention policy, access policy, and privacy review |
| **4D — API access** | Safe programmatic retrieval and ingestion | Versioned server API, service identities, scoped keys, quotas, idempotency, audit records, OpenAPI contract, key rotation/revocation | Browser-held secret keys, unscoped organization access, arbitrary SQL/query execution, write-by-default permissions | API owner, client threat model, quota policy, incident owner, and security-review sign-off |

## Recommended sequence

1. Complete representative-corpus evaluation and the external evidence register; close material findings before enabling expansion work.
2. Select **one** connector or the SSO provider as the first integration. Do not build SSO and multiple connectors concurrently.
3. Deliver the selected increment behind an organization-level feature flag, with regression coverage and a staging-only pilot.
4. Review access, audit, latency, error, and retention evidence with the accountable owner before expanding to the next increment.
5. Treat API access as the final increment because it introduces a reusable external authorization boundary.

## Architecture decisions

| Concern | Phase 4 decision | Verification evidence |
| --- | --- | --- |
| Organization isolation | Every SSO claim, connector record, analytics aggregation, and API request retains an explicit organization ID and server-side collection scope | Database-backed cross-tenant test extended to each increment |
| Identity mapping | Map a verified IdP subject to a persisted local user; groups map only through an owner-reviewed allowlist | Role-mapping review and break-glass test |
| Connector credentials | Store server-side only through the approved secret-management path; never expose them to the client or source metadata | Configuration review and negative client-access test |
| Connector provenance | Persist connector system, remote object ID, sync time, actor, and collection assignment with each source | Source-to-citation trace review |
| Analytics privacy | Aggregate counts and timings by organization; retain no raw question or source content in analytics by default | Schema/privacy review and role-gated dashboard test |
| API authorization | Use scoped service identities with expiry, rotation, revocation, quotas, and audit events | Key lifecycle, scope rejection, and rate-limit tests |
| Change control | Use feature flags and isolated staging pilots; require rollback procedure before enabling an increment | Approved rollout and rollback record |

## Required decision inputs

| Decision | Owner input needed | Status |
| --- | --- | --- |
| First increment | Choose **4A**, **4B**, **4C**, or **4D** | **Open** |
| Identity provider | Provider type, tenant metadata, verified domain, and group/role mapping | Required for 4A |
| First connector | System, data owner, OAuth/app approval, permitted collections, content classification | Required for 4B |
| Analytics policy | Metrics owner, retention duration, dashboard roles, export rule | Required for 4C |
| API client model | Intended clients, scopes, quota, expiry/rotation, incident owner | Required for 4D |
| Pilot environment | Staging organization, test corpus, acceptance owner, rollback owner | Required for all increments |

## Exit criteria per increment

An increment may progress from pilot only when the owner approves the documented data flow, the qualified security reviewer accepts the threat model, all relevant organization/collection isolation tests pass, negative authorization tests pass, observability dashboards show expected events without raw-content leakage, and a rollback exercise succeeds. No increment may override the external-review register or sensitive-data gate.

## References

[1] User-supplied *AI Knowledge Base (RAG System) PRD v3*, Sections 14, 19, and 21, provided in this task on 2026-08-21.

[2] `docs/architecture/prd-phase-gate-alignment.md` — current phase-gate decisions.

[3] `docs/operations/external-review-evidence-register.md` — required external evidence and approval ledger.
