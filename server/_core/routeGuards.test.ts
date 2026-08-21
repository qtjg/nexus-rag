import express, { type Express } from "express";
import { afterEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { registerNexusScheduledRoutes } from "../nexus/scheduled";
import { registerStorageProxy } from "./storageProxy";

const runningServers: Server[] = [];

async function withServer(app: Express) {
  const server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  runningServers.push(server);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind to a TCP port.");
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all(runningServers.splice(0).map((server) => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))));
});

describe("NEXUS route guards", () => {
  it("returns a bad-request response when the storage key is missing", async () => {
    const app = express();
    registerStorageProxy(app);
    const baseUrl = await withServer(app);

    const response = await fetch(`${baseUrl}/manus-storage/`);

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain("Missing storage key");
  });

  it("rejects traversal-shaped storage keys before requesting a signed URL", async () => {
    const app = express();
    registerStorageProxy(app);
    const baseUrl = await withServer(app);

    const response = await fetch(`${baseUrl}/manus-storage/%2E%2E%2Fprivate%2Fobject`);

    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toContain("Invalid storage key");
  });

  it("rejects an ingestion retry callback without cron authentication", async () => {
    const app = express();
    registerNexusScheduledRoutes(app);
    const baseUrl = await withServer(app);

    const response = await fetch(`${baseUrl}/api/scheduled/ingestion-retry`, { method: "POST" });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid session cookie" });
  });
});
