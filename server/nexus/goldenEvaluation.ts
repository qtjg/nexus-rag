import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  auditEvents,
  chunks,
  collectionAccess,
  collections,
  feedback,
  ingestionJobs,
  organizationInvitations,
  organizationMemberships,
  organizationPolicies,
  organizations,
  queries,
  queryCitations,
  sources,
  users,
} from "../../drizzle/schema";
import { chunkText, createLocalEmbedding } from "./retrieval";
import { askKnowledge } from "./service";

export type GoldenDocument = { id: string; name: string; content: string; sourceUrl?: string };
export type GoldenCase = {
  id: string;
  question: string;
  expectedDocumentIds: string[];
  expectedSummary: string;
  category: "factual" | "multi-hop" | "unanswerable";
};

export const NON_SENSITIVE_GOLDEN_CORPUS: GoldenDocument[] = [
  { id: "access", name: "Access Control Handbook", content: "# Collection access\n\nEvery restricted collection requires an owner-approved access grant. Viewer access is read-only and does not permit source uploads.\n\n# Emergency access\n\nEmergency access expires after four hours and must be reviewed by an owner on the next business day." },
  { id: "incident", name: "Incident Response Protocol", content: "# Critical incidents\n\nA critical incident is declared by the incident commander. The commander opens the incident channel and notifies the on-call engineer within fifteen minutes.\n\n# Dependency faults\n\nAn upstream dependency fault is recorded in the incident timeline and reported to the vendor contact." },
  { id: "release", name: "Release Governance Standard", content: "# Production approval\n\nA production release requires approval from two designated reviewers and a recorded security review before deployment.\n\n# Emergency release\n\nAn emergency release may proceed with one reviewer only when the incident commander records the exception in the release log." },
  { id: "reliability", name: "Service Reliability Runbook", content: "# Recovery objective\n\nThe catalog service recovery objective is thirty minutes. A failed background job is retried three times with exponential backoff before it is sent to the dead-letter queue.\n\n# Verification\n\nThe responder verifies recovery with a synthetic health check and records the outcome in the incident timeline." },
  { id: "retention", name: "Data Retention Standard", content: "# Operational records\n\nOperational logs are retained for ninety days. Deleted source content is removed from retrieval immediately, while object storage cleanup may complete asynchronously.\n\n# Legal hold\n\nA legal hold pauses scheduled deletion until the legal owner clears the hold." },
  { id: "support", name: "Support Escalation Guide", content: "# Escalation\n\nA priority-one support case is acknowledged within one hour and assigned to the service owner. The service owner posts a customer-safe status update after the incident commander confirms the initial assessment.\n\n# Closure\n\nA case closes only after the requester confirms resolution or seven days pass without a reply." },
  { id: "api", name: "API Lifecycle Guide", content: "# Versioning\n\nPublic API versions remain supported for twelve months after deprecation is announced. Breaking changes require a migration guide and a ninety-day notice.\n\n# Credentials\n\nAPI credentials are rotated every one hundred eighty days and must never be written to application logs." },
  { id: "publication", name: "Knowledge Publication Policy", content: "# Review\n\nA knowledge article becomes searchable after its owner reviews the source and assigns it to an approved collection. Draft articles remain outside retrieval until review completes.\n\n# Corrections\n\nA material correction requires a new source version and retirement of the previous version from retrieval." },
  { id: "vendor", name: "Vendor Assessment Checklist", content: "# Restricted records\n\nA vendor that handles restricted records requires a security assessment and a signed data-processing agreement before activation.\n\n# Annual review\n\nThe vendor owner completes an annual review and records outstanding risks in the vendor register." },
  { id: "change", name: "Change Management Policy", content: "# Planned changes\n\nA planned infrastructure change is scheduled in an approved maintenance window and includes a documented rollback step.\n\n# Experiments\n\nAn experiment decision is recorded in the experiment register with the hypothesis, outcome, and owner." },
];

