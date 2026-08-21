import { afterEach, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import { organizationMemberships, organizationPolicies, organizationSsoConfigurations, organizations, users } from "../../drizzle/schema";
import { configureEnterpriseSso } from "./service";

const created = { orgIds: [] as number[], userIds: [] as number[] };

async function cleanup() {
  const db = await getDb();
  if (!db || !created.orgIds.length) return;
  await db.delete(organizationSsoConfigurations).where(inArray(organizationSsoConfigurations.orgId, created.orgIds));
  await db.delete(organizationPolicies).where(inArray(organizationPolicies.orgId, created.orgIds));
  await db.delete(organizationMemberships).where(inArray(organizationMemberships.orgId, created.orgIds));
  await db.delete(organizations).where(inArray(organizations.id, created.orgIds));
  await db.delete(users).where(inArray(users.id, created.userIds));
  created.orgIds.splice(0);
  created.userIds.splice(0);
}

afterEach(cleanup);

describe.skipIf(!process.env.DATABASE_URL)("NEXUS Enterprise SSO readiness", () => {
  it("persists a manager-owned draft, rejects viewers, and blocks enforcement before external approval", async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is configured but the test database is unavailable.");
    const suffix = randomUUID().slice(0, 12);
    const owner = await db.insert(users).values({ openId: `qa-sso-owner-${suffix}`, name: "QA SSO Owner", email: `qa-sso-owner-${suffix}@example.test` });
    const viewer = await db.insert(users).values({ openId: `qa-sso-viewer-${suffix}`, name: "QA SSO Viewer", email: `qa-sso-viewer-${suffix}@example.test` });
    const ownerId = Number(owner[0].insertId);
    const viewerId = Number(viewer[0].insertId);
    created.userIds.push(ownerId, viewerId);
    const org = await db.insert(organizations).values({ name: `QA SSO ${suffix}`, slug: `qa-sso-${suffix}` });
    const orgId = Number(org[0].insertId);
    created.orgIds.push(orgId);
    await db.insert(organizationMemberships).values([{ orgId, userId: ownerId, role: "owner" }, { orgId, userId: viewerId, role: "viewer" }]);
    await db.insert(organizationPolicies).values({ orgId });

    const saved = await configureEnterpriseSso({
      userId: ownerId,
      orgId,
      providerType: "workos",
      connectionReference: "conn_qa_readiness",
      verifiedDomains: ["Example.TEST", "research.example.test"],
      roleMapping: { "knowledge-admins": "admin", readers: "viewer" },
      enforceSso: false,
    });
    expect(saved.status).toBe("ready");
    expect(saved.enforceSso).toBe(false);
    expect(JSON.parse(saved.verifiedDomainsJson)).toEqual(["example.test", "research.example.test"]);
    await expect(configureEnterpriseSso({ userId: viewerId, orgId, providerType: "oidc", verifiedDomains: [], roleMapping: {}, enforceSso: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(configureEnterpriseSso({ userId: ownerId, orgId, providerType: "workos", verifiedDomains: ["example.test"], roleMapping: {}, enforceSso: true })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  }, 20_000);
});
