# NEXUS RAG public non-sensitive corpus evaluation report

## Scope and decision

The organization owner selected a public corpus because no internal representative documents were available. The evaluation used five clearly identified public CISA and NIST incident-response and contingency-planning sources, condensed to evaluation excerpts with source URLs retained. It exercised the same isolated organization, source, chunk, retrieval, generation, citation, structured faithfulness, and cleanup workflow used by the non-sensitive fixture.

> **Decision:** This public-corpus quality evaluation passed the stated aggregate targets. It is evidence of the implemented pipeline on a public operational corpus; it is **not** permission to ingest sensitive customer knowledge or a substitute for a future owner-approved internal corpus.

## Corpus and questions

| Element | Count | Notes |
| --- | ---: | --- |
| Public documents | 5 | CISA incident-response, ransomware-preparation, and ransomware-response guidance; NIST contingency-planning and incident-response guidance |
| Answerable golden cases | 16 | Fourteen factual and two multi-document cases with pre-written expected source IDs and summaries |
| Deliberately unanswerable cases | 4 | Domain-disjoint questions with no evidence in the public corpus |
| Sensitive or customer documents | 0 | No internal, customer, credential, personal, or production content was added |
| Temporary evaluation organizations after cleanup | 0 | Verified with a database count for `nexus-golden-*` slugs |

The underlying source set is documented in `docs/qa/public-corpus-selection.md`. CISA’s playbooks describe standard procedures to identify, coordinate, remediate, recover, and track successful mitigation. The ransomware guide calls for offline encrypted backups and regular testing, while CISA’s response checklist addresses immediate isolation and prioritized recovery. NIST SP 800-34 discusses contingency-planning requirements and priorities, and NIST SP 800-61 Rev. 3 frames incident response across risk-management activities.[1] [2] [3] [4] [5]

## Final results

| Metric | PRD target | Observed result | Result |
| --- | ---: | ---: | --- |
| Precision@5 | ≥85% | **88.5%** | Pass |
| Recall@10 | ≥90% | **90.6%** | Pass |
| Faithfulness | ≥90% | **93.8%** | Pass |
| Correct abstention | ≥95% | **100.0%** | Pass |
| p95 end-to-end query latency | <4,000 ms | **3,551 ms** | Pass |
| Faithfulness judge unavailable cases | 0 preferred | **0** | Pass |

The first public-corpus run identified one topical false-positive abstention case. Investigation showed that sparse matching accepted a short query token as a substring of unrelated document words. Retrieval now compares normalized tokens exactly, rather than accepting substring matches. The full rerun passed all four abstention cases and retained the other target results. The existing retrieval regression suite passed after this change.

## Cleanup and limitations

The evaluator’s `finally` block removed the temporary organization, source records, chunks, queries, citations, and related records. A post-run query returned **zero** remaining `nexus-golden-*` organizations. The corpus content remained only in version-controlled test definitions and QA documentation; it was not added to the user’s source library.

The result does not replace the open backup/restore rehearsal, realistic load/failure exercise, qualified human security review, or Phase 4 production-activation review. It also cannot establish that retrieval quality will generalize to an unknown future internal corpus. Those gates remain explicitly open.

## References

[1] [CISA, Federal Government Cybersecurity Incident and Vulnerability Response Playbooks](https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks)

[2] [CISA, #StopRansomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide)

[3] [CISA, I've Been Hit By Ransomware!](https://www.cisa.gov/stopransomware/ive-been-hit-ransomware)

[4] [NIST, SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final)

[5] [NIST, SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
