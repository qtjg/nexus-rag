# GitHub Actions runtime maintenance

## Purpose

The NEXUS RAG source package uses **Node.js 22** for its application and validation commands. GitHub Actions themselves are JavaScript actions with a separate internal runtime. The hosted CI warning observed on the validation workflow identified `actions/checkout@v4` and `actions/setup-node@v4` as Node.js 20-targeting actions that GitHub was forcing onto Node.js 24.

The repository now uses `actions/checkout@v5` and `actions/setup-node@v5` in its primary validation workflow; the optional inactive Cloud Run preflight also uses checkout v5. This changes the action runtime only. It does not change the NEXUS RAG application’s declared Node.js 22 runtime, enable hosting, or activate a cloud preflight.

The validation workflow explicitly sets `package-manager-cache: false` on setup-node v5. Its automatic cache initialization attempts to locate pnpm before the workflow's next Corepack step enables it, which causes a hosted-runner failure for this package. The workflow retains a visible Corepack initialization step before installing dependencies; this preserves deterministic package-manager setup and avoids relying on the runner’s ambient pnpm path.

## Compatibility boundary

The official checkout v5 and setup-node v5 documentation states that each action runs on Node.js 24 and requires Actions Runner `v2.327.1` or later. GitHub-hosted `ubuntu-latest` runners satisfy the hosted workflow path. Owners using self-hosted runners should verify that runner baseline before invoking the workflow. [1] [2]

| Workflow | Application runtime | Action runtime maintenance | Activation status |
| --- | --- | --- | --- |
| `.github/workflows/ci.yml` | Node.js 22, selected explicitly by setup-node | Checkout and setup-node v5 | Active continuous validation |
| `.github/workflows/gcp-cloud-run-preflight.yml` | Not applicable | Checkout v5 | Optional, manual, and inactive for this source handoff |

## Validation expectation

A follow-on GitHub Actions run must pass the existing type check, 19-test suite, production build, and production dependency audit **without** the Node.js 20 deprecation annotation for checkout or setup-node. This repository change does not alter any RAG retrieval, ingestion, policy, database, or deployment behavior.

## References

[1] [actions/checkout: Checkout v5](https://github.com/actions/checkout)

[2] [actions/setup-node: Setup Node v5](https://github.com/actions/setup-node)
