import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { askKnowledge, createCollection, getWorkspace, ingestTextSource, removeSource, submitFeedback } from "./nexus/service";

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
    deleteSource: protectedProcedure.input(orgInput.extend({ sourceId: z.number().int().positive() })).mutation(({ ctx, input }) => removeSource(ctx.user.id, input.orgId, input.sourceId)),
    ask: protectedProcedure.input(orgInput.extend({ question: z.string().trim().min(3).max(4_000), collectionIds: z.array(z.number().int().positive()).max(30).optional() })).mutation(({ ctx, input }) => askKnowledge({ ...input, userId: ctx.user.id })),
    feedback: protectedProcedure.input(orgInput.extend({ queryId: z.number().int().positive(), rating: z.enum(["up", "down"]), reason: z.string().trim().max(120).optional() })).mutation(({ ctx, input }) => submitFeedback({ ...input, userId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
