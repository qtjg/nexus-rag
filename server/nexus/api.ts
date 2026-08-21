import type { Express, Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { askKnowledge, authenticateServiceApiKey, recordServiceApiUsage } from "./service";

function sendApiError(res: Response, status: number, code: string, message: string) {
  return res.status(status).json({ error: { code, message } });
}

export function registerNexusApiRoutes(app: Express) {
  app.post("/api/v1/query", async (req: Request, res: Response) => {
    const startedAt = Date.now();
    const authorization = req.header("authorization") ?? "";
    const rawKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    let authenticated: Awaited<ReturnType<typeof authenticateServiceApiKey>> | null = null;
    try {
      authenticated = await authenticateServiceApiKey(rawKey);
      if (!authenticated.scopes.includes("query:read")) return sendApiError(res, 403, "insufficient_scope", "This API key is not allowed to read grounded answers.");
      const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
      const collectionIds = Array.isArray(req.body?.collectionIds) ? req.body.collectionIds.filter((id: unknown): id is number => typeof id === "number" && Number.isInteger(id) && id > 0).slice(0, 30) : undefined;
      if (question.length < 3 || question.length > 4_000) return sendApiError(res, 400, "invalid_request", "question must be between 3 and 4000 characters.");
      const result = await askKnowledge({ userId: authenticated.createdByUserId, orgId: authenticated.orgId, question, collectionIds });
      await recordServiceApiUsage({ orgId: authenticated.orgId, apiKeyId: authenticated.id, statusCode: 200, latencyMs: Date.now() - startedAt });
      return res.status(200).json({ answer: result.answer, sufficientContext: result.sufficientContext, traceId: result.traceId, latencyMs: result.latencyMs, citations: result.citations.map((citation) => ({ marker: citation.marker, sourceId: citation.sourceId, sourceName: citation.sourceName, sectionPath: citation.sectionPath, excerpt: citation.excerpt })) });
    } catch (error) {
      const statusByCode: Partial<Record<string, number>> = { UNAUTHORIZED: 401, FORBIDDEN: 403, TOO_MANY_REQUESTS: 429, BAD_REQUEST: 400, NOT_FOUND: 404, PRECONDITION_FAILED: 412 };
      const status = error instanceof TRPCError ? (statusByCode[error.code] ?? 500) : 500;
      const code = error instanceof TRPCError ? error.code.toLowerCase() : "internal_error";
      const message = error instanceof Error ? error.message : "The API request could not be completed.";
      if (authenticated) await recordServiceApiUsage({ orgId: authenticated.orgId, apiKeyId: authenticated.id, statusCode: status, latencyMs: Date.now() - startedAt });
      return sendApiError(res, status, code, message);
    }
  });
}
