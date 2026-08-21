# NEXUS RAG representative-corpus evaluation intake

## Purpose and boundary

This intake turns the fixture-level quality result into a reproducible evaluation against **owner-provided representative documents**. It is designed for a non-production environment and does not authorize sensitive-data onboarding. The uploaded corpus must be approved by the organization owner and must exclude secrets, personal data, regulated content, credentials, production tokens, and documents without a lawful test-use basis.

> **Submission rule:** Provide document files only through the approved task upload channel. Do not paste credentials or protected production data into chat, source code, logs, test cases, or this manifest.

## Requested corpus

The owner should supply **5–10 non-sensitive documents** that resemble the expected content mix. At least one document should include headings and at least one should be a PDF or DOCX if those formats are expected in the intended rollout. Use neutral filenames and a documented corpus version.

| Intake field | Owner-provided value |
| --- | --- |
| Corpus version and date | _To be completed_ |
| Approval owner | _To be completed_ |
| Test environment | _To be completed_ |
| Data classification confirmation | _To be completed_ |
| Expected document types | _To be completed_ |
| Expected retrieval users/roles | _To be completed_ |
| Required retention and cleanup date | _To be completed_ |

| Document ID | Neutral filename | Type | Classification approved | Expected collection | Notes on layout/chunking risk |
| --- | --- | --- | --- | --- | --- |
| `DOC-01` | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ |
| `DOC-02` | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ |
| `DOC-03` | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ |
| `DOC-04` | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ |
| `DOC-05` | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ | _To be completed_ |

## Golden question set

Create **15–20 adjudicated questions** after the documents are selected: 12–16 factual questions, 2–4 multi-document questions where the source set supports them, and 2–3 deliberately unanswerable questions. A knowledge owner must identify the expected source IDs and concise supported answer before the evaluation runner is executed.

| Case ID | Question | Category | Expected document IDs | Expected supported answer | Owner adjudication |
| --- | --- | --- | --- | --- | --- |
| `Q-01` | _To be completed_ | Factual | _To be completed_ | _To be completed_ | _To be completed_ |
| `Q-02` | _To be completed_ | Factual | _To be completed_ | _To be completed_ | _To be completed_ |
| `Q-03` | _To be completed_ | Multi-document | _To be completed_ | _To be completed_ | _To be completed_ |
| `Q-04` | _To be completed_ | Unanswerable | None | Explicit abstention required | _To be completed_ |

## Execution procedure

| Step | Responsible owner | Required evidence |
| --- | --- | --- |
| Approve corpus | Organization owner | Completed intake fields and classification confirmation |
| Ingest to isolated evaluation workspace | Platform owner | Source IDs, job statuses, and cleanup deadline |
| Freeze golden labels | Knowledge owner | Dated question/source/answer manifest |
| Run evaluation | Platform owner | Precision@5, recall@10, faithfulness, abstention, p50/p95 latency, corpus/pipeline version |
| Review failure cases | Knowledge owner and platform owner | Root-cause dispositions; no metric-only approval |
| Clean up | Platform owner | Retrieval disabled, test sources removed, storage cleanup confirmation |
| Approve or block | Organization owner | Signed decision linked to results |

## Acceptance rule

The representative-corpus quality gate passes only if the recorded result meets the PRD targets: precision@5 ≥85%, recall@10 ≥90%, faithfulness ≥90%, correct abstention ≥95% on unanswerable cases, and p95 end-to-end query latency below 4,000 ms. A result must be reviewed for sampling bias and individual failure modes; satisfying aggregate metrics does not override a known tenant, security, or harmful-answer concern.

## References

[1] User-supplied *AI Knowledge Base (RAG System) PRD v3*, Sections 9, 19, and 21, provided in this task on 2026-08-21.

[2] `docs/qa/golden-evaluation-report.md` — NEXUS RAG non-sensitive fixture evaluation and quality methodology.
