import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookie } from "cookie";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { askKnowledge, configureEnterpriseSso, configureIngestionRetrySchedule, createCollection, createConnectorConfiguration, createServiceApiKey, decideReleaseApproval, deleteConnectorConfiguration, getOrganizationAnalytics, getWorkspace, ingestFileSource, ingestTextSource, inviteMember, listServiceApiKeys, removeSource, replayIngestionJob, revokeInvitation, revokeMember, revokeServiceApiKey, rotateServiceApiKey, setConnectorConfigurationState, submitFeedback, updateMemberAccess, updateOrganizationPolicy } from "./nexus/service";

const orgInput = z.object({ orgId: z.number().int().positive() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  nexus: router({
    workspace: protectedProcedure.query(({ ctx }) => getWorkspace(ctx.user)),
    createCollection: protectedProcedure.input(orgInput.extend({ name: z.string().trim().min(2).max(160), description: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => createCollection(ctx.user.id, input.orgId, input.name, input.description)),
    ingestText: protectedProcedure.input(orgInput.extend({ collectionId: z.number().int().positive(), name: z.string().trim().min(1).max(255), content: z.string().trim().min(1).max(2_000_000), sourceUrl: z.string().url().optional(), type: z.enum(["text", "url", "code"]).default("text") })).mutation(({ ctx, input }) => ingestTextSource({ ...input, userId: ctx.user.id })),
    ingestFile: protectedProcedure.input(orgInput.extend({ collectionId: z.number().int().positive(), name: z.string().trim().min(1).max(255), mimeType: z.string().trim().min(1).max(160), base64: z.string().min(1).max(35_000_000) })).mutation(({ ctx, input }) => ingestFileSource({ userId: ctx.user.id, orgId: input.orgId, collectionId: input.collectionId, name: input.name, mimeType: input.mimeType, bytes: Buffer.from(input.base64, "base64") })),
    deleteSource: protectedProcedure.input(orgInput.extend({ sourceId: z.number().int().positive() })).mutation(({ ctx, input }) => removeSource(ctx.user.id, input.orgId, input.sourceId)),
    replayIngestion: protectedProcedure.input(orgInput.extend({ jobId: z.number().int().positive() })).mutation(({ ctx, input }) => replayIngestionJob(ctx.user.id, input.orgId, input.jobId)),
    configureIngestionRetry: protectedProcedure.input(orgInput).mutation(({ ctx, input }) => configureIngestionRetrySchedule({ userId: ctx.user.id, orgId: input.orgId, sessionToken: parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "" })),
    configureSso: protectedProcedure.input(orgInput.extend({ providerType: z.enum(["workos", "oidc", "saml"]), connectionReference: z.string().trim().max(160).optional(), verifiedDomains: z.array(z.string().trim().min(3).max(253)).max(20), roleMapping: z.record(z.string().trim().min(1).max(120), z.enum(["admin", "member", "viewer"])), enforceSso: z.boolean().default(false) })).mutation(({ ctx, input }) => configureEnterpriseSso({ ...input, userId: ctx.user.id })),
    apiKeys: protectedProcedure.input(orgInput).query(({ ctx, input }) => listServiceApiKeys(ctx.user.id, input.orgId)),
    createApiKey: protectedProcedure.input(orgInput.extend({ label: z.string().trim().min(2).max(120), rateLimitPerMinute: z.number().int().min(1).max(120), expiresAt: z.date().optional() })).mutation(({ ctx, input }) => createServiceApiKey({ ...input, userId: ctx.user.id })),
    revokeApiKey: protectedProcedure.input(orgInput.extend({ apiKeyId: z.number().int().positive() })).mutation(({ ctx, input }) => revokeServiceApiKey({ ...input, userId: ctx.user.id })),
    rotateApiKey: protectedProcedure.input(orgInput.extend({ apiKeyId: z.number().int().positive() })).mutation(({ ctx, input }) => rotateServiceApiKey({ ...input, userId: ctx.user.id })),
    createConnector: protectedProcedure.input(orgInput.extend({ collectionId: z.number().int().positive(), providerType: z.enum(["notion", "google_drive", "confluence", "sharepoint", "custom_api"]), syncMode: z.enum(["manual", "incremental"]), connectionReference: z.string().trim().max(160).optional(), externalScope: z.string().trim().max(500).optional() })).mutation(({ ctx, input }) => createConnectorConfiguration({ ...input, userId: ctx.user.id })),
    updateConnectorState: protectedProcedure.input(orgInput.extend({ connectorId: z.number().int().positive(), state: z.enum(["paused", "disconnected"]) })).mutation(({ ctx, input }) => setConnectorConfigurationState({ ...input, userId: ctx.user.id })),
    deleteConnector: protectedProcedure.input(orgInput.extend({ connectorId: z.number().int().positive() })).mutation(({ ctx, input }) => deleteConnectorConfiguration({ ...input, userId: ctx.user.id })),
    analytics: protectedProcedure.input(orgInput.extend({ days: z.number().int().min(1).max(90).default(14) })).query(({ ctx, input }) => getOrganizationAnalytics({ ...input, userId: ctx.user.id })),
    decideReleaseApproval: protectedProcedure.input(orgInput).mutation(({ ctx, input }) => decideReleaseApproval(ctx.user, input.orgId)),
    updatePolicy: protectedProcedure.input(orgInput.extend({ urlIngestionEnabled: z.boolean().optional(), safetyRestrictionsEnabled: z.boolean().optional(), sourceRetentionDays: z.number().int().min(1).max(3650).optional(), queryRateLimitPerMinute: z.number().int().min(1).max(120).optional() })).mutation(({ ctx, input }) => updateOrganizationPolicy({ ...input, userId: ctx.user.id })),
    inviteMember: protectedProcedure.input(orgInput.extend({ email: z.string().trim().email().max(320), role: z.enum(["admin", "member", "viewer"]), collectionIds: z.array(z.number().int().positive()).max(100) })).mutation(({ ctx, input }) => inviteMember({ ...input, userId: ctx.user.id })),
    updateMember: protectedProcedure.input(orgInput.extend({ memberUserId: z.number().int().positive(), role: z.enum(["admin", "member", "viewer"]), collectionIds: z.array(z.number().int().positive()).max(100) })).mutation(({ ctx, input }) => updateMemberAccess({ ...input, userId: ctx.user.id })),
    revokeMember: protectedProcedure.input(orgInput.extend({ memberUserId: z.number().int().positive() })).mutation(({ ctx, input }) => revokeMember({ ...input, userId: ctx.user.id })),
    revokeInvitation: protectedProcedure.input(orgInput.extend({ invitationId: z.number().int().positive() })).mutation(({ ctx, input }) => revokeInvitation({ ...input, userId: ctx.user.id })),
    ask: protectedProcedure.input(orgInput.extend({ question: z.string().trim().min(3).max(4_000), collectionIds: z.array(z.number().int().positive()).max(30).optional() })).mutation(({ ctx, input }) => askKnowledge({ ...input, userId: ctx.user.id })),
    feedback: protectedProcedure.input(orgInput.extend({ queryId: z.number().int().positive(), rating: z.enum(["up", "down"]), reason: z.string().trim().max(120).optional() })).mutation(({ ctx, input }) => submitFeedback({ ...input, userId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
