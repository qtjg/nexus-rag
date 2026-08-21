CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`actorUserId` int,
	`action` varchar(96) NOT NULL,
	`targetType` varchar(64) NOT NULL,
	`targetId` varchar(96),
	`summary` varchar(500) NOT NULL,
	`metadataJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`urlIngestionEnabled` boolean NOT NULL DEFAULT false,
	`safetyRestrictionsEnabled` boolean NOT NULL DEFAULT true,
	`sourceRetentionDays` int NOT NULL DEFAULT 365,
	`queryRateLimitPerMinute` int NOT NULL DEFAULT 12,
	`updatedByUserId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_policies_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_policies_org_unique` UNIQUE(`orgId`)
);
--> statement-breakpoint
CREATE INDEX `audit_events_org_created_idx` ON `audit_events` (`orgId`,`createdAt`);