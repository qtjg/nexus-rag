# NEXUS RAG Google Cloud Run deployment handoff

## Scope and non-deployment statement

Google Cloud Run is the selected external hosting target. This handoff adds a **manual preflight workflow only**. It authenticates from GitHub Actions through Workload Identity Federation, validates non-secret deployment identifiers, and verifies the project and runtime service-account boundary. It does **not** build an external production image, deploy a Cloud Run revision, create a scheduler, read secret values, or activate any guarded NEXUS RAG feature.

> The existing application depends on managed OAuth, object storage, LLM access, and scheduled-callback services. Those dependencies must be replaced and tested before a Cloud Run deployment can be considered functional or approved for sensitive data.

## Target architecture

| Plane | Google Cloud responsibility | NEXUS RAG boundary |
| --- | --- | --- |
| Web service | A private Cloud Run service for the Express/React bundle | Serves the authenticated workspace and API after an approved identity adapter replaces the managed OAuth flow |
| Runtime identity | Dedicated Cloud Run service account | Grants only database, object-storage, secret, and approved model-gateway access actually required at runtime |
| Database | Cloud SQL for MySQL or another TLS-enabled MySQL/TiDB-compatible managed database | Receives ordered Drizzle migrations through a reviewed, non-production-first process |
| Object storage | Cloud Storage, via an approved adapter | Stores document bytes; the application database retains only metadata and storage references |
| LLM gateway | Approved server-only provider or internal gateway | Replaces the managed Forge endpoint; requires cost, timeout, evaluation, and data-processing review |
| Scheduler | Cloud Scheduler calling a separately adapted private worker path or a Cloud Run Job | Replaces the managed scheduled-callback identity without exposing the existing cron-only route |
| Observability | Cloud Logging, Monitoring, and alerting | Captures web errors, ingestion retry backlog, dead-letter count, scheduler results, and deployment revisions |

## GitHub-to-Google trust boundary

The repository includes `.github/workflows/gcp-cloud-run-preflight.yml`. It uses the GitHub OIDC token and `google-github-actions/auth@v3` with Workload Identity Federation; the workflow requires `id-token: write` and deliberately has no service-account key JSON. Google recommends workload identity federation for deployment pipelines because it removes the need to manage long-lived service-account keys. [1] [2]

The Google Cloud administrator must create the workload identity pool and provider, map the relevant GitHub claims, and restrict the provider with an attribute condition to the authorized GitHub organization/repository and protected deployment reference. Google warns that GitHub uses a shared issuer and recommends an attribute condition restricting tokens to the intended organization. [1]

| GitHub environment variable | Expected value | Sensitivity |
| --- | --- | --- |
| `GCP_PROJECT_ID` | Target Google Cloud project ID | Non-secret |
| `GCP_REGION` | Cloud Run region, such as `us-central1` | Non-secret |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full workload identity provider resource name | Non-secret identifier |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | Deployment service-account email | Non-secret identifier |
| `GCP_RUNTIME_SERVICE_ACCOUNT` | Cloud Run runtime service-account email | Non-secret identifier |
| `GCP_CLOUD_RUN_SERVICE` | Intended Cloud Run service name | Non-secret |

Set these as GitHub **Environment variables** on the protected `gcp-production` environment. Do not place credentials, connection strings, OAuth client secrets, or model-provider keys in repository variables or workflow YAML.

## IAM separation

| Identity | Required purpose | Required restriction |
| --- | --- | --- |
| GitHub deployment identity | Authenticate via federation and create revisions only after approval | Constrain the federated provider to `qtjg/nexus-rag`, the approved branch/environment, and the exact deployment workflow |
| Deployment service account | Deploy the Cloud Run service and attach the runtime service account | Grant narrowly scoped Cloud Run deployment and service-account-use permissions; do not grant broad project ownership |
| Runtime service account | Access application runtime dependencies | Do not grant deployment, IAM administration, or scheduler-administration permissions |
| Scheduler service account | Invoke only the separately approved retry worker target | Grant invocation only for that target; do not reuse customer API credentials |

The exact least-privilege role bindings depend on the selected database, object-storage adapter, model gateway, and whether the worker is deployed as a Cloud Run Job or service. Review them with the qualified security reviewer before applying them.

## Preflight procedure

1. Create and protect the `gcp-production` GitHub Environment; add the six non-secret variables listed above.
2. Configure Workload Identity Federation in the selected Google Cloud project, including a repository- and branch-restricted provider condition. [1]
3. Create separate deployment, runtime, and scheduler service accounts. Do not use personal accounts or static keys.
4. From GitHub Actions, run **NEXUS RAG Google Cloud Run preflight** and enter `PREFLIGHT`. It validates the project and identities without deployment.
5. Record the run URL, relevant IAM review, and any failures in `docs/operations/external-review-evidence-register.md`.

## Managed-service replacement checklist

| Existing dependency | Cloud Run readiness requirement | Current state |
| --- | --- | --- |
| Managed OAuth | Approved OIDC/OAuth adapter, secure callback URL, session/cookie policy, owner bootstrap, and authentication regression tests | Not implemented for Cloud Run |
| Managed database | TLS-enabled Cloud SQL or compatible database; migration, backup, restore, and isolation evidence | Provider not selected/configured |
| Managed object storage | Cloud Storage adapter, service-account policy, retention/deletion behavior, and document-access tests | Not implemented for Cloud Run |
| Managed LLM proxy | Approved server-only gateway/provider, secret management, timeout/cost controls, and representative-corpus re-evaluation | Not implemented for Cloud Run |
| Managed retry scheduler | Adapted worker entry point with no-overlap protection, Cloud Scheduler or Cloud Run Job identity, and failure/replay tests | Design documented; not activated |

## Scheduler design requirement

The current `POST /api/scheduled/ingestion-retry` endpoint accepts only a managed cron identity, so Cloud Scheduler must not call it directly. For Cloud Run, adapt `processDueIngestionJobs()` into a private worker path or Cloud Run Job guarded by a dedicated Google service account. Cloud Scheduler can securely invoke authenticated Cloud Run workloads when configured with an associated service account that has permission to invoke the target. [3]

Match the verified five-minute cadence only after the worker adaptation has a cross-process lease or scheduler overlap prevention. Keep the worker disabled until the backup/restore rehearsal, realistic load/failure exercise, and qualified security review all have recorded evidence.

## Deployment gate

An actual Cloud Run deployment workflow is intentionally deferred until all of the following are true:

1. The six GitHub Environment variables are configured and the keyless preflight passes.
2. The managed-service replacement checklist is completed and regression-tested in a non-production Google Cloud project.
3. Database migration, backup/restore, realistic load/failure, and qualified human security-review evidence are accepted.
4. The external worker design has passed its duplicate-execution and dead-letter recovery checks.
5. An accountable owner explicitly authorizes deployment after reviewing the evidence.

## References

[1] [Google Cloud IAM: Configure Workload Identity Federation with deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)

[2] [Google GitHub Actions: Auth](https://github.com/google-github-actions/auth)

[3] [Google Cloud Run: Running services on a schedule](https://docs.cloud.google.com/run/docs/triggering/using-scheduler)
