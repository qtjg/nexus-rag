# NEXUS RAG guarded Phase 4 verification

## Scope and decision

The organization owner authorized implementation of the Phase 4 increments in the sequence **4A Enterprise SSO**, **4D service API access**, **4B governed connectors**, and **4C privacy-preserving analytics**. This verification confirms that the increments are implemented as guarded control-plane capabilities. It does **not** authorize external identity enforcement, external connector synchronization, sensitive-data onboarding, or publication-dependent retry activation.

> **Decision:** The Phase 4 code paths are validated for their stated guarded scope. All external connections and production-sensitive activation remain blocked until the separate representative-corpus, backup/restore, load/failure, and qualified security-review evidence is complete.

| Increment | Implemented capability | Deliberately blocked capability | Verification evidence |
| --- | --- | --- | --- |
| **4A — Enterprise SSO** | Per-organization provider draft, domain allowlist, group-to-role map, status, audit event, and manager-only configuration | Provider handshake, user/session enforcement, and SSO-required login policy | Manager persistence, viewer rejection, and enforcement-block test |
| **4D — Service API** | Read-only `POST /api/v1/query`, hashed bearer keys, organization scope, quota, one-time reveal, rotation, revocation, audit records, and metadata-only usage rows | Write scopes, browser-held keys, unscoped access, and API administrative actions | Lifecycle and endpoint tests for success, quota, insufficient scope, revoked keys, and usage evidence |
| **4B — Connectors** | Collection-scoped draft configuration, provider and remote-scope provenance, blocked run record, pause/disconnect/delete controls, and audit events | OAuth/client credentials, provider calls, background sync, and source ingestion from an external provider | Draft, viewer rejection, blocked provenance, disconnect, and deletion-cleanup test |
| **4C — Analytics** | Manager-only 14-day aggregate operation, latency, feedback, ingestion, and API-status metrics | Raw prompt, answer, source excerpt, user-level activity, and cross-organization analytics | Aggregate-only response assertion, prompt non-disclosure assertion, and viewer-rejection test |

## Security and data-handling boundaries

The SSO configuration records only provider type, a non-secret connection reference, verified domains, and group mapping. The service API stores only an irreversible SHA-256 key hash, a short display prefix, lifecycle metadata, and aggregate usage status and latency. Connector drafts persist no provider secret; they create a blocked provenance run until a future separately approved integration. Analytics reads operational metadata and deliberately omits the raw content columns from its result shape.

| Boundary | Enforced behavior |
| --- | --- |
| Organization scope | Every manager mutation and aggregate query starts with membership and organization-scope verification. |
| Collection scope | Connector drafts must reference a collection in the current organization; future synced sources retain connector and remote-object provenance fields. |
| Key scope | The versioned API admits only `query:read` keys and rejects keys without that scope. |
| Quota | The API counts usage per key in a one-minute window before query execution. |
| Lifecycle | Rotating a key immediately revokes the prior key; deleting a connector removes only its blocked run metadata and refuses deletion where source provenance remains. |
| Analytics privacy | The analytics operation selects timestamps, booleans, numeric latency, statuses, and counts—not questions, answers, source text, or excerpts. |

## Final validation evidence

| Validation | Result |
| --- | --- |
| Type check | `pnpm check` passed |
| Automated tests | **19 tests passed across 10 suites** |
| Production build | `pnpm build` passed; Vite emitted only its advisory large-chunk warning |
| Production dependency audit | `pnpm audit --prod` reported no known vulnerabilities |
| Phase 4 database coverage | SSO, API keys, endpoint, connectors, analytics, and prior tenant-isolation integration suites passed with cleanup |

## Activation prerequisites

| Capability | Required action before activation |
| --- | --- |
| SSO enforcement | Select an identity provider, configure provider credentials server-side, validate a staging login/mapping flow, complete qualified security review, and receive owner approval. |
| Service API clients | Review the client threat model, use a service-side secret store, define rotation/incident ownership, and pilot with a non-sensitive collection. |
| External connector sync | Obtain system-owner approval, configure provider OAuth/credentials through the approved secret path, complete vendor/data-classification review, and exercise disconnect/delete retention behavior. |
| Analytics expansion | Approve retention, export, and dashboard-role policies before adding any new metric dimension. |
| Sensitive data | Complete the representative-corpus evaluation and all entries in the external-review evidence register. |

## References

[1] User-supplied *AI Knowledge Base (RAG System) PRD v3*, Sections 14, 19, and 21, provided in this task on 2026-08-21.

[2] `docs/architecture/phase-4-expansion-plan.md` — approved scope, non-goals, dependencies, and gated activation decisions.

[3] `docs/operations/external-review-evidence-register.md` — open external evidence and approval ledger.
