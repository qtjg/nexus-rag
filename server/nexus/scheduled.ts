import type { Express, Request, Response } from "express";
import { HttpError } from "@shared/_core/errors";
import { sdk } from "../_core/sdk";
import { processDueIngestionJobs } from "./service";

export function registerNexusScheduledRoutes(app: Express) {
  app.post("/api/scheduled/ingestion-retry", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const result = await processDueIngestionJobs();
      return res.json({ ok: true, taskUid: user.taskUid, ...result });
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      const message = error instanceof Error ? error.message : "Scheduled ingestion retry failed";
      return res.status(500).json({ error: message, context: { path: "/api/scheduled/ingestion-retry" }, timestamp: new Date().toISOString() });
    }
  });
}