export const GOLDEN_CASES: GoldenCase[] = [
  { id: "g01", question: "Who can approve access to a restricted collection?", expectedDocumentIds: ["access"], expectedSummary: "An owner-approved access grant is required.", category: "factual" },
  { id: "g02", question: "How long does emergency access last?", expectedDocumentIds: ["access"], expectedSummary: "Emergency access expires after four hours.", category: "factual" },
  { id: "g03", question: "Who declares a critical incident?", expectedDocumentIds: ["incident"], expectedSummary: "The incident commander declares it.", category: "factual" },
  { id: "g04", question: "When must the on-call engineer be notified during a critical incident?", expectedDocumentIds: ["incident"], expectedSummary: "Within fifteen minutes.", category: "factual" },
  { id: "g05", question: "How many reviewers approve a standard production release?", expectedDocumentIds: ["release"], expectedSummary: "Two designated reviewers.", category: "factual" },
  { id: "g06", question: "What must be recorded before a standard production deployment?", expectedDocumentIds: ["release"], expectedSummary: "A security review.", category: "factual" },
  { id: "g07", question: "What is the catalog service recovery objective?", expectedDocumentIds: ["reliability"], expectedSummary: "Thirty minutes.", category: "factual" },
  { id: "g08", question: "How many times is a failed background job retried before dead letter?", expectedDocumentIds: ["reliability"], expectedSummary: "Three times with exponential backoff.", category: "factual" },
  { id: "g09", question: "How long are operational logs retained?", expectedDocumentIds: ["retention"], expectedSummary: "Ninety days.", category: "factual" },
  { id: "g10", question: "Does deleting source content remove it from retrieval immediately?", expectedDocumentIds: ["retention"], expectedSummary: "Yes; object storage cleanup can be asynchronous.", category: "factual" },
  { id: "g11", question: "When is a priority-one support case acknowledged?", expectedDocumentIds: ["support"], expectedSummary: "Within one hour.", category: "factual" },
  { id: "g12", question: "How long are public API versions supported after deprecation?", expectedDocumentIds: ["api"], expectedSummary: "Twelve months.", category: "factual" },
  { id: "g13", question: "When does a knowledge article become searchable?", expectedDocumentIds: ["publication"], expectedSummary: "After owner review and assignment to an approved collection.", category: "factual" },
  { id: "g14", question: "What review is required before a vendor handles restricted records?", expectedDocumentIds: ["vendor"], expectedSummary: "A security assessment and signed data-processing agreement.", category: "factual" },
  { id: "g15", question: "Where must a planned infrastructure change be scheduled?", expectedDocumentIds: ["change"], expectedSummary: "In an approved maintenance window with rollback documented.", category: "factual" },
  { id: "g16", question: "What must be recorded for an experiment decision?", expectedDocumentIds: ["change"], expectedSummary: "The hypothesis, outcome, and owner in the experiment register.", category: "factual" },
  { id: "g17", question: "For a critical incident with an upstream dependency fault, what notification and reporting actions are required?", expectedDocumentIds: ["incident"], expectedSummary: "Notify on-call within fifteen minutes and report the dependency fault to the vendor contact.", category: "multi-hop" },
  { id: "g18", question: "What is required for both a planned infrastructure change and a standard production release?", expectedDocumentIds: ["change", "release"], expectedSummary: "The change needs an approved window and rollback; the release needs two reviewers and a security review.", category: "multi-hop" },
  { id: "g19", question: "What is the Seoul office cafeteria menu?", expectedDocumentIds: [], expectedSummary: "No information is available in the corpus.", category: "unanswerable" },
  { id: "g20", question: "What is the moon mission code name?", expectedDocumentIds: [], expectedSummary: "No information is available in the corpus.", category: "unanswerable" },
];

