# NEXUS RAG hardening test report

## Scope

This report records the rigorous test and debugging cycle performed after the authenticated source-to-citation workflow. The checks cover the development runtime, the production build, authorization boundaries, route handling, dependency security, and regression tests.

| Area | Verification | Result |
| --- | --- | --- |
| Static analysis | TypeScript check after each server and dependency change | Passed |
| Unit and route tests | Retrieval, logout, scheduler-authentication, missing-key, traversal-key, and database-backed tenant-isolation suites | **12 tests passed** across 4 suites |
| Production build | Vite client and bundled Express server builds | Passed |
| Dependency audit | `pnpm audit --prod --audit-level=high` | **No known vulnerabilities** |
| Anonymous workspace request | `nexus.workspace` request without a session | Rejected with **401** |
| Scheduler boundary | Ingestion retry callback without a cron session | Rejected with **403** |
| Storage boundary | Encoded traversal-shaped storage key | Rejected with **400** |
| API boundary | Unknown `/api` route | Returns JSON **404**, not a client fallback |
| SPA navigation | Unknown non-API route | Returns HTML **200** for client routing |

## Final validation rerun

Following the completed authenticated access-control lifecycle test, database-backed isolation proof, and non-sensitive golden-evaluation work, the final validation command sequence completed successfully: `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm audit --prod`. The test run passed all **12 tests across 4 suites**. The production client and server bundle built successfully, and the production dependency audit again reported **No known vulnerabilities**. Vite emitted only its advisory large-chunk notice for the production JavaScript bundle; it did not fail the build.

## Defects found and resolved

| Finding | Resolution | Regression evidence |
| --- | --- | --- |
| Production dependency audit findings | Upgraded the AWS SDK, Axios, Drizzle ORM, nanoid, tRPC, Express, and Recharts; removed Streamdown. | The final production audit reports no known vulnerabilities. |
| Express 5 wildcard incompatibility | Replaced legacy wildcard routes with named Express 5 splats. | SPA fallback works while the API namespace remains isolated. |
| Scheduler converted authentication failures to 500 responses | Preserved `HttpError` status codes in the scheduler route. | Missing cron authentication returns 403. |
| Empty storage path fell through to the client router | Added an explicit storage-base response. | Missing keys receive 400. |
| Traversal-shaped storage keys reached the signing flow | Added segment, backslash, and NUL checks before any signing request. | Encoded traversal receives 400. |
| Unknown API routes rendered the SPA | Added API-specific 404 middleware before the client fallback. | Unknown API routes receive 404. |
| Chart update type mismatch | Updated the reusable chart helper for Recharts v3’s public type contract. | Type check and production build pass. |
| Unrelated hash-vector candidates weakened abstention on the non-sensitive golden fixture | Raised the dense-only candidate admission floor; sparse matches remain eligible and unanswerable cases are now rejected by the evidence gate. | Two deliberately unanswerable cases achieved correct abstention; the retrieval suite includes a dense-only collision regression test. |

## Remaining release gates

The codebase is build- and audit-clean. It should not be treated as ready for sensitive-data rollout until the external backup/restore rehearsal, realistic load test, and qualified human security review in `docs/operations/production-readiness.md` have been completed. The platform-managed ingestion retry worker remains deployment-gated and should be enabled from the control plane only after the latest checkpoint is published.
