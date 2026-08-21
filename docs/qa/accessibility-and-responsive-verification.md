# Accessibility and responsive verification

## Scope and evidence

The authenticated workspace response returned successfully for the current organization, including policy, collections, sources, members, audit events, and release-gate data. The following responsive captures were reviewed after the latest application restart:

| Surface | Desktop | Mobile | Result |
| --- | --- | --- | --- |
| Grounded chat workspace | 1280 × 720 | 375 × 812 | The navigation collapses to a compact header; the composer and evidence trace retain readable hierarchy. |
| Source library | — | 375 × 812 | Source-intake call to action, status cards, search field, and loading state fit within the viewport. |
| Control plane | — | 375 × 812 | Compact-header behavior and policy loading state remain readable without horizontal overflow. |

## Accessibility review

The workspace uses semantic buttons for actions, focus-visible styles on navigation controls, descriptive button labels, appropriately typed email and numeric inputs, and visible status copy for empty and loading states. Policy switches and numeric controls now carry explicit accessible names. The source search has an explicit accessible label, the navigation toggle has an accessible label, and destructive operations require a confirmation prompt.

## Manual follow-up

Before a public or sensitive-data launch, a human tester should complete a browser-assisted keyboard-only pass using the organization’s actual data. The pass should cover authentication, dialogs, invitation creation/revocation, grant updates, source upload and retry, grounded-chat submission, feedback, and release decisions. Assistive-technology testing and formal WCAG conformance review remain outside this automated implementation verification.

## Authenticated end-to-end verification

With the user’s explicit authorization, a temporary non-sensitive source named **NEXUS QA Grounding Verification** was added to the General knowledge collection. The source reached **indexed** status. A scoped question asking which review is required before release returned the supported answer, **“A documented security review is required before a release may proceed. [1]”**, together with two resolvable evidence excerpts. The evidence trace reported one collection in scope, two candidates, a passed evidence gate, and two resolved citations.

The temporary source was then removed using the source-library action. The library updated its indexed count to zero and marked the source **retrieval disabled**, confirming that removed evidence is no longer eligible for retrieval.
