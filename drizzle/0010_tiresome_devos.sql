CREATE TABLE `git_repository_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`collectionId` int NOT NULL,
	`sourceId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`repositoryLabel` varchar(160) NOT NULL,
	`repositoryReference` varchar(500),
	`revision` varchar(128) NOT NULL,
	`baseRevision` varchar(128),
	`kind` enum('snapshot','diff') NOT NULL,
	`fileCount` int NOT NULL DEFAULT 0,
	`inputTruncated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `git_repository_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `git_review_findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`reviewRunId` int NOT NULL,
	`snapshotId` int NOT NULL,
	`severity` enum('info','low','medium','high','critical') NOT NULL,
	`category` enum('correctness','security','data_flow','testing','maintainability') NOT NULL,
	`path` varchar(512),
	`diffLine` int,
	`title` varchar(255) NOT NULL,
	`evidence` mediumtext NOT NULL,
	`recommendation` text NOT NULL,
	`engine` enum('deterministic','llm') NOT NULL DEFAULT 'deterministic',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `git_review_findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `git_review_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`snapshotId` int NOT NULL,
	`reviewedByUserId` int NOT NULL,
	`mode` enum('deterministic','ai_assisted') NOT NULL DEFAULT 'deterministic',
	`status` enum('completed','degraded') NOT NULL DEFAULT 'completed',
	`inputTruncated` boolean NOT NULL DEFAULT false,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `git_review_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `git_repository_snapshots_org_collection_created_idx` ON `git_repository_snapshots` (`orgId`,`collectionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `git_repository_snapshots_org_source_idx` ON `git_repository_snapshots` (`orgId`,`sourceId`);--> statement-breakpoint
CREATE INDEX `git_review_findings_org_snapshot_idx` ON `git_review_findings` (`orgId`,`snapshotId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `git_review_findings_run_idx` ON `git_review_findings` (`reviewRunId`);--> statement-breakpoint
CREATE INDEX `git_review_runs_org_snapshot_created_idx` ON `git_review_runs` (`orgId`,`snapshotId`,`createdAt`);