export const PUBLIC_INCIDENT_RESPONSE_CORPUS: GoldenDocument[] = [
  { id: "playbooks", name: "CISA Incident and Vulnerability Response Playbooks", sourceUrl: "https://www.cisa.gov/resources-tools/resources/federal-government-cybersecurity-incident-and-vulnerability-response-playbooks", content: "# Standard response procedures\n\nCISA describes incident and vulnerability response playbooks that standardize procedures to identify, coordinate, remediate, recover, and track successful mitigations affecting systems, data, and networks." },
  { id: "ransomware-guide", name: "CISA StopRansomware Guide", sourceUrl: "https://www.cisa.gov/stopransomware/ransomware-guide", content: "# Preparation and recovery\n\nMaintain offline, encrypted backups of critical data and regularly test backup availability and integrity in a disaster recovery scenario. Maintain and regularly update golden images of critical systems. Create, maintain, and regularly exercise a cyber incident response plan and communications plan; keep a hard copy and offline version available.\n\n# Prevention\n\nConduct regular vulnerability scanning, especially on internet-facing devices. Regularly patch and update software and operating systems, prioritizing timely patching of internet-facing servers." },
  { id: "ransomware-response", name: "CISA Ransomware Response Checklist", sourceUrl: "https://www.cisa.gov/stopransomware/ive-been-hit-ransomware", content: "# Detection and analysis\n\nDetermine which systems were impacted and immediately isolate them. If several systems or subnets appear impacted, take the network offline at the switch level. Triage impacted systems for restoration and recovery, prioritizing critical systems on a clean network using a predefined critical asset list.\n\n# Reporting and recovery\n\nFollow notification requirements in the response and communications plan and keep management informed. Preserve volatile evidence such as system memory and log buffers. Rebuild systems based on prioritization of critical services using preconfigured standard images where possible. Reconnect systems and restore data from offline, encrypted backups based on prioritization of critical services. Document lessons learned to update policies, plans, procedures, and exercises." },
  { id: "contingency", name: "NIST SP 800-34 Rev. 1 Contingency Planning", sourceUrl: "https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final", content: "# Contingency planning\n\nNIST SP 800-34 assists organizations in understanding the purpose, process, and format of information system contingency planning development. It provides practical guidance on relationships among information-system contingency planning, other security and emergency management contingency plans, organizational resilience, and the system development life cycle. It helps personnel evaluate systems and operations to determine contingency planning requirements and priorities." },
  { id: "incident-recommendations", name: "NIST SP 800-61 Rev. 3 Incident Response Recommendations", sourceUrl: "https://csrc.nist.gov/pubs/sp/800/61/r3/final", content: "# Incident response recommendations\n\nNIST SP 800-61 Rev. 3 helps organizations incorporate cybersecurity incident response recommendations and considerations throughout cybersecurity risk-management activities described by the NIST Cybersecurity Framework 2.0. This can help organizations prepare for responses, reduce the number and impact of incidents, and improve the efficiency and effectiveness of detection, response, and recovery activities." },
];

