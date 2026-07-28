CREATE TABLE `pro_interests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contact` text NOT NULL,
	`contact_channel` text NOT NULL,
	`role` text NOT NULL,
	`monthly_volume` text NOT NULL,
	`needs` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'pricing' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pro_interests_contact_unique` ON `pro_interests` (`contact`);