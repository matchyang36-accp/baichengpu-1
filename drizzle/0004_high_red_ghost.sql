CREATE TABLE `visitor_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visitor_id` text NOT NULL,
	`user_id` text,
	`event_type` text NOT NULL,
	`path` text NOT NULL,
	`country` text DEFAULT 'unknown' NOT NULL,
	`region` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`visitor_id`) REFERENCES `visitor_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `visitor_events_created_idx` ON `visitor_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `visitor_events_type_created_idx` ON `visitor_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `visitor_events_visitor_created_idx` ON `visitor_events` (`visitor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `visitor_events_user_created_idx` ON `visitor_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `visitor_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`first_seen_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`landing_path` text NOT NULL,
	`referrer` text DEFAULT '' NOT NULL,
	`source` text DEFAULT 'direct' NOT NULL,
	`country` text DEFAULT 'unknown' NOT NULL,
	`region` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`device_type` text DEFAULT 'unknown' NOT NULL,
	`page_view_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `visitor_sessions_last_seen_idx` ON `visitor_sessions` (`last_seen_at`);--> statement-breakpoint
CREATE INDEX `visitor_sessions_user_idx` ON `visitor_sessions` (`user_id`,`last_seen_at`);--> statement-breakpoint
CREATE INDEX `visitor_sessions_country_idx` ON `visitor_sessions` (`country`,`last_seen_at`);