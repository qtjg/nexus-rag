import { afterEach, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import { apiKeyUsage, organizationApiKeys, organizationMemberships, organizationPolicies, organizations, users } from "../../drizzle/schema";
import { authenticateServiceApiKey, createServiceApiKey, revokeServiceApiKey, rotateServiceApiKey } from "./service";

const created = { orgIds: [] as number[], userIds: [] as number[] };

async function cleanup() {
  const db = await getDb();
  if (!db || !created.orgIds.length) return;
  await db.delete(apiKeyUsage).where(inArray(apiKeyUsage.orgId, created.orgIds));
  await db.delete(organizationApiKeys).where(inArray(organizationApiKeys.orgId, created.orgIds));
  await db.delete(organizationPolicies).where(inArray(organizationPolicies.orgId, created.orgIds));
  await db.delete(organizationMemberships).where(inArray(organizationMemberships.orgId, created.orgIds));
  await db.delete(organizations).where(inArray(organizations.id, created.orgIds));
  await db.delete(users).where(inArray(users.id, created.userIds));
  created.orgIds.splice(0);
  created.userIds.splice(0);
}

afterEach(cleanup);

describe.skipIf(!process.env.DATABASE_URL)("NEXUS service API keys", () => {
  it("stores only a hash, authenticates an active scoped key, rejects viewers, and blocks a revoked key", async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is configured but the test database is unavailable.");
    const suffix = randomUUID().slice(0, 12);
    const owner = await db.insert(users).values({ openId: `qa-api-owner-${suffix}`, name: "QA API Owner", email: `qa-api-owner-${suffix}@example.test` });
    const viewer = await db.insert(users).values({ openId: `qa-api-viewer-${suffix}`, name: "QA API Viewer", email: `qa-api-viewer-${suffix}@example.test` });
    const ownerId = Number(owner[0].insertId);
    const viewerId = Number(viewer[0].insertId);
    created.userIds.push(ownerId, viewerId);
    const org = await db.insert(organizations).values({ name: `QA API ${suffix}`, slug: `qa-api-${suffix}` });
    const orgId = Number(org[0].insertId);
    created.orgIds.push(orgId);
    await db.insert(organizationMemberships).values([{ orgId, userId: ownerId, role: "owner" }, { orgId, userId: viewerId, role: "viewer" }]);
    await db.insert(organizationPolicies).values({ orgId });

    const createdKey = await createServiceApiKey({ userId: ownerId, orgId, label: "QA client", rateLimitPerMinute: 7 });
    expect(createdKey.key).toMatch(/^nxk_/);
    const stored = (await db.select().from(organizationApiKeys).where(inArray(organizationApiKeys.orgId, [orgId])))[0];
    expect(stored?.secretHash).not.toContain(createdKey.key);
    const authenticated = await authenticateServiceApiKey(createdKey.key);
    expect(authenticated.orgId).toBe(orgId);
    expect(authenticated.scopes).toEqual(["query:read"]);
    await expect(createServiceApiKey({ userId: viewerId, orgId, label: "Viewer key", rateLimitPerMinute: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const replacement = await rotateServiceApiKey({ userId: ownerId, orgId, apiKeyId: createdKey.id });
    await expect(authenticateServiceApiKey(createdKey.key)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect((await authenticateServiceApiKey(replacement.key)).id).toBe(replacement.id);
    await revokeServiceApiKey({ userId: ownerId, orgId, apiKeyId: replacement.id });
    await expect(authenticateServiceApiKey(replacement.key)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  }, 20_000);
});
