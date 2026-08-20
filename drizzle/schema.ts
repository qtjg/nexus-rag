import {
  boolean,
  index,
  int,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const organizations = mysqlTable(
  "organizations",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    planTier: varchar("planTier", { length: 32 }).notNull().default("foundation"),
    ingestionRetryTaskUid: varchar("ingestionRetryTaskUid", { length: 65 }),
    releaseApprovalStatus: mysqlEnum("releaseApprovalStatus", ["pending", "approved", "blocked"]).notNull().default("pending"),
    releaseApprovalSummary: text("releaseApprovalSummary"),
    releaseApprovedAt: timestamp("releaseApprovedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)],
);

export const organizationMemberships = mysqlTable(
  "organization_memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["owner", "admin", "member", "viewer"]).notNull().default("member"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_memberships_org_user_unique").on(table.orgId, table.userId),
    index("organization_memberships_user_org_idx").on(table.userId, table.orgId),
  ],
);

export const collections = mysqlTable(
  "collections",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("collections_org_name_unique").on(table.orgId, table.name),
    index("collections_org_created_idx").on(table.orgId, table.createdAt),
  ],
);

export const collectionAccess = mysqlTable(
  "collection_access",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    collectionId: int("collectionId").notNull(),
    userId: int("userId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("collection_access_collection_user_unique").on(table.collectionId, table.userId),
    index("collection_access_org_user_idx").on(table.orgId, table.userId),
  ],
);

export const organizationInvitations = mysqlTable(
  "organization_invitations",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    invitedByUserId: int("invitedByUserId").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    role: mysqlEnum("role", ["admin", "member", "viewer"]).notNull().default("member"),
    collectionIds: text("collectionIds").notNull(),
    status: mysqlEnum("status", ["pending", "accepted", "revoked"]).notNull().default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    acceptedAt: timestamp("acceptedAt"),
    revokedAt: timestamp("revokedAt"),
  },
  (table) => [
    uniqueIndex("organization_invitations_org_email_pending_unique").on(table.orgId, table.email, table.status),
    index("organization_invitations_email_status_idx").on(table.email, table.status),
  ],
);

export const sourceStatusValues = ["queued", "parsing", "chunking", "embedding", "indexed", "failed", "retrieval_disabled"] as const;

export const sources = mysqlTable(
  "sources",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    collectionId: int("collectionId").notNull(),
    createdByUserId: int("createdByUserId").notNull(),
    type: mysqlEnum("type", ["text", "file", "url", "code"]).notNull().default("text"),
    name: varchar("name", { length: 255 }).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 2048 }),
    storageKey: varchar("storageKey", { length: 512 }),
    contentHash: varchar("contentHash", { length: 64 }).notNull(),
    extractedText: mediumtext("extractedText"),
    status: mysqlEnum("status", sourceStatusValues).notNull().default("queued"),
    errorCode: varchar("errorCode", { length: 64 }),
    errorMessage: varchar("errorMessage", { length: 500 }),
    version: int("version").notNull().default(1),
    parserVersion: varchar("parserVersion", { length: 32 }).notNull().default("text-v1"),
    chunkingVersion: varchar("chunkingVersion", { length: 32 }).notNull().default("structure-v1"),
    embeddingVersion: varchar("embeddingVersion", { length: 64 }).notNull().default("lexical-v1"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("sources_org_collection_content_unique").on(table.orgId, table.collectionId, table.contentHash),
    index("sources_org_collection_status_idx").on(table.orgId, table.collectionId, table.status),
    index("sources_org_created_idx").on(table.orgId, table.createdAt),
  ],
);

export const ingestionJobs = mysqlTable(
  "ingestion_jobs",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    sourceId: int("sourceId").notNull(),
    status: mysqlEnum("status", ["queued", "processing", "retry_scheduled", "succeeded", "dead_letter"]).notNull().default("queued"),
    idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(),
    attempts: int("attempts").notNull().default(0),
    maxAttempts: int("maxAttempts").notNull().default(3),
    nextAttemptAt: timestamp("nextAttemptAt"),
    lastErrorCode: varchar("lastErrorCode", { length: 64 }),
    lastErrorMessage: varchar("lastErrorMessage", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
  },
  (table) => [
    uniqueIndex("ingestion_jobs_source_key_unique").on(table.sourceId, table.idempotencyKey),
    index("ingestion_jobs_org_status_schedule_idx").on(table.orgId, table.status, table.nextAttemptAt),
  ],
);

export const chunks = mysqlTable(
  "chunks",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    sourceId: int("sourceId").notNull(),
    collectionId: int("collectionId").notNull(),
    text: mediumtext("text").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    sectionPath: varchar("sectionPath", { length: 500 }),
    pageNumber: int("pageNumber"),
    ordinal: int("ordinal").notNull(),
    tokenCount: int("tokenCount").notNull(),
    charOffsetStart: int("charOffsetStart").notNull(),
    charOffsetEnd: int("charOffsetEnd").notNull(),
    contentHash: varchar("contentHash", { length: 64 }).notNull(),
    embeddingJson: mediumtext("embeddingJson"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("chunks_source_ordinal_unique").on(table.sourceId, table.ordinal),
    index("chunks_org_collection_source_idx").on(table.orgId, table.collectionId, table.sourceId),
    index("chunks_org_created_idx").on(table.orgId, table.createdAt),
  ],
);

export const queries = mysqlTable(
  "queries",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    userId: int("userId").notNull(),
    questionText: mediumtext("questionText").notNull(),
    answerText: mediumtext("answerText").notNull(),
    sufficientContext: boolean("sufficientContext").notNull().default(false),
    retrievedChunkIds: text("retrievedChunkIds").notNull(),
    evidenceSummary: text("evidenceSummary"),
    latencyMs: int("latencyMs").notNull(),
    traceId: varchar("traceId", { length: 64 }).notNull(),
    pipelineFingerprint: varchar("pipelineFingerprint", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("queries_org_created_idx").on(table.orgId, table.createdAt)],
);

export const queryCitations = mysqlTable(
  "query_citations",
  {
    id: int("id").autoincrement().primaryKey(),
    queryId: int("queryId").notNull(),
    orgId: int("orgId").notNull(),
    sourceId: int("sourceId").notNull(),
    chunkId: int("chunkId").notNull(),
    marker: varchar("marker", { length: 16 }).notNull(),
    sourceName: varchar("sourceName", { length: 255 }).notNull(),
    excerpt: mediumtext("excerpt").notNull(),
    sectionPath: varchar("sectionPath", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("query_citations_query_marker_unique").on(table.queryId, table.marker),
    index("query_citations_org_query_idx").on(table.orgId, table.queryId),
  ],
);

export const feedback = mysqlTable(
  "feedback",
  {
    id: int("id").autoincrement().primaryKey(),
    queryId: int("queryId").notNull(),
    orgId: int("orgId").notNull(),
    userId: int("userId").notNull(),
    rating: mysqlEnum("rating", ["up", "down"]).notNull(),
    reason: varchar("reason", { length: 120 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("feedback_query_user_unique").on(table.queryId, table.userId),
    index("feedback_org_created_idx").on(table.orgId, table.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type OrganizationMembershipRole = (typeof organizationMemberships.$inferSelect)["role"];
