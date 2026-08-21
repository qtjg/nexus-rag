import { afterEach, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import { feedback, organizationMemberships, organizationPolicies, organizations, queries, users } from "../../drizzle/schema";
import { getOrganizationAnalytics } from "./service";

const created = { orgIds: [] as number[], userIds: [] as number[] };
async function cleanup() {
  const db = await getDb();
  if (!db || !created.orgIds.length) return;
  await db.delete(feedback).where(inArray(feedback.orgId, created.orgIds));
  await db.delete(queries).where(inArray(queries.orgId, created.orgIds));
  await db.delete(organizationPolicies).where(inArray(organizationPolicies.orgId, created.orgIds));
  await db.delete(organizationMemberships).where(inArray(organizationMemberships.orgId, created.orgIds));
  await db.delete(organizations).where(inArray(organizations.id, created.orgIds));
  await db.delete(users).where(inArray(users.id, created.userIds));
  created.orgIds.splice(0); created.userIds.splice(0);
}
afterEach(cleanup);

describe.skipIf(!process.env.DATABASE_URL)("NEXUS privacy-preserving analytics", () => {
  it("returns organization aggregates without raw prompt data and rejects viewers", async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is configured but the test database is unavailable.");
    const suffix = randomUUID().slice(0, 12);
    const owner = await db.insert(users).values({ openId: `qa-analytics-owner-${suffix}`, name: "QA Analytics Owner", email: `qa-analytics-owner-${suffix}@example.test` });
    const viewer = await db.insert(users).values({ openId: `qa-analytics-viewer-${suffix}`, name: "QA Analytics Viewer", email: `qa-analytics-viewer-${suffix}@example.test` });
    const ownerId = Number(owner[0].insertId); const viewerId = Number(viewer[0].insertId); created.userIds.push(ownerId, viewerId);
    const org = await db.insert(organizations).values({ name: `QA analytics ${suffix}`, slug: `qa-analytics-${suffix}` });
    const orgId = Number(org[0].insertId); created.orgIds.push(orgId);
    await db.insert(organizationMemberships).values([{ orgId, userId: ownerId, role: "owner" }, { orgId, userId: viewerId, role: "viewer" }]);
    await db.insert(organizationPolicies).values({ orgId });
    const query = await db.insert(queries).values({ orgId, userId: ownerId, questionText: "DO-NOT-EXPOSE-THIS-PROMPT", answerText: "A cited answer", sufficientContext: true, retrievedChunkIds: "[]", latencyMs: 420, traceId: `qa-trace-${suffix}`, pipelineFingerprint: "qa-pipeline" });
    const queryId = Number(query[0].insertId);
    await db.insert(feedback).values({ orgId, userId: ownerId, queryId, rating: "up" });
    const analytics = await getOrganizationAnalytics({ userId: ownerId, orgId, days: 14 });
    expect(analytics.querySummary).toMatchObject({ queryCount: 1, groundedRate: 100, averageLatencyMs: 420 });
    expect(analytics.feedback).toMatchObject({ up: 1 });
    expect(JSON.stringify(analytics)).not.toContain("DO-NOT-EXPOSE-THIS-PROMPT");
    await expect(getOrganizationAnalytics({ userId: viewerId, orgId, days: 14 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  }, 20_000);
});
