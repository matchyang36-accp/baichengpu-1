CREATE TABLE IF NOT EXISTS `http_request_daily` (
	`day` text NOT NULL,
	`path` text NOT NULL,
	`method` text NOT NULL,
	`status_code` integer NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`total_duration_ms` integer DEFAULT 0 NOT NULL,
	`max_duration_ms` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `http_request_daily_unique_idx` ON `http_request_daily` (`day`,`path`,`method`,`status_code`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `http_request_daily_day_idx` ON `http_request_daily` (`day`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `http_request_daily_path_day_idx` ON `http_request_daily` (`path`,`day`);
