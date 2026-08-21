import express from "express";
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { apiKeyUsage, auditEvents, chunks, collections, organizationApiKeys, organizationMemberships, organizationPolicies, organizations, queries, queryCitations, sources, users } from "../../drizzle/schema";
import { createLocalEmbedding } from "./retrieval";
import { createServiceApiKey, revokeServiceApiKey } from "./service";
import { registerNexusApiRoutes } from "./api";

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({ choices: [{ message: { content: "The recovery guide requires a named owner. [1]" } }] })),
}));

const created = { orgIds: [] as number[], userIds: [] as number[] };

async function cleanup() {
  const db = await getDb();
  if (!db || !created.orgIds.length) return;
  await db.delete(apiKeyUsage).where(inArray(apiKeyUsage.orgId, created.orgIds));
  await db.delete(organizationApiKeys).where(inArray(organizationApiKeys.orgId, created.orgIds));
  await db.delete(queryCitations).where(inArray(queryCitations.orgId, created.orgIds));
  await db.delete(queries).where(inArray(queries.orgId, created.orgIds));
  await db.delete(chunks).where(inArray(chunks.orgId, created.orgIds));
  await db.delete(sources).where(inArray(sources.orgId, created.orgIds));
  await db.delete(auditEvents).where(inArray(auditEvents.orgId, created.orgIds));
  await db.delete(organizationPolicies).where(inArray(organizationPolicies.orgId, created.orgIds));
  await db.delete(organizationMemberships).where(inArray(organizationMemberships.orgId, created.orgIds));
  await db.delete(collections).where(inArray(collections.orgId, created.orgIds));
  await db.delete(organizations).where(inArray(organizations.id, created.orgIds));
  await db.delete(users).where(inArray(users.id, created.userIds));
  created.orgIds.splice(0);
  created.userIds.splice(0);
}

afterEach(cleanup);

async function listen(app: express.Express) {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not expose a TCP address.");
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function close(server: Server) {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

describe.skipIf(!process.env.DATABASE_URL)("NEXUS service API endpoint", () => {
  it("enforces bearer authentication and quota while persisting only usage metadata", async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is configured but the test database is unavailable.");
    const suffix = randomUUID().slice(0, 12);
    const user = await db.insert(users).values({ openId: `qa-api-endpoint-${suffix}`, name: "QA API Endpoint", email: `qa-api-endpoint-${suffix}@example.test` });
    const userId = Number(user[0].insertId);
    created.userIds.push(userId);
    const org = await db.insert(organizations).values({ name: `QA endpoint ${suffix}`, slug: `qa-endpoint-${suffix}` });
    const orgId = Number(org[0].insertId);
    created.orgIds.push(orgId);
    await db.insert(organizationMemberships).values({ orgId, userId, role: "owner" });
    await db.insert(organizationPolicies).values({ orgId, queryRateLimitPerMinute: 20 });
    const collection = await db.insert(collections).values({ orgId, name: "Endpoint knowledge" });
    const collectionId = Number(collection[0].insertId);
    const text = "The recovery guide requires a named owner to approve and document every rollback.";
    const source = await db.insert(sources).values({ orgId, collectionId, createdByUserId: userId, type: "text", name: "Recovery guide", contentHash: `endpoint-source-${suffix}`, extractedText: text, status: "indexed" });
    const sourceId = Number(source[0].insertId);
    await db.insert(chunks).values({ orgId, sourceId, collectionId, text, title: "Recovery guide", sectionPath: "Rollback", ordinal: 0, tokenCount: 12, charOffsetStart: 0, charOffsetEnd: text.length, contentHash: `endpoint-chunk-${suffix}`, embeddingJson: JSON.stringify(createLocalEmbedding(text)) });
    const key = await createServiceApiKey({ userId, orgId, label: "Endpoint QA", rateLimitPerMinute: 1 });

    const app = express();
    app.use(express.json());
    registerNexusApiRoutes(app);
    const { server, baseUrl } = await listen(app);
    try {
      const accepted = await fetch(`${baseUrl}/api/v1/query`, { method: "POST", headers: { authorization: `Bearer ${key.key}`, "content-type": "application/json" }, body: JSON.stringify({ question: "Who must approve a rollback?" }) });
      expect(accepted.status).toBe(200);
      const payload = await accepted.json() as { answer: string; citations: Array<{ sourceId: number }> };
      expect(payload.answer).toContain("[1]");
      expect(payload.citations[0]?.sourceId).toBe(sourceId);

      const quota = await fetch(`${baseUrl}/api/v1/query`, { method: "POST", headers: { authorization: `Bearer ${key.key}`, "content-type": "application/json" }, body: JSON.stringify({ question: "Who must approve a rollback?" }) });
      expect(quota.status).toBe(429);
      const usage = await db.select().from(apiKeyUsage).where(and(eq(apiKeyUsage.orgId, orgId), eq(apiKeyUsage.apiKeyId, key.id)));
      expect(usage).toHaveLength(1);
      expect(usage[0]?.statusCode).toBe(200);

      await revokeServiceApiKey({ userId, orgId, apiKeyId: key.id });
      const revoked = await fetch(`${baseUrl}/api/v1/query`, { method: "POST", headers: { authorization: `Bearer ${key.key}`, "content-type": "application/json" }, body: JSON.stringify({ question: "Who must approve a rollback?" }) });
      expect(revoked.status).toBe(401);

      const noScopeKey = await createServiceApiKey({ userId, orgId, label: "No scope QA", rateLimitPerMinute: 3 });
      await db.update(organizationApiKeys).set({ scopesJson: "[]" }).where(eq(organizationApiKeys.id, noScopeKey.id));
      const insufficientScope = await fetch(`${baseUrl}/api/v1/query`, { method: "POST", headers: { authorization: `Bearer ${noScopeKey.key}`, "content-type": "application/json" }, body: JSON.stringify({ question: "Who must approve a rollback?" }) });
      expect(insufficientScope.status).toBe(403);
      const audit = await db.select().from(auditEvents).where(eq(auditEvents.orgId, orgId));
      expect(audit.map((event) => event.action)).toEqual(expect.arrayContaining(["api_key.created", "api_key.revoked"]));
    } finally {
      await close(server);
    }
  }, 25_000);
});
