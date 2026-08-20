ALTER TABLE `organizations` ADD `releaseApprovalStatus` enum('pending','approved','blocked') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `releaseApprovalSummary` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `releaseApprovedAt` timestamp;