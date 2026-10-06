CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`website` text NOT NULL,
	`search_url` text DEFAULT '' NOT NULL,
	`account_number` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`contact_name` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `jobs` ADD `parts_status` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `parts_vendor_id` text;--> statement-breakpoint
ALTER TABLE `jobs` ADD `parts_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `jobs` ADD `parts_updated_at` text;--> statement-breakpoint
CREATE INDEX `jobs_parts_status_idx` ON `jobs` (`parts_status`);