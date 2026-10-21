-- First-party traffic analytics, collected by this Worker instead of Umami.
-- Each row is one public page view with the visitor's device, OS, full IP and
-- the Cloudflare-derived country and region.
CREATE TABLE `page_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`post_slug` text,
	`device` text DEFAULT 'unknown' NOT NULL,
	`os` text DEFAULT 'unknown' NOT NULL,
	`country` text,
	`region` text,
	`ip` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `page_views_created_at_idx` ON `page_views` (`created_at`);--> statement-breakpoint
CREATE INDEX `page_views_post_slug_created_at_idx` ON `page_views` (`post_slug`,`created_at`);