export const PUBLIC_INCIDENT_RESPONSE_CASES: GoldenCase[] = [
  { id: "p01", question: "Which five activities do CISA incident and vulnerability response playbooks standardize?", expectedDocumentIds: ["playbooks"], expectedSummary: "Identify, coordinate, remediate, recover, and track successful mitigations.", category: "factual" },
  { id: "p02", question: "What characteristics should backups of critical data have according to the CISA ransomware guide?", expectedDocumentIds: ["ransomware-guide"], expectedSummary: "They should be offline and encrypted, with availability and integrity tested regularly.", category: "factual" },
  { id: "p03", question: "What should be maintained to rebuild critical systems quickly?", expectedDocumentIds: ["ransomware-guide"], expectedSummary: "Regularly updated golden images of critical systems.", category: "factual" },
  { id: "p04", question: "What versions of an incident response plan should remain available?", expectedDocumentIds: ["ransomware-guide"], expectedSummary: "A hard copy and an offline version.", category: "factual" },
  { id: "p05", question: "Which devices should receive special attention during regular vulnerability scanning?", expectedDocumentIds: ["ransomware-guide"], expectedSummary: "Internet-facing devices.", category: "factual" },
  { id: "p06", question: "What should happen immediately after determining which systems are impacted by ransomware?", expectedDocumentIds: ["ransomware-response"], expectedSummary: "Immediately isolate the impacted systems.", category: "factual" },
  { id: "p07", question: "What response is recommended if several systems or subnets appear impacted?", expectedDocumentIds: ["ransomware-response"], expectedSummary: "Take the network offline at the switch level.", category: "factual" },
  { id: "p08", question: "How should impacted systems be prioritized for restoration and recovery?", expectedDocumentIds: ["ransomware-response"], expectedSummary: "Prioritize critical systems on a clean network using a predefined critical asset list.", category: "factual" },
  { id: "p09", question: "What should be preserved because it may be volatile or have limited retention?", expectedDocumentIds: ["ransomware-response"], expectedSummary: "Evidence such as system memory and log buffers.", category: "factual" },
  { id: "p10", question: "After recovery, what should teams document to refine future procedures and exercises?", expectedDocumentIds: ["ransomware-response"], expectedSummary: "Lessons learned from the incident and response activities.", category: "factual" },
  { id: "p11", question: "What does NIST SP 800-34 help personnel determine?", expectedDocumentIds: ["contingency"], expectedSummary: "Contingency planning requirements and priorities by evaluating systems and operations.", category: "factual" },
  { id: "p12", question: "Which relationships does NIST SP 800-34 discuss in its contingency planning guidance?", expectedDocumentIds: ["contingency"], expectedSummary: "Relationships among information-system contingency planning, other security and emergency plans, resilience, and the system development life cycle.", category: "factual" },
  { id: "p13", question: "What does NIST SP 800-61 Rev. 3 seek to incorporate throughout cybersecurity risk-management activities?", expectedDocumentIds: ["incident-recommendations"], expectedSummary: "Cybersecurity incident response recommendations and considerations.", category: "factual" },
  { id: "p14", question: "According to NIST SP 800-61 Rev. 3, what outcomes can incident-response recommendations improve?", expectedDocumentIds: ["incident-recommendations"], expectedSummary: "Preparation, reduced number and impact of incidents, and the efficiency and effectiveness of detection, response, and recovery.", category: "factual" },
  { id: "p15", question: "What should an organization do both before and after a ransomware incident to support recovery?", expectedDocumentIds: ["ransomware-guide", "ransomware-response"], expectedSummary: "Maintain and test offline encrypted backups beforehand, then reconnect systems and restore from those backups according to critical-service priority.", category: "multi-hop" },
  { id: "p16", question: "How do the CISA playbooks and NIST SP 800-61 Rev. 3 describe the purpose of organized incident response?", expectedDocumentIds: ["playbooks", "incident-recommendations"], expectedSummary: "Standardize response activities and improve preparation, mitigation, and detection/response/recovery effectiveness.", category: "multi-hop" },
  { id: "p17", question: "What is the menu for the Contoso icebreaker festival?", expectedDocumentIds: [], expectedSummary: "No information is available in the corpus.", category: "unanswerable" },
  { id: "p18", question: "Which LUN-57 platform ID performed database replication last week?", expectedDocumentIds: [], expectedSummary: "No information is available in the corpus.", category: "unanswerable" },
  { id: "p19", question: "Where can I find the blue-orchid onboarding contract?", expectedDocumentIds: [], expectedSummary: "No information is available in the corpus.", category: "unanswerable" },
  { id: "p20", question: "What codeword opens the Phoenix Mars gateway?", expectedDocumentIds: [], expectedSummary: "No information is available in the corpus.", category: "unanswerable" },
];

