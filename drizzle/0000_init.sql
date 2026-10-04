CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`vehicle_id` text NOT NULL,
	`customer` text NOT NULL,
	`vehicle_label` text NOT NULL,
	`plate` text DEFAULT '' NOT NULL,
	`vin` text DEFAULT '' NOT NULL,
	`mileage` integer,
	`jobs` text NOT NULL,
	`tax_rate` real NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`paid_at` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_number_unique` ON `invoices` (`number`);--> statement-breakpoint
CREATE INDEX `invoices_vehicle_idx` ON `invoices` (`vehicle_id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`title` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`technician` text DEFAULT '' NOT NULL,
	`mileage` integer,
	`status` text NOT NULL,
	`items` text NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text,
	`invoice_id` text,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `jobs_vehicle_idx` ON `jobs` (`vehicle_id`);--> statement-breakpoint
CREATE INDEX `jobs_invoice_idx` ON `jobs` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`plate` text DEFAULT '' NOT NULL,
	`plate_state` text DEFAULT '' NOT NULL,
	`vin` text DEFAULT '' NOT NULL,
	`year` text DEFAULT '' NOT NULL,
	`make` text NOT NULL,
	`model` text NOT NULL,
	`trim` text DEFAULT '' NOT NULL,
	`color` text DEFAULT '' NOT NULL,
	`mileage` integer,
	`customer_name` text NOT NULL,
	`customer_phone` text DEFAULT '' NOT NULL,
	`customer_email` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vehicles_plate_idx` ON `vehicles` (`plate`);--> statement-breakpoint
CREATE INDEX `vehicles_vin_idx` ON `vehicles` (`vin`);