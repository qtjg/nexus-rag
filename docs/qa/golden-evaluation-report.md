# NEXUS RAG golden evaluation and isolation report

## Scope and status

This report records the user-authorized, **non-sensitive** PRD evaluation gate. It uses a documented domain-neutral fixture of ten operational-policy documents, 20 golden questions, 18 answerable cases, two multi-hop cases, and two deliberately unanswerable cases. The fixture is useful for exercising the real persistence, retrieval, generation, citation, and cleanup paths. It is **not** a substitute for the PRD-required representative production corpus, and its results must not be generalized to a future customer or sensitive-data deployment.

> **Gate outcome:** The evaluation harness and the database-backed isolation proof are complete. The PRD’s retrieval-quality and latency targets did **not** pass on this fixture. NEXUS RAG therefore remains blocked from claiming a passed Phase 1/3 quality gate or receiving sensitive multi-tenant knowledge.

## Evaluation method

The runner creates a temporary organization, owner, collection, ten non-sensitive documents, indexed chunks, and 20 golden questions. Each question traverses the production `askKnowledge` service path, including organization and collection predicates, hybrid ranking, evidence thresholding, LLM generation when sufficient context is found, citation persistence, and response tracing. Answerable cases receive a structured LLM-as-judge faithfulness check against their cited excerpts. Unanswerable cases are checked programmatically for both an insufficient-context result and appropriate abstention wording.

The runner deletes every temporary row in a `finally` block. A post-run database check returned zero organizations with the `nexus-golden-*` test prefix.

## Golden-evaluation results

| Metric | PRD target | Observed result | Gate result |
| --- | --- | --- | --- |
| Answerable cases | 15–20 realistic questions | 18 answerable cases: 16 factual and 2 multi-hop | Coverage achieved for the fixture |
| Precision@5 | ≥85% | **21.1%** | **Fail** |
| Recall@10 | ≥90% | **100.0%** | Pass |
| Faithfulness | ≥90% | **83.3%** | **Fail** |
| Correct abstention | ≥95% of unanswerable cases | **100.0%** across 2 cases | Pass |
| p95 end-to-end query latency | <4,000 ms | **11,783 ms** | **Fail** |
| Faithfulness judge availability | Required to assess answerable cases | 3 of 18 answerable cases did not return parseable judge output and were counted unsupported | Evidence-quality limitation |

The low precision@5 reflects broad candidate selection in the small corpus: the relevant document was consistently retrieved, but several semantically adjacent documents were also returned. The measured recall and abstention behavior are encouraging, but they do not offset failed precision, faithfulness, or latency gates. The ranking change in this work raises the dense-only admission threshold to reduce unrelated hash-vector candidates; the final result is reported after that change, not before it.

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

The next quality iteration must be grounded in a user-approved representative corpus and should diagnose ranking precision, candidate count, cross-encoder or reranker selection, context assembly, response latency, and model-judge reliability. Any changes to retrieval, embedding, chunking, or grounding prompt must re-run this evaluation. The qualified human security review, backup/restore rehearsal, and realistic load/failure exercise remain separate mandatory gates before sensitive multi-tenant data is onboarded.

## References

[1] User-supplied *AI Knowledge Base (RAG System) PRD v3*, Sections 9, 14, 19, and 21, provided in this task on 2026-08-21.

[2] `server/nexus/goldenEvaluation.ts` — executable non-sensitive corpus, golden questions, metrics, structured faithfulness check, and fixture cleanup.

[3] `server/nexus/isolation.integration.test.ts` — database-backed two-organization retrieval-isolation test with automatic teardown.
