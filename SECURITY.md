# Security policy

## Reporting a vulnerability

Please do **not** place vulnerability details, production endpoints, customer data, access tokens, database URLs, private keys, or reproduction credentials in a public issue, pull request, commit, or test fixture.

For this private repository, use GitHub’s private security advisory or private vulnerability-reporting flow when it is available. If that channel is unavailable, contact the repository owner through GitHub and share only the minimum information needed to establish a secure reporting channel before sending technical details.

## What to include after a private channel is established

Provide a concise summary, affected component or commit, impact assessment, safe reproduction steps, and any mitigation already applied. State explicitly whether the report involves tenant isolation, authorization, source-document access, ingestion, object storage, service API keys, scheduled work, or an external integration.

## Response boundary

NEXUS RAG is delivered here as a source package. Repository triage and a local fix do not themselves authorize external deployment, sensitive-data onboarding, or activation of SSO, connectors, scheduled workers, or production API clients. Those actions remain subject to the documented review and acceptance gates.

## Supported state

Security fixes should target the current `main` branch and include focused regression coverage where feasible. Run the required type check, automated tests, production build, and production dependency audit before requesting review.
