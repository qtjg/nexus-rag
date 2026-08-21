CREATE TABLE `api_key_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`apiKeyId` int NOT NULL,
	`statusCode` int NOT NULL,
	`latencyMs` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_key_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`keyPrefix` varchar(24) NOT NULL,
	`secretHash` varchar(64) NOT NULL,
	`scopesJson` varchar(600) NOT NULL DEFAULT '["query:read"]',
	`rateLimitPerMinute` int NOT NULL DEFAULT 12,
	`expiresAt` timestamp,
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_api_keys_secret_hash_unique` UNIQUE(`secretHash`),
	CONSTRAINT `organization_api_keys_org_prefix_unique` UNIQUE(`orgId`,`keyPrefix`)
);
--> statement-breakpoint
CREATE INDEX `api_key_usage_key_created_idx` ON `api_key_usage` (`apiKeyId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `api_key_usage_org_created_idx` ON `api_key_usage` (`orgId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `organization_api_keys_org_created_idx` ON `organization_api_keys` (`orgId`,`createdAt`);