type Fixture = { orgId: number; userId: number; collectionId: number; sourceIds: number[]; documentSourceIds: Record<string, number> };
type FaithfulnessResult = { supported: boolean; rationale: string };
type EvaluationSummary = { answerableCases: number; precisionAt5: number; recallAt10: number; faithfulness: number; abstentionAccuracy: number; p95LatencyMs: number; faithfulnessJudgeUnavailableCases: number };
type CaseResult = { id: string; category: GoldenCase["category"]; expectedDocumentIds: string[]; retrievedDocumentIds: string[]; precisionAt5: number | null; recallAt10: number | null; abstainedCorrectly: boolean | null; faithfulness: FaithfulnessResult; latencyMs: number; answer: string };
type PendingJudge = { item: GoldenCase; result: CaseResult; excerpts: string[] };

async function cleanupFixture(fixture: Fixture) {
  const db = await getDb();
  if (!db) return;
  const orgIds = [fixture.orgId];
  await db.delete(queryCitations).where(inArray(queryCitations.orgId, orgIds));
  await db.delete(feedback).where(inArray(feedback.orgId, orgIds));
  await db.delete(queries).where(inArray(queries.orgId, orgIds));
  await db.delete(chunks).where(inArray(chunks.orgId, orgIds));
  await db.delete(ingestionJobs).where(inArray(ingestionJobs.orgId, orgIds));
  await db.delete(sources).where(inArray(sources.orgId, orgIds));
  await db.delete(collectionAccess).where(inArray(collectionAccess.orgId, orgIds));
  await db.delete(organizationInvitations).where(inArray(organizationInvitations.orgId, orgIds));
  await db.delete(organizationPolicies).where(inArray(organizationPolicies.orgId, orgIds));
  await db.delete(auditEvents).where(inArray(auditEvents.orgId, orgIds));
  await db.delete(organizationMemberships).where(inArray(organizationMemberships.orgId, orgIds));
  await db.delete(collections).where(inArray(collections.orgId, orgIds));
  await db.delete(organizations).where(eq(organizations.id, fixture.orgId));
  await db.delete(users).where(eq(users.id, fixture.userId));
}

async function createFixture(corpus: GoldenDocument[], label: string): Promise<Fixture> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is required to run the golden evaluation.");
  const suffix = randomUUID().slice(0, 12);
  const user = await db.insert(users).values({ openId: `qa-golden-${suffix}`, name: "NEXUS Golden QA", email: `qa-golden-${suffix}@example.test` });
  const userId = Number(user[0].insertId);
  const organization = await db.insert(organizations).values({ name: `NEXUS Golden QA ${suffix}`, slug: `nexus-golden-${suffix}` });
  const orgId = Number(organization[0].insertId);
  await db.insert(organizationMemberships).values({ orgId, userId, role: "owner" });
  await db.insert(organizationPolicies).values({ orgId, queryRateLimitPerMinute: 120 });
  const collection = await db.insert(collections).values({ orgId, name: `${label} evaluation corpus`, description: "Non-sensitive QA fixture." });
  const collectionId = Number(collection[0].insertId);
  const documentSourceIds: Record<string, number> = {};
  const sourceIds: number[] = [];
  for (const document of corpus) {
    const source = await db.insert(sources).values({
      orgId, collectionId, createdByUserId: userId, type: "text", name: document.name,
      contentHash: createHash("sha256").update(document.content).digest("hex"), extractedText: document.content, sourceUrl: document.sourceUrl ?? null, status: "indexed",
    });
    const sourceId = Number(source[0].insertId);
    documentSourceIds[document.id] = sourceId;
    sourceIds.push(sourceId);
    const drafts = chunkText(document.content);
    await db.insert(chunks).values(drafts.map((draft) => ({
      orgId, sourceId, collectionId, text: draft.text, title: document.name, sectionPath: draft.sectionPath,
      ordinal: draft.ordinal, tokenCount: draft.tokenCount, charOffsetStart: draft.charOffsetStart, charOffsetEnd: draft.charOffsetEnd,
      contentHash: draft.contentHash, embeddingJson: JSON.stringify(createLocalEmbedding(`${document.name} ${draft.sectionPath ?? ""} ${draft.text}`)),
    })));
  }
  return { orgId, userId, collectionId, sourceIds, documentSourceIds };
}

