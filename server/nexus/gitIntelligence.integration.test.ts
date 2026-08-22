import { afterEach, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { chunks, collectionAccess, collections, gitRepositorySnapshots, gitReviewFindings, gitReviewRuns, ingestionJobs, organizationMemberships, organizationPolicies, organizations, sources, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { createGitRepositorySnapshot, getGitReviewHistory, reviewGitRepositorySnapshot } from "./service";

const created = { orgIds: [] as number[], userIds: [] as number[], collectionIds: [] as number[] };

async function cleanup() {
  const db = await getDb();
  if (!db || !created.orgIds.length) return;
  const snapshotIds = (await db.select({ id: gitRepositorySnapshots.id }).from(gitRepositorySnapshots).where(inArray(gitRepositorySnapshots.orgId, created.orgIds))).map((row) => row.id);
  if (snapshotIds.length) {
    await db.delete(gitReviewFindings).where(inArray(gitReviewFindings.snapshotId, snapshotIds));
    await db.delete(gitReviewRuns).where(inArray(gitReviewRuns.snapshotId, snapshotIds));
  }
  await db.delete(gitRepositorySnapshots).where(inArray(gitRepositorySnapshots.orgId, created.orgIds));
  const sourceIds = (await db.select({ id: sources.id }).from(sources).where(inArray(sources.orgId, created.orgIds))).map((row) => row.id);
  if (sourceIds.length) {
    await db.delete(chunks).where(inArray(chunks.sourceId, sourceIds));
    await db.delete(ingestionJobs).where(inArray(ingestionJobs.sourceId, sourceIds));
  }
  await db.delete(sources).where(inArray(sources.orgId, created.orgIds));
  await db.delete(collectionAccess).where(inArray(collectionAccess.orgId, created.orgIds));
  await db.delete(collections).where(inArray(collections.orgId, created.orgIds));
  await db.delete(organizationPolicies).where(inArray(organizationPolicies.orgId, created.orgIds));
  await db.delete(organizationMemberships).where(inArray(organizationMemberships.orgId, created.orgIds));
  await db.delete(organizations).where(inArray(organizations.id, created.orgIds));
  await db.delete(users).where(inArray(users.id, created.userIds));
  created.orgIds.splice(0);
  created.userIds.splice(0);
  created.collectionIds.splice(0);
}

afterEach(cleanup);

describe.skipIf(!process.env.DATABASE_URL)("NEXUS Git intelligence", () => {
  it("persists a collection-scoped diff, records cited findings, and blocks cross-organization review access", async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is configured but the test database is unavailable.");
    const suffix = randomUUID().slice(0, 12);
    const ownerA = await db.insert(users).values({ openId: `qa-git-owner-a-${suffix}`, name: "Git Owner A", email: `qa-git-owner-a-${suffix}@example.test` });
    const ownerB = await db.insert(users).values({ openId: `qa-git-owner-b-${suffix}`, name: "Git Owner B", email: `qa-git-owner-b-${suffix}@example.test` });
    const ownerAId = Number(ownerA[0].insertId);
    const ownerBId = Number(ownerB[0].insertId);
    created.userIds.push(ownerAId, ownerBId);
    const orgA = await db.insert(organizations).values({ name: `QA Git A ${suffix}`, slug: `qa-git-a-${suffix}` });
    const orgB = await db.insert(organizations).values({ name: `QA Git B ${suffix}`, slug: `qa-git-b-${suffix}` });
    const orgAId = Number(orgA[0].insertId);
    const orgBId = Number(orgB[0].insertId);
    created.orgIds.push(orgAId, orgBId);
    await db.insert(organizationMemberships).values([{ orgId: orgAId, userId: ownerAId, role: "owner" }, { orgId: orgBId, userId: ownerBId, role: "owner" }]);
    await db.insert(organizationPolicies).values([{ orgId: orgAId }, { orgId: orgBId }]);
    const collection = await db.insert(collections).values({ orgId: orgAId, name: `Git review ${suffix}` });
    const collectionId = Number(collection[0].insertId);
    created.collectionIds.push(collectionId);
    const snapshot = await createGitRepositorySnapshot({
      userId: ownerAId,
      orgId: orgAId,
      collectionId,
      repositoryLabel: "nexus-api",
      repositoryReference: "github.com/example/nexus-api",
      revision: "abc123",
      kind: "diff",
      content: "diff --git a/server/auth.ts b/server/auth.ts\n@@ -1 +1 @@\n+ const password = 'sensitive-demo-token'\n",
    });
    const review = await reviewGitRepositorySnapshot({ userId: ownerAId, orgId: orgAId, snapshotId: snapshot.id, mode: "deterministic" });
    expect(review.findings.some((finding) => finding.severity === "critical" && finding.evidence.includes("password"))).toBe(true);
    const history = await getGitReviewHistory({ userId: ownerAId, orgId: orgAId, snapshotId: snapshot.id });
    expect(history.runs).toHaveLength(1);
    expect(history.runs[0]?.findings[0]?.evidence).toContain("password");
    await expect(getGitReviewHistory({ userId: ownerBId, orgId: orgBId, snapshotId: snapshot.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
  }, 25_000);
});
