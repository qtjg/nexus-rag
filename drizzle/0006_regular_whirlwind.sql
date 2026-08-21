CREATE TABLE `organization_sso_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`providerType` enum('workos','oidc','saml') NOT NULL DEFAULT 'workos',
	`status` enum('draft','ready','active','disabled') NOT NULL DEFAULT 'draft',
	`connectionReference` varchar(160),
	`verifiedDomainsJson` varchar(2000) NOT NULL DEFAULT '[]',
	`roleMappingJson` varchar(6000) NOT NULL DEFAULT '{}',
	`enforceSso` boolean NOT NULL DEFAULT false,
	`configuredByUserId` int,
	`activatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_sso_configurations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_sso_configurations_org_unique` UNIQUE(`orgId`)
);
