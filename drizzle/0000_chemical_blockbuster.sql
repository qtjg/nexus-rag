CREATE TABLE `chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`sourceId` int NOT NULL,
	`collectionId` int NOT NULL,
	`text` mediumtext NOT NULL,
	`title` varchar(255) NOT NULL,
	`sectionPath` varchar(500),
	`pageNumber` int,
	`ordinal` int NOT NULL,
	`tokenCount` int NOT NULL,
	`charOffsetStart` int NOT NULL,
	`charOffsetEnd` int NOT NULL,
	`contentHash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chunks_id` PRIMARY KEY(`id`),
	CONSTRAINT `chunks_source_ordinal_unique` UNIQUE(`sourceId`,`ordinal`)
);
--> statement-breakpoint
CREATE TABLE `collection_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`collectionId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_access_id` PRIMARY KEY(`id`),
	CONSTRAINT `collection_access_collection_user_unique` UNIQUE(`collectionId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `collections_org_name_unique` UNIQUE(`orgId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queryId` int NOT NULL,
	`orgId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` enum('up','down') NOT NULL,
	`reason` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`),
	CONSTRAINT `feedback_query_user_unique` UNIQUE(`queryId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `organization_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_memberships_org_user_unique` UNIQUE(`orgId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(120) NOT NULL,
	`planTier` varchar(32) NOT NULL DEFAULT 'foundation',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `queries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`userId` int NOT NULL,
	`questionText` mediumtext NOT NULL,
	`answerText` mediumtext NOT NULL,
	`sufficientContext` boolean NOT NULL DEFAULT false,
	`retrievedChunkIds` text NOT NULL,
	`evidenceSummary` text,
	`latencyMs` int NOT NULL,
	`traceId` varchar(64) NOT NULL,
	`pipelineFingerprint` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `queries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `query_citations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queryId` int NOT NULL,
	`orgId` int NOT NULL,
	`sourceId` int NOT NULL,
	`chunkId` int NOT NULL,
	`marker` varchar(16) NOT NULL,
	`sourceName` varchar(255) NOT NULL,
	`excerpt` mediumtext NOT NULL,
	`sectionPath` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `query_citations_id` PRIMARY KEY(`id`),
	CONSTRAINT `query_citations_query_marker_unique` UNIQUE(`queryId`,`marker`)
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`collectionId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`type` enum('text','file','url','code') NOT NULL DEFAULT 'text',
	`name` varchar(255) NOT NULL,
	`sourceUrl` varchar(2048),
	`storageKey` varchar(512),
	`contentHash` varchar(64) NOT NULL,
	`extractedText` mediumtext,
	`status` enum('queued','parsing','chunking','embedding','indexed','failed','retrieval_disabled') NOT NULL DEFAULT 'queued',
	`errorCode` varchar(64),
	`errorMessage` varchar(500),
	`version` int NOT NULL DEFAULT 1,
	`parserVersion` varchar(32) NOT NULL DEFAULT 'text-v1',
	`chunkingVersion` varchar(32) NOT NULL DEFAULT 'structure-v1',
	`embeddingVersion` varchar(64) NOT NULL DEFAULT 'lexical-v1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `sources_org_collection_content_unique` UNIQUE(`orgId`,`collectionId`,`contentHash`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `chunks_org_collection_source_idx` ON `chunks` (`orgId`,`collectionId`,`sourceId`);--> statement-breakpoint
CREATE INDEX `chunks_org_created_idx` ON `chunks` (`orgId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `collection_access_org_user_idx` ON `collection_access` (`orgId`,`userId`);--> statement-breakpoint
CREATE INDEX `collections_org_created_idx` ON `collections` (`orgId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `feedback_org_created_idx` ON `feedback` (`orgId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `organization_memberships_user_org_idx` ON `organization_memberships` (`userId`,`orgId`);--> statement-breakpoint
CREATE INDEX `queries_org_created_idx` ON `queries` (`orgId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `query_citations_org_query_idx` ON `query_citations` (`orgId`,`queryId`);--> statement-breakpoint
CREATE INDEX `sources_org_collection_status_idx` ON `sources` (`orgId`,`collectionId`,`status`);--> statement-breakpoint
CREATE INDEX `sources_org_created_idx` ON `sources` (`orgId`,`createdAt`);