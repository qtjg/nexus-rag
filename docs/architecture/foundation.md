# NEXUS RAG foundation architecture

## Delivery boundary

NEXUS RAG is being implemented as a full-stack, authenticated knowledge workspace. This build prioritizes the PRD's safety order: authorization, evidence integrity, reliable ingestion state, and observability before advanced retrieval optimizations. The current application establishes the Phase 0 foundation and a functional Phase 1/2 vertical slice: organization-scoped collections and sources, structure-aware text chunking, scoped evidence retrieval, grounded response generation, citations, feedback, member controls, and operational views.

| Concern | Implementation decision |
| --- | --- |
| Application stack | React 19 client, Express/tRPC server, Drizzle with MySQL, and Manus OAuth already supplied by the project scaffold. |
| Canonical data | Organization-scoped relational metadata and source text/chunks. File bytes are stored separately in object storage when an upload path is enabled. |
| Access boundary | Every tenant-owned entity carries `orgId`. Retrieval and mutation helpers require an authorized organization scope before their database predicates are constructed. |
| Retrieval boundary | Candidate chunks are selected only from the authorized organization and optional allowed collection IDs. The first implementation uses inspectable lexical relevance and exposes a provider seam for dense embeddings, RRF, and reranking. |
| Evidence boundary | Results are deduplicated and diversity-capped by source. A relevance threshold produces an abstention rather than calling the answer model without adequate evidence. |
| Generation boundary | The model receives only delimited, retrieved evidence and instructions that source material is untrusted data. The user-facing answer is accompanied by resolvable citation records. |
| Provider boundary | Generation is isolated behind a server-side helper using the current `gpt-5-mini` catalog entry; no credentials or direct model calls exist in the client. |
| Ingestion boundary | Sources have explicit state transitions: queued, parsing, chunking, embedding, indexed, failed, and retrieval-disabled. Text and Markdown sources are processed synchronously for the vertical slice; parser and queue adapters are kept distinct from route handlers for later PDF, DOCX, OCR, crawl, and replay workers. |
| Observability | Queries retain a trace ID, retrieval counts, evidence score, latency, pipeline fingerprint, and lightweight stage data without raw source text in general logs. |

## Security invariants

The implementation must fail closed whenever membership, collection access, source status, or source scope is ambiguous. No client-provided organization ID is sufficient by itself. Conversation history is presentation context, not evidence, and every query independently evaluates its access scope and retrieves evidence again. Ingested content is delimited as untrusted data and cannot grant instructions, tool access, or elevated privileges.

## Milestone sequence

| Milestone | Exit evidence |
| --- | --- |
| Foundation and core workspace | Typed schema, organization scope, policy helper, navigation, source and chat surfaces, core tests. |
| RAG loop | Supported text/Markdown ingestion, deterministic chunk records, scoped retrieval, abstention, cited generated answer, and evaluation fixtures. |
| Multi-tenant security fabric | Organization memberships, collection grants, query-level filtering, source deletion state, and cross-tenant regression tests. |
| Production hardening | Asynchronous parsing workers, S3 upload processing, vector/sparse retrieval adapters, rate limits, tracing, replay/DLQ, monitoring, evaluation gates, and human security review. |

## Known implementation gate

This repository must not be represented as safe for sensitive production data until a qualified human has reviewed its access-policy predicates, prompt safety, deletion behavior, provider configuration, and infrastructure controls. Advanced PDF/DOCX/OCR/crawl workers, managed queue durability, pgvector, disaster recovery, and load-tested provider fallback remain explicit expansion gates rather than UI-only claims.
