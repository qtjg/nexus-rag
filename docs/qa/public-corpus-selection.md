# NEXUS RAG public non-sensitive corpus selection

## Scope

This corpus is a **public, non-sensitive test corpus** authorized by the organization owner because no internal representative documents are currently available. It is isolated from customer and production knowledge, and its result must not be used as an authorization to ingest sensitive data.

| ID | Public source | Intended evidence themes | Usage note |
| --- | --- | --- | --- |
| `PUB-01` | CISA, *Federal Government Cybersecurity Incident and Vulnerability Response Playbooks* [1] | Standardized procedures to identify, coordinate, remediate, recover, and track mitigations | Public government webpage; retrieve factual statements only |
| `PUB-02` | CISA, *#StopRansomware Guide* [2] | Offline encrypted backups, backup integrity testing, golden images, incident/communications plans, vulnerability reduction | Public government webpage; extract only operational guidance needed for evaluation |
| `PUB-03` | CISA, *I've Been Hit By Ransomware!* [3] | Isolation, prioritization of critical systems, clean-network restoration, recovery, lessons learned | Public government webpage; extract only response-checklist evidence |
| `PUB-04` | NIST SP 800-34 Rev. 1, *Contingency Planning Guide for Federal Information Systems* [4] | Contingency planning requirements and priorities, resilience, interrelationships among contingency plans | Public NIST publication landing page; use abstract-level claims until a full public document excerpt is selected |
| `PUB-05` | NIST SP 800-61 Rev. 3, *Incident Response Recommendations and Considerations for Cybersecurity Risk Management* [5] | Risk-management integration, incident preparation, reduced impact, and detection/response/recovery efficiency | Public NIST publication landing page; use abstract-level claims |

The CISA response-playbooks source states that its incident and vulnerability playbooks provide procedures to identify, coordinate, remediate, recover, and track successful mitigations.[1] The ransomware guide recommends offline encrypted critical-data backups and regular availability/integrity testing in a disaster-recovery scenario.[2] The response checklist directs organizations to isolate impacted systems and to reconnect and restore from offline encrypted backups based on prioritization of critical services.[3] NIST SP 800-34 describes guidance for determining contingency-planning requirements and priorities.[4]

## Initial golden-question candidates

| Case | Question | Expected source ID | Expected evidence category |
| --- | --- | --- | --- |
| `PUB-Q01` | What characteristics should backups of critical data have, and what should be tested? | `PUB-02` | Preparation and recovery |
| `PUB-Q02` | What is the first action for systems determined to be impacted by ransomware? | `PUB-03` | Detection and containment |
| `PUB-Q03` | How should recovery restoration be prioritized? | `PUB-03` | Recovery planning |
| `PUB-Q04` | What lifecycle activities do CISA’s response playbooks standardize? | `PUB-01` | Incident and vulnerability response |
| `PUB-Q05` | What does NIST SP 800-34 help personnel determine? | `PUB-04` | Contingency planning |
| `PUB-Q06` | Should an answer claim a specific ransom amount, named victim, or unpublished internal procedure? | None | Deliberately unanswerable / abstention |

## References

[1] [CISA, Federal Government Cybersecurity Incident and Vulnerability Response Playbooks](https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks)

[2] [CISA, #StopRansomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide)

[3] [CISA, I've Been Hit By Ransomware!](https://www.cisa.gov/stopransomware/ive-been-hit-ransomware)

[4] [NIST, SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final)

[5] [NIST, SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://csrc.nist.gov/pubs/sp/800/61/r3/final)
