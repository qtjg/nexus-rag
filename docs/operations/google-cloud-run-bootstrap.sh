#!/usr/bin/env bash
# NEXUS RAG Google Cloud Run bootstrap — review before use.
#
# This script NEVER deploys an application, creates a Cloud Run service, creates
# a scheduler, configures a database, reads a secret, or enables guarded NEXUS
# RAG controls. It only enables prerequisite APIs and establishes the keyless
# GitHub Actions workload-identity/service-account boundary used by the manual
# preflight workflow.
#
# Required local prerequisite: an administrator-authenticated gcloud CLI with
# permission to configure IAM, service accounts, and the listed service APIs.
#
# Example (after security review):
#   APPLY=1 ./google-cloud-run-bootstrap.sh nexus-rag-prod-123456 us-central1

set -euo pipefail

if [[ "${APPLY:-}" != "1" ]]; then
  cat >&2 <<'MESSAGE'
Refusing to change Google Cloud because APPLY=1 was not provided.

This is a reviewable bootstrap procedure. Before using it, verify the selected
project, region, GitHub repository condition, IAM roles, billing implications,
and the architecture record in google-cloud-run-deployment.md.
MESSAGE
  exit 2
fi

PROJECT_ID="${1:?Usage: APPLY=1 $0 PROJECT_ID REGION}"
REGION="${2:?Usage: APPLY=1 $0 PROJECT_ID REGION}"

GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-qtjg/nexus-rag}"
POOL_ID="${POOL_ID:-github-actions}"
PROVIDER_ID="${PROVIDER_ID:-nexus-rag-main}"
DEPLOYER_SA_NAME="${DEPLOYER_SA_NAME:-github-nexus-deployer}"
RUNTIME_SA_NAME="${RUNTIME_SA_NAME:-nexus-rag-runtime}"
SCHEDULER_SA_NAME="${SCHEDULER_SA_NAME:-nexus-rag-scheduler}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-nexus-rag}"

command -v gcloud >/dev/null 2>&1 || {
  echo "gcloud CLI is required." >&2
  exit 127
}

gcloud config set project "$PROJECT_ID" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

echo "Bootstrapping only the Google Cloud identity boundary for:"
printf '  Project: %s\n  Region: %s\n  Repository condition: %s\n' "$PROJECT_ID" "$REGION" "$GITHUB_REPOSITORY"

gcloud services enable \
  run.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  cloudresourcemanager.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com

ensure_service_account() {
  local name="$1"
  local description="$2"
  local email="${name}@${PROJECT_ID}.iam.gserviceaccount.com"

  if ! gcloud iam service-accounts describe "$email" --project "$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$name" \
      --project "$PROJECT_ID" \
      --display-name="$name" \
      --description="$description"
  fi
  printf '%s' "$email"
}

DEPLOYER_SA="$(ensure_service_account "$DEPLOYER_SA_NAME" "GitHub Actions deployment identity for NEXUS RAG")"
RUNTIME_SA="$(ensure_service_account "$RUNTIME_SA_NAME" "Cloud Run runtime identity for NEXUS RAG")"
SCHEDULER_SA="$(ensure_service_account "$SCHEDULER_SA_NAME" "Reserved scheduler identity for the future NEXUS RAG retry worker")"

if ! gcloud iam workload-identity-pools describe "$POOL_ID" \
  --project "$PROJECT_ID" --location global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$POOL_ID" \
    --project "$PROJECT_ID" \
    --location global \
    --display-name="GitHub Actions deployments"
fi

if ! gcloud iam workload-identity-pools providers describe "$PROVIDER_ID" \
  --project "$PROJECT_ID" --location global --workload-identity-pool "$POOL_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
    --project "$PROJECT_ID" \
    --location global \
    --workload-identity-pool "$POOL_ID" \
    --display-name="NEXUS RAG GitHub main" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='${GITHUB_REPOSITORY}' && assertion.ref=='refs/heads/main'"
fi

POOL_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}"
REPOSITORY_PRINCIPAL="principalSet://iam.googleapis.com/${POOL_RESOURCE}/attribute.repository/${GITHUB_REPOSITORY}"

# GitHub OIDC may impersonate only the deployment identity.
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
  --project "$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="$REPOSITORY_PRINCIPAL"

# The deployment identity may deploy Cloud Run services and attach the separate
# runtime identity. Restrict resource-level permissions further after the first
# non-production service is created and reviewed.
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --role="roles/run.admin" \
  --member="serviceAccount:${DEPLOYER_SA}"
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --project "$PROJECT_ID" \
  --role="roles/iam.serviceAccountUser" \
  --member="serviceAccount:${DEPLOYER_SA}"

cat <<OUTPUT

Bootstrap completed without deploying NEXUS RAG.

Set these non-secret GitHub Environment variables on the protected
gcp-production environment before running the manual preflight workflow:

GCP_PROJECT_ID=${PROJECT_ID}
GCP_REGION=${REGION}
GCP_WORKLOAD_IDENTITY_PROVIDER=projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}
GCP_DEPLOY_SERVICE_ACCOUNT=${DEPLOYER_SA}
GCP_RUNTIME_SERVICE_ACCOUNT=${RUNTIME_SA}
GCP_CLOUD_RUN_SERVICE=${CLOUD_RUN_SERVICE}

Scheduler identity reserved for the later reviewed worker adaptation:
${SCHEDULER_SA}

Next: configure the protected GitHub Environment variables, run the manual
PREFLIGHT workflow, and record the result. Do not create a Cloud Run service,
Cloud Scheduler job, OAuth adapter, database, storage adapter, or LLM gateway
until the remaining deployment and security gates are explicitly approved.
OUTPUT
