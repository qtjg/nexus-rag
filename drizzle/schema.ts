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

export const organizationPolicies = mysqlTable(
  "organization_policies",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    urlIngestionEnabled: boolean("urlIngestionEnabled").notNull().default(false),
    safetyRestrictionsEnabled: boolean("safetyRestrictionsEnabled").notNull().default(true),
    sourceRetentionDays: int("sourceRetentionDays").notNull().default(365),
    queryRateLimitPerMinute: int("queryRateLimitPerMinute").notNull().default(12),
    updatedByUserId: int("updatedByUserId"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("organization_policies_org_unique").on(table.orgId)],
);

export const organizationSsoConfigurations = mysqlTable(
  "organization_sso_configurations",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    providerType: mysqlEnum("providerType", ["workos", "oidc", "saml"]).notNull().default("workos"),
    status: mysqlEnum("status", ["draft", "ready", "active", "disabled"]).notNull().default("draft"),
    connectionReference: varchar("connectionReference", { length: 160 }),
    verifiedDomainsJson: varchar("verifiedDomainsJson", { length: 2_000 }).notNull().default("[]"),
    roleMappingJson: varchar("roleMappingJson", { length: 6_000 }).notNull().default("{}"),
    enforceSso: boolean("enforceSso").notNull().default(false),
    configuredByUserId: int("configuredByUserId"),
    activatedAt: timestamp("activatedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("organization_sso_configurations_org_unique").on(table.orgId)],
);

export const organizationApiKeys = mysqlTable(
  "organization_api_keys",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    createdByUserId: int("createdByUserId").notNull(),
    label: varchar("label", { length: 120 }).notNull(),
    keyPrefix: varchar("keyPrefix", { length: 24 }).notNull(),
    secretHash: varchar("secretHash", { length: 64 }).notNull(),
    scopesJson: varchar("scopesJson", { length: 600 }).notNull().default('["query:read"]'),
    rateLimitPerMinute: int("rateLimitPerMinute").notNull().default(12),
    expiresAt: timestamp("expiresAt"),
    lastUsedAt: timestamp("lastUsedAt"),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_api_keys_secret_hash_unique").on(table.secretHash),
    uniqueIndex("organization_api_keys_org_prefix_unique").on(table.orgId, table.keyPrefix),
    index("organization_api_keys_org_created_idx").on(table.orgId, table.createdAt),
  ],
);

export const apiKeyUsage = mysqlTable(
  "api_key_usage",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    apiKeyId: int("apiKeyId").notNull(),
    statusCode: int("statusCode").notNull(),
    latencyMs: int("latencyMs").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("api_key_usage_key_created_idx").on(table.apiKeyId, table.createdAt), index("api_key_usage_org_created_idx").on(table.orgId, table.createdAt)],
);

export const connectorConfigurations = mysqlTable(
  "connector_configurations",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    collectionId: int("collectionId").notNull(),
    createdByUserId: int("createdByUserId").notNull(),
    providerType: mysqlEnum("providerType", ["notion", "google_drive", "confluence", "sharepoint", "custom_api"]).notNull(),
    status: mysqlEnum("status", ["draft", "ready", "paused", "disconnected"]).notNull().default("draft"),
    syncMode: mysqlEnum("syncMode", ["manual", "incremental"]).notNull().default("manual"),
    connectionReference: varchar("connectionReference", { length: 160 }),
    externalScope: varchar("externalScope", { length: 500 }),
    lastSyncedAt: timestamp("lastSyncedAt"),
    disconnectedAt: timestamp("disconnectedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("connector_configurations_org_created_idx").on(table.orgId, table.createdAt), index("connector_configurations_org_collection_idx").on(table.orgId, table.collectionId)],
);

export const connectorSyncRuns = mysqlTable(
  "connector_sync_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    connectorConfigurationId: int("connectorConfigurationId").notNull(),
    status: mysqlEnum("status", ["queued", "running", "succeeded", "failed", "blocked"]).notNull().default("blocked"),
    sourcesCreated: int("sourcesCreated").notNull().default(0),
    sourcesUpdated: int("sourcesUpdated").notNull().default(0),
    errorCode: varchar("errorCode", { length: 64 }),
    errorMessage: varchar("errorMessage", { length: 500 }),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("connector_sync_runs_org_connector_idx").on(table.orgId, table.connectorConfigurationId, table.createdAt)],
);

export const auditEvents = mysqlTable(
  "audit_events",
  {
    id: int("id").autoincrement().primaryKey(),
    orgId: int("orgId").notNull(),
    actorUserId: int("actorUserId"),
    action: varchar("action", { length: 96 }).notNull(),
    targetType: varchar("targetType", { length: 64 }).notNull(),
    targetId: varchar("targetId", { length: 96 }),
    summary: varchar("summary", { length: 500 }).notNull(),
    metadataJson: text("metadataJson"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("audit_events_org_created_idx").on(table.orgId, table.createdAt)],
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
    connectorConfigurationId: int("connectorConfigurationId"),
    externalObjectId: varchar("externalObjectId", { length: 255 }),
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
