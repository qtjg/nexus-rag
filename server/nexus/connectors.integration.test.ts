import { afterEach, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb } from "../db";
import { collections, connectorConfigurations, connectorSyncRuns, organizationMemberships, organizationPolicies, organizations, users } from "../../drizzle/schema";
import { createConnectorConfiguration, deleteConnectorConfiguration, setConnectorConfigurationState } from "./service";

const created = { orgIds: [] as number[], userIds: [] as number[] };
async function cleanup() {
  const db = await getDb();
  if (!db || !created.orgIds.length) return;
  await db.delete(connectorSyncRuns).where(inArray(connectorSyncRuns.orgId, created.orgIds));
  await db.delete(connectorConfigurations).where(inArray(connectorConfigurations.orgId, created.orgIds));
  await db.delete(organizationPolicies).where(inArray(organizationPolicies.orgId, created.orgIds));
  await db.delete(organizationMemberships).where(inArray(organizationMemberships.orgId, created.orgIds));
  await db.delete(collections).where(inArray(collections.orgId, created.orgIds));
  await db.delete(organizations).where(inArray(organizations.id, created.orgIds));
  await db.delete(users).where(inArray(users.id, created.userIds));
  created.orgIds.splice(0); created.userIds.splice(0);
}
afterEach(cleanup);

describe.skipIf(!process.env.DATABASE_URL)("NEXUS governed connectors", () => {
  it("creates collection-scoped drafts with blocked provenance, rejects viewers, and supports disconnect", async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is configured but the test database is unavailable.");
    const suffix = randomUUID().slice(0, 12);
    const owner = await db.insert(users).values({ openId: `qa-connector-owner-${suffix}`, name: "QA Connector Owner", email: `qa-connector-owner-${suffix}@example.test` });
    const viewer = await db.insert(users).values({ openId: `qa-connector-viewer-${suffix}`, name: "QA Connector Viewer", email: `qa-connector-viewer-${suffix}@example.test` });
    const ownerId = Number(owner[0].insertId); const viewerId = Number(viewer[0].insertId); created.userIds.push(ownerId, viewerId);
    const org = await db.insert(organizations).values({ name: `QA connector ${suffix}`, slug: `qa-connector-${suffix}` });
    const orgId = Number(org[0].insertId); created.orgIds.push(orgId);
    await db.insert(organizationMemberships).values([{ orgId, userId: ownerId, role: "owner" }, { orgId, userId: viewerId, role: "viewer" }]);
    await db.insert(organizationPolicies).values({ orgId });
    const collection = await db.insert(collections).values({ orgId, name: "Approved connector scope" });
    const collectionId = Number(collection[0].insertId);
    const connector = await createConnectorConfiguration({ userId: ownerId, orgId, collectionId, providerType: "notion", syncMode: "incremental", connectionReference: "workspace_qa", externalScope: "approved pages" });
    expect(connector.status).toBe("draft");
    const runs = await db.select().from(connectorSyncRuns).where(inArray(connectorSyncRuns.orgId, [orgId]));
    expect(runs[0]).toMatchObject({ connectorConfigurationId: connector.id, status: "blocked", errorCode: "EXTERNAL_APPROVAL_REQUIRED" });
    await expect(createConnectorConfiguration({ userId: viewerId, orgId, collectionId, providerType: "notion", syncMode: "manual" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await setConnectorConfigurationState({ userId: ownerId, orgId, connectorId: connector.id, state: "disconnected" });
    const stored = (await db.select().from(connectorConfigurations).where(inArray(connectorConfigurations.orgId, [orgId])))[0];
    expect(stored?.status).toBe("disconnected");
    expect(stored?.disconnectedAt).not.toBeNull();
    await deleteConnectorConfiguration({ userId: ownerId, orgId, connectorId: connector.id });
    expect(await db.select().from(connectorConfigurations).where(inArray(connectorConfigurations.orgId, [orgId]))).toHaveLength(0);
    expect(await db.select().from(connectorSyncRuns).where(inArray(connectorSyncRuns.orgId, [orgId]))).toHaveLength(0);
  }, 20_000);
});