async function judgeFaithfulness(item: GoldenCase, answer: string, excerpts: string[]): Promise<FaithfulnessResult> {
  if (item.category === "unanswerable") {
    return { supported: /sufficient information|don.t have enough information|insufficient context/i.test(answer), rationale: "Checked abstention wording for an intentionally unanswerable case." };
  }
  const response = await invokeLLM({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "Judge only whether every factual claim in the answer is supported by the cited excerpts. Return JSON matching the schema. Do not reward plausible but unsupported claims." },
      { role: "user", content: `Expected summary: ${item.expectedSummary}\n\nAnswer:\n${answer}\n\nCited excerpts:\n${excerpts.map((excerpt, index) => `[${index + 1}] ${excerpt}`).join("\n\n")}` },
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "faithfulness_judgment",
        strict: true,
        schema: {
          type: "object",
          properties: { supported: { type: "boolean" }, rationale: { type: "string" } },
          required: ["supported", "rationale"],
          additionalProperties: false,
        },
      },
    },
  });
  const content = response.choices[0]?.message.content;
  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.filter((part): part is { type: "text"; text: string } => part.type === "text").map((part) => part.text).join("\n")
      : "";
  if (!text) return { supported: false, rationale: "Faithfulness judge returned no text content." };
  try {
    const normalized = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const jsonStart = normalized.indexOf("{");
    const jsonEnd = normalized.lastIndexOf("}");
    const json = jsonStart >= 0 && jsonEnd > jsonStart ? normalized.slice(jsonStart, jsonEnd + 1) : normalized;
    const parsed = JSON.parse(json) as FaithfulnessResult;
    return { supported: parsed.supported === true, rationale: typeof parsed.rationale === "string" ? parsed.rationale : "Judge returned an invalid rationale." };
  } catch {
    return { supported: false, rationale: "Faithfulness judge returned invalid JSON." };
  }
}

