## Summary

Describe the user-visible, operational, and security impact of this change.

## Validation

- [ ] `pnpm check`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] `pnpm audit --prod`
- [ ] Relevant documentation and migration notes are updated

## Risk and scope

- [ ] This change preserves organization scoping and authorization boundaries
- [ ] This change does not add secrets, customer data, or provider credentials to the repository
- [ ] This change does not activate external hosting, Cloud Run, a scheduler, SSO enforcement, connector synchronization, or production API clients
- [ ] If retrieval, ingestion, governance, or security behavior changes, focused regression coverage is included

## Deferred operational actions

List any follow-up that requires accountable-owner approval, an external review, a migration plan, or a separate deployment decision.
