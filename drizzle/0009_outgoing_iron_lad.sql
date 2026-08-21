CREATE TABLE `connector_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`collectionId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`providerType` enum('notion','google_drive','confluence','sharepoint','custom_api') NOT NULL,
	`status` enum('draft','ready','paused','disconnected') NOT NULL DEFAULT 'draft',
	`syncMode` enum('manual','incremental') NOT NULL DEFAULT 'manual',
	`connectionReference` varchar(160),
	`externalScope` varchar(500),
	`lastSyncedAt` timestamp,
	`disconnectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `connector_configurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `connector_sync_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`connectorConfigurationId` int NOT NULL,
	`status` enum('queued','running','succeeded','failed','blocked') NOT NULL DEFAULT 'blocked',
	`sourcesCreated` int NOT NULL DEFAULT 0,
	`sourcesUpdated` int NOT NULL DEFAULT 0,
	`errorCode` varchar(64),
	`errorMessage` varchar(500),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connector_sync_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sources` ADD `connectorConfigurationId` int;--> statement-breakpoint
ALTER TABLE `sources` ADD `externalObjectId` varchar(255);--> statement-breakpoint
CREATE INDEX `connector_configurations_org_created_idx` ON `connector_configurations` (`orgId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `connector_configurations_org_collection_idx` ON `connector_configurations` (`orgId`,`collectionId`);--> statement-breakpoint
CREATE INDEX `connector_sync_runs_org_connector_idx` ON `connector_sync_runs` (`orgId`,`connectorConfigurationId`,`createdAt`);