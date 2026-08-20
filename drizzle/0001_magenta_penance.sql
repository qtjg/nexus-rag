CREATE TABLE `ingestion_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`sourceId` int NOT NULL,
	`status` enum('queued','processing','retry_scheduled','succeeded','dead_letter') NOT NULL DEFAULT 'queued',
	`idempotencyKey` varchar(128) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`nextAttemptAt` timestamp,
	`lastErrorCode` varchar(64),
	`lastErrorMessage` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`startedAt` timestamp,
	`completedAt` timestamp,
	CONSTRAINT `ingestion_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `ingestion_jobs_source_key_unique` UNIQUE(`sourceId`,`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `organization_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`invitedByUserId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('admin','member','viewer') NOT NULL DEFAULT 'member',
	`collectionIds` text NOT NULL,
	`status` enum('pending','accepted','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`revokedAt` timestamp,
	CONSTRAINT `organization_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_invitations_org_email_pending_unique` UNIQUE(`orgId`,`email`,`status`)
);
--> statement-breakpoint
CREATE INDEX `ingestion_jobs_org_status_schedule_idx` ON `ingestion_jobs` (`orgId`,`status`,`nextAttemptAt`);--> statement-breakpoint
CREATE INDEX `organization_invitations_email_status_idx` ON `organization_invitations` (`email`,`status`);