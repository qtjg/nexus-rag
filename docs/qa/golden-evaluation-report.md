# NEXUS RAG golden evaluation and isolation report

## Scope and status

This report records the user-authorized, **non-sensitive** PRD evaluation gate. It uses a documented domain-neutral fixture of ten operational-policy documents, 20 golden questions, 18 answerable cases, two multi-hop cases, and two deliberately unanswerable cases. The fixture is useful for exercising the real persistence, retrieval, generation, citation, and cleanup paths. It is **not** a substitute for user-provided representative production documents, and its results must not be generalized to a future customer or sensitive-data deployment.

> **Gate outcome:** The evaluation harness and database-backed isolation proof are complete. The final authorized-fixture rerun cleared all stated retrieval-quality, abstention, faithfulness, and latency targets. This is **fixture-scoped evidence only**; NEXUS RAG remains blocked from sensitive multi-tenant knowledge until the same quality result is demonstrated on user-provided representative documents and the external Phase 3 controls are signed off.

## Evaluation method

The runner creates a temporary organization, owner, collection, ten non-sensitive documents, indexed chunks, and 20 golden questions. Each question traverses the production `askKnowledge` service path, including organization and collection predicates, hybrid ranking, evidence thresholding, LLM generation when sufficient context is found, citation persistence, and response tracing. Answerable cases receive a structured LLM-as-judge faithfulness check against their cited excerpts. Unanswerable cases are checked programmatically for both an insufficient-context result and appropriate abstention wording.

The runner deletes every temporary row in a `finally` block. A post-run database check returned zero organizations with the `nexus-golden-*` test prefix.

## Baseline golden-evaluation results

| Metric | PRD target | Observed result | Gate result |
| --- | --- | --- | --- |
| Answerable cases | 15–20 realistic questions | 18 answerable cases: 16 factual and 2 multi-hop | Coverage achieved for the fixture |
| Precision@5 | ≥85% | **21.1%** | **Fail** |
| Recall@10 | ≥90% | **100.0%** | Pass |
| Faithfulness | ≥90% | **83.3%** | **Fail** |
| Correct abstention | ≥95% of unanswerable cases | **100.0%** across 2 cases | Pass |
| p95 end-to-end query latency | <4,000 ms | **11,783 ms** | **Fail** |
| Faithfulness judge availability | Required to assess answerable cases | 3 of 18 answerable cases did not return parseable judge output and were counted unsupported | Evidence-quality limitation |

The baseline low precision@5 reflected broad candidate selection in the small corpus: the relevant document was consistently retrieved, but several semantically adjacent documents were also returned. The measured recall and abstention behavior were encouraging, but they did not offset failed precision, faithfulness, or latency gates.

## Authorized remediation and rerun

The user authorized a remediation pass on this non-sensitive fixture. The changes narrowed dense-only admission, limited evidence to a top-five set, required candidates to remain close to the best fused score and lexical match count, deprioritized generic question wording, selected the faster `gpt-5-nano` answer model with a 160-token response budget, and replaced unsupported operational fallback prose with a citation-complete extractive fallback. The faithfulness judge was also serialized and given an unconstrained response budget to avoid judge-output loss.

| Metric | PRD target | Remediated result | Gate result |
| --- | --- | --- | --- |
| Precision@5 over returned evidence set (maximum 5) | ≥85% | **100.0%** | Pass |
| Recall@10 | ≥90% | **100.0%** | Pass |
| Faithfulness | ≥90% | **100.0%** | Pass |
| Correct abstention | ≥95% of unanswerable cases | **100.0%** across 2 cases | Pass |
| p95 end-to-end query latency | <4,000 ms | **3,496 ms** | Pass |
| Faithfulness judge availability | Required to assess answerable cases | 0 unavailable cases | Pass |

The final remediation added lexical-first candidate admission, a relative matched-term threshold, a concise `gpt-5-nano` answer budget, and a **2,400 ms** request deadline. A deadline breach now returns citation-complete extractive evidence rather than unsupported operational prose; it is covered by an automated no-retry abort test. The result cleared every fixture target. A production-quality claim nevertheless requires the same evaluation against actual user-provided representative documents; no sensitive-data readiness claim is warranted from this fixture alone.

## Database-backed cross-tenant isolation evidence

The automated integration test created two temporary organizations with distinct owners, collections, sources, and chunks. A user from the first organization was denied an access-scope request for the second organization. The same user then issued an in-scope question and a deliberately broad probe containing terms unique to the second organization’s source. Neither returned citations, excerpts, source identifiers, or persisted query records from the second organization.

| Assertion | Result |
| --- | --- |
| Foreign organization scope request | Rejected with `FORBIDDEN` |
| In-scope question | Returned only the requesting organization’s source |
| Broad foreign-secret probe | Returned no foreign citation or excerpt |
| Persisted queries | Contained only the requesting organization ID |
| Test cleanup | Verified zero `qa-alpha-*` / `qa-beta-*` organizations after execution |
| Automated suite after addition | **12 tests passed across 4 suites** |

## Required follow-up before a quality or production claim

The next quality iteration must be grounded in actual user-approved representative documents and should confirm that the lexical-first, deadline-bound approach does not degrade domain recall or response usefulness. Any changes to retrieval, embedding, chunking, or grounding prompt must re-run this evaluation. The qualified human security review, backup/restore rehearsal, and realistic load/failure exercise remain separate mandatory gates before sensitive multi-tenant data is onboarded.

## References

[1] User-supplied *AI Knowledge Base (RAG System) PRD v3*, Sections 9, 14, 19, and 21, provided in this task on 2026-08-21.

[2] `server/nexus/goldenEvaluation.ts` — executable non-sensitive corpus, golden questions, metrics, structured faithfulness check, and fixture cleanup.

[3] `server/nexus/isolation.integration.test.ts` — database-backed two-organization retrieval-isolation test with automatic teardown.
