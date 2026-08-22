import { describe, expect, it } from "vitest";
import { createDeterministicGitFindings, MAX_GIT_SNAPSHOT_CHARS, normalizeGitSnapshot, parseLlmGitFindings } from "./gitIntelligence";

describe("NEXUS Git intelligence safeguards", () => {
  it("bounds submitted snapshots, counts diff paths, and preserves the truncation signal", () => {
    const content = `diff --git a/a.ts b/a.ts\ndiff --git a/b.ts b/b.ts\n${"x".repeat(MAX_GIT_SNAPSHOT_CHARS + 20)}`;
    const normalized = normalizeGitSnapshot(content);
    expect(normalized.content).toHaveLength(MAX_GIT_SNAPSHOT_CHARS);
    expect(normalized.fileCount).toBe(2);
    expect(normalized.inputTruncated).toBe(true);
  });

  it("creates cited deterministic findings only from added diff lines", () => {
    const diff = [
      "diff --git a/src/review.ts b/src/review.ts",
      "--- a/src/review.ts",
      "+++ b/src/review.ts",
      "@@ -1,2 +1,3 @@",
      "- const old = eval(input)",
      "+ const execute = eval(input)",
      "+ // TODO: add a safer parser",
    ].join("\n");
    const findings = createDeterministicGitFindings(diff);
    expect(findings.some((finding) => finding.title === "Dynamic code execution introduced" && finding.evidence.includes("eval(input)"))).toBe(true);
    expect(findings.some((finding) => finding.title === "Deferred implementation marker added" && finding.evidence.includes("TODO"))).toBe(true);
    expect(findings.every((finding) => !finding.evidence.includes("old = eval"))).toBe(true);
  });

  it("accepts LLM findings only when their evidence appears verbatim in the submitted diff", () => {
    const diff = "diff --git a/src/auth.ts b/src/auth.ts\n+ const raw = dangerouslySetInnerHTML\n";
    const findings = parseLlmGitFindings(JSON.stringify({
      findings: [
        { severity: "high", category: "security", path: "src/auth.ts", title: "Unsafe HTML", evidence: "+ const raw = dangerouslySetInnerHTML", recommendation: "Remove the raw HTML sink." },
        { severity: "critical", category: "security", path: "src/auth.ts", title: "Invented issue", evidence: "not in the diff", recommendation: "Ignore." },
      ],
    }), diff);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.engine).toBe("llm");
    expect(findings[0]?.diffLine).toBe(2);
  });
});
