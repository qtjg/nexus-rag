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

## Route-level accessibility verification

After the hardening restoration, the authenticated chat route was rechecked. The application exposes named sidebar navigation controls, a named **Add source** action, named suggested-question buttons, and a composer with the accessible name **Ask a grounded knowledge question**. Keyboard navigation enters the rendered control sequence, and loading/retrieval areas now announce status through polite live regions. The source library and control plane received explicit accessible names for source inputs, collection selection, file selection, source deletion/replay actions, invitation fields, policy switches, member role selectors, grant toggles, and revoke actions.

The authenticated source library was also rechecked after its data request completed. It exposes the named **Search sources** input and a named source-removal control. The prior temporary QA source remains in a **retrieval disabled** state, so it is visible as an auditable record but cannot influence future answers.

The authenticated collections route completed its scope request and exposes named **New collection**, **Configure access**, and **Create an isolated collection** controls alongside the default collection state. Its loading state resolves to the scoped collection card without a client error.

The authenticated evaluation route exposes named **Create evaluation set** and **Record release decision** actions. The release gate view correctly keeps the release decision in a **Baseline required** state when the workspace has only one traced request and insufficient evidence/feedback baselines, while access-policy and ingestion-reliability gates remain visible as independently evaluated states.

The authenticated control plane completed its loading state with named invitation, URL-policy switch, safety-policy switch, query-budget input, retention input, and retry-enable controls. The retry surface accurately reports **Publish required** in preview mode rather than incorrectly presenting an active worker.

The source intake dialog was opened without creating data. Its source-type controls, source-name input, collection selector, content field, submit action, and close control all expose accessible names. Submitting the intentionally empty form produced the visible **A source name is required** validation message and kept the dialog open, confirming that client-side validation prevents accidental ingestion.

The same source dialog was dismissed successfully with the **Escape** key. Focus returned to the source-library surface, and the validation message remained available as a non-blocking toast, confirming standard keyboard dialog-dismissal behavior without creating or changing source data.

The create-collection dialog was opened without persisting a collection. Its name field received initial focus, the close control was present, and the **Create collection** action remained disabled until a valid name is supplied. This confirms the empty-state interaction is guarded before a collection mutation can occur.

The collection dialog also dismissed with **Escape**, returning to the collections surface without mutation. In the evaluation lab, the named **Record release decision** control transitioned to a visible **Checking…** in-progress state, showing that release review performs an explicit gate check rather than approving immediately.

That evaluation check correctly completed with the visible **Release approval blocked** message because evidence-coverage and feedback baselines remain unmet. The evaluation workflow recorded a blocked decision in the audit trail rather than permitting an unqualified approval. The control plane then rendered its named **Invite member** action, policy switches, numeric controls, and **Enable retry** action; the retry control accurately remains marked **Publish required** in preview mode.

The member-invitation dialog opened without sending an invitation. Its email field received initial focus, role buttons, collection-grant checkbox, and close control all carried accessible names, and the dialog dismissed with **Escape** while preserving the members and invitations state. This confirms the standard keyboard route does not accidentally create an invitation.

With the user’s explicit authorization, a temporary member invitation was created for a user-controlled test inbox with the **Member** role and the General knowledge collection grant. The control plane immediately showed one pending invitation and an **Invitation recorded** status, while the audit trail recorded the invitation event. The invitation was then revoked through the named revoke control. The pending-invitation count returned to zero, the temporary row disappeared, an **Invitation revoked** status appeared, and the audit trail retained both the creation and revocation events. This completed the authenticated access-management lifecycle without leaving an active invitation.
