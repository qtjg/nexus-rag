# Git intelligence example

## Purpose

This example shows the bounded workflow for reviewing an approved Git diff inside NEXUS RAG. It does not clone a repository, execute source code, retain repository credentials, or activate an external connector.

| Field | Example |
| --- | --- |
| Collection | `Engineering runbooks` |
| Repository label | `payments-api` |
| Repository reference | `github.com/acme/payments-api` |
| Base revision | `9db34d1` |
| Revision | `a42ce9b` |
| Evidence type | `Git diff` |

```diff
diff --git a/src/render.ts b/src/render.ts
@@ -1,3 +1,5 @@
+export function renderPreview(value: string) {
+  return <div dangerouslySetInnerHTML={{ __html: value }} />
+}
```

Register this text in **Git intelligence** with a collection the reviewer is authorized to access. Then run a deterministic or AI-assisted review. A valid retained finding must cite an exact submitted excerpt, identify the diff line, and propose a remediation. In this example, the deterministic reviewer should identify the raw HTML insertion surface and recommend avoiding or sanitizing it.

> Review findings are engineering evidence, not proof of the absence of defects. Preserve normal code review, tests, security review, and change-management discipline.