export async function runGoldenEvaluation(corpusProfile = process.env.NEXUS_EVAL_CORPUS === "public" ? "public" : "fixture"): Promise<{ results: CaseResult[]; summary: EvaluationSummary }> {
  const isPublicCorpus = corpusProfile === "public";
  const corpus = isPublicCorpus ? PUBLIC_INCIDENT_RESPONSE_CORPUS : NON_SENSITIVE_GOLDEN_CORPUS;
  const cases = isPublicCorpus ? PUBLIC_INCIDENT_RESPONSE_CASES : GOLDEN_CASES;
  const fixture = await createFixture(corpus, isPublicCorpus ? "Public incident-response" : "Golden");
  try {
    const results: CaseResult[] = [];
    const pendingJudges: PendingJudge[] = [];
    const skipFaithfulness = process.env.NEXUS_EVAL_SKIP_FAITHFULNESS === "1";
    const selectedCaseIds = new Set((process.env.NEXUS_EVAL_CASE_IDS || "").split(",").map((id) => id.trim()).filter(Boolean));
    const selectedCases = selectedCaseIds.size ? cases.filter((item) => selectedCaseIds.has(item.id)) : cases;
    for (const item of selectedCases) {
      const response = await askKnowledge({ userId: fixture.userId, orgId: fixture.orgId, question: item.question, collectionIds: [fixture.collectionId] });
      const retrievedDocumentIds = Object.entries(fixture.documentSourceIds)
        .filter(([, sourceId]) => response.citations.some((citation) => citation.sourceId === sourceId))
        .map(([documentId]) => documentId);
      const expected = new Set(item.expectedDocumentIds);
      const matching = retrievedDocumentIds.filter((documentId) => expected.has(documentId));
      const precisionAt5 = expected.size ? matching.length / Math.min(5, Math.max(1, retrievedDocumentIds.length)) : null;
      const recallAt10 = expected.size ? matching.length / expected.size : null;
      const abstainedCorrectly = item.category === "unanswerable"
        ? !response.sufficientContext && /sufficient information/i.test(response.answer)
        : null;
      const result: CaseResult = {
        id: item.id, category: item.category, expectedDocumentIds: item.expectedDocumentIds, retrievedDocumentIds,
        precisionAt5, recallAt10, abstainedCorrectly,
        faithfulness: item.category === "unanswerable"
          ? { supported: abstainedCorrectly === true, rationale: "Checked abstention wording for an intentionally unanswerable case." }
          : { supported: false, rationale: "Faithfulness review pending." },
        latencyMs: response.latencyMs, answer: response.answer,
      };
      results.push(result);
      if (item.category !== "unanswerable" && !skipFaithfulness) pendingJudges.push({ item, result, excerpts: response.citations.map((citation) => citation.excerpt) });
    }
    for (const { item, result, excerpts } of pendingJudges) {
      result.faithfulness = await judgeFaithfulness(item, result.answer, excerpts);
    }
    const answerable = results.filter((result) => result.precisionAt5 !== null && result.recallAt10 !== null);
    const unanswerable = results.filter((result) => result.abstainedCorrectly !== null);
    const sortedLatencies = results.map((result) => result.latencyMs).sort((first, second) => first - second);
    const summary: EvaluationSummary = {
      answerableCases: answerable.length,
      precisionAt5: answerable.reduce((sum, result) => sum + (result.precisionAt5 ?? 0), 0) / answerable.length,
      recallAt10: answerable.reduce((sum, result) => sum + (result.recallAt10 ?? 0), 0) / answerable.length,
      faithfulness: answerable.filter((result) => result.faithfulness.supported).length / answerable.length,
      abstentionAccuracy: unanswerable.filter((result) => result.abstainedCorrectly).length / unanswerable.length,
      p95LatencyMs: sortedLatencies[Math.max(0, Math.ceil(sortedLatencies.length * 0.95) - 1)] ?? 0,
      faithfulnessJudgeUnavailableCases: answerable.filter((result) => /judge returned (invalid JSON|no text content)/i.test(result.faithfulness.rationale)).length,
    };
    return { results, summary };
  } finally {
    await cleanupFixture(fixture);
  }
}

if (process.argv[1]?.endsWith("goldenEvaluation.ts")) {
  runGoldenEvaluation()
    .then((report) => {
      const compact = process.env.NEXUS_EVAL_SUMMARY_ONLY === "1";
      const includeAnswers = process.env.NEXUS_EVAL_INCLUDE_ANSWERS === "1";
      const includeRetrievals = process.env.NEXUS_EVAL_INCLUDE_RETRIEVALS === "1";
      console.log(JSON.stringify(compact
        ? {
            summary: report.summary,
            failedFaithfulnessCaseIds: report.results.filter((result) => !result.faithfulness.supported).map((result) => result.id),
            failedAbstentionCaseIds: report.results.filter((result) => result.abstainedCorrectly === false).map((result) => result.id),
            ...(includeAnswers ? { answers: report.results.map((result) => ({ id: result.id, answer: result.answer, faithfulness: result.faithfulness })) } : {}),
            ...(includeRetrievals ? { retrievals: report.results.map((result) => ({ id: result.id, expectedDocumentIds: result.expectedDocumentIds, retrievedDocumentIds: result.retrievedDocumentIds, precisionAt5: result.precisionAt5, recallAt10: result.recallAt10 })) } : {}),
          }
        : {
            summary: report.summary,
            results: report.results.map(({ answer, ...result }) => result),
          }, null, 2));
      process.exit(0);
    })
    .catch((error) => { console.error(error); process.exit(1); });
}
