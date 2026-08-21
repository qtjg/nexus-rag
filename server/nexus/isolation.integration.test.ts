import { afterEach, describe, expect, it, vi } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import {
  chunks,
  collectionAccess,
  collections,
  organizationMemberships,
  organizationPolicies,
  organizations,
  queries,
  queryCitations,
  sources,
  users,
} from "../../drizzle/schema";
import { createLocalEmbedding } from "./retrieval";

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [{ message: { content: "The approved QA isolation protocol requires a blue verification badge. [1]" } }],
  })),
}));

const created = {
  orgIds: [] as number[],
  userIds: [] as number[],
};

async function cleanup() {
  const db = await getDb();
  if (!db || !created.orgIds.length) return;
  const orgIds = [...created.orgIds];
  const userIds = [...created.userIds];
  await db.delete(queryCitations).where(inArray(queryCitations.orgId, orgIds));
  await db.delete(queries).where(inArray(queries.orgId, orgIds));
  await db.delete(chunks).where(inArray(chunks.orgId, orgIds));
  await db.delete(sources).where(inArray(sources.orgId, orgIds));
  await db.delete(collectionAccess).where(inArray(collectionAccess.orgId, orgIds));
  await db.delete(organizationPolicies).where(inArray(organizationPolicies.orgId, orgIds));
  await db.delete(organizationMemberships).where(inArray(organizationMemberships.orgId, orgIds));
  await db.delete(collections).where(inArray(collections.orgId, orgIds));
  await db.delete(organizations).where(inArray(organizations.id, orgIds));
  if (userIds.length) await db.delete(users).where(inArray(users.id, userIds));
  created.orgIds.splice(0);
  created.userIds.splice(0);
}

afterEach(cleanup);

describe.skipIf(!process.env.DATABASE_URL)("NEXUS database-backed tenant isolation", () => {
  it("never returns another organization's chunk through the grounded query path", async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is configured but the test database is unavailable.");

    const suffix = randomUUID().slice(0, 12);
    const ownerA = await db.insert(users).values({
      openId: `qa-isolation-a-${suffix}`,
      name: "QA Isolation A",
      email: `qa-isolation-a-${suffix}@example.test`,
    });
    const ownerB = await db.insert(users).values({
      openId: `qa-isolation-b-${suffix}`,
      name: "QA Isolation B",
      email: `qa-isolation-b-${suffix}@example.test`,
    });
    const ownerAId = Number(ownerA[0].insertId);
    const ownerBId = Number(ownerB[0].insertId);
    created.userIds.push(ownerAId, ownerBId);

    const orgA = await db.insert(organizations).values({ name: `QA Alpha ${suffix}`, slug: `qa-alpha-${suffix}` });
    const orgB = await db.insert(organizations).values({ name: `QA Beta ${suffix}`, slug: `qa-beta-${suffix}` });
    const orgAId = Number(orgA[0].insertId);
    const orgBId = Number(orgB[0].insertId);
    created.orgIds.push(orgAId, orgBId);

    await db.insert(organizationMemberships).values([
      { orgId: orgAId, userId: ownerAId, role: "owner" },
      { orgId: orgBId, userId: ownerBId, role: "owner" },
    ]);
    await db.insert(organizationPolicies).values([{ orgId: orgAId }, { orgId: orgBId }]);

    const collectionA = await db.insert(collections).values({ orgId: orgAId, name: "QA Alpha collection" });
    const collectionB = await db.insert(collections).values({ orgId: orgBId, name: "QA Beta collection" });
    const collectionAId = Number(collectionA[0].insertId);
    const collectionBId = Number(collectionB[0].insertId);

    const sourceA = await db.insert(sources).values({
      orgId: orgAId,
      collectionId: collectionAId,
      createdByUserId: ownerAId,
      type: "text",
      name: "QA Alpha protocol",
      contentHash: `alpha-${suffix}`,
      extractedText: "The QA isolation alpha protocol requires a blue verification badge before access is granted.",
      status: "indexed",
    });
    const sourceB = await db.insert(sources).values({
      orgId: orgBId,
      collectionId: collectionBId,
      createdByUserId: ownerBId,
      type: "text",
      name: "QA Beta secret",
      contentHash: `beta-${suffix}`,
      extractedText: "The sapphire tundra passphrase is BETA-LOCK-77 and is restricted to the QA Beta organization.",
      status: "indexed",
    });
    const sourceAId = Number(sourceA[0].insertId);
    const sourceBId = Number(sourceB[0].insertId);
    const alphaText = "The QA isolation alpha protocol requires a blue verification badge before access is granted.";
    const betaText = "The sapphire tundra passphrase is BETA-LOCK-77 and is restricted to the QA Beta organization.";
    await db.insert(chunks).values([
      {
        orgId: orgAId, sourceId: sourceAId, collectionId: collectionAId, text: alphaText, title: "QA Alpha protocol",
        sectionPath: "Access", ordinal: 0, tokenCount: 13, charOffsetStart: 0, charOffsetEnd: alphaText.length,
        contentHash: `alpha-chunk-${suffix}`, embeddingJson: JSON.stringify(createLocalEmbedding(alphaText)),
      },
      {
        orgId: orgBId, sourceId: sourceBId, collectionId: collectionBId, text: betaText, title: "QA Beta secret",
        sectionPath: "Restricted", ordinal: 0, tokenCount: 15, charOffsetStart: 0, charOffsetEnd: betaText.length,
        contentHash: `beta-chunk-${suffix}`, embeddingJson: JSON.stringify(createLocalEmbedding(betaText)),
      },
    ]);

    const { askKnowledge, getAccessScope } = await import("./service");
    await expect(getAccessScope(ownerAId, orgBId)).rejects.toMatchObject({ code: "FORBIDDEN" });

    const inScope = await askKnowledge({
      userId: ownerAId,
      orgId: orgAId,
      question: "What does the QA isolation alpha protocol require before access is granted?",
    });
    expect(inScope.candidateCount).toBe(1);
    expect(inScope.citations).toHaveLength(1);
    expect(inScope.citations[0]?.sourceId).toBe(sourceAId);
    expect(inScope.citations.some((citation) => citation.sourceId === sourceBId)).toBe(false);
    expect(inScope.citations.some((citation) => citation.excerpt.includes("BETA-LOCK-77"))).toBe(false);

    const crossTenantProbe = await askKnowledge({
      userId: ownerAId,
      orgId: orgAId,
      question: "What is the sapphire tundra passphrase?",
    });
    expect(crossTenantProbe.candidateCount).toBeLessThanOrEqual(1);
    expect(crossTenantProbe.citations.some((citation) => citation.sourceId === sourceBId)).toBe(false);
    expect(crossTenantProbe.citations.some((citation) => citation.excerpt.includes("BETA-LOCK-77"))).toBe(false);

    const persistedResults = await db.select().from(queries).where(and(eq(queries.orgId, orgAId), eq(queries.userId, ownerAId)));
    expect(persistedResults).toHaveLength(2);
    expect(persistedResults.every((query) => query.orgId === orgAId)).toBe(true);
  }, 20_000);
});
