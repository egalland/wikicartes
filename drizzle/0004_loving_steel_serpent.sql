CREATE TABLE `wiki_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`project` text NOT NULL,
	`page_id` integer,
	`title` text NOT NULL,
	`title_normalized` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`wikipedia_url` text NOT NULL,
	`api_url` text NOT NULL,
	`canonical_title` text,
	`excerpt` text,
	`thumbnail` text,
	`wikidata_id` text,
	`latitude` integer,
	`longitude` integer,
	`categories` text,
	`enrich_status` text DEFAULT 'pending' NOT NULL,
	`enrich_error` text,
	`enriched_at` integer,
	`card_id` integer
);
--> statement-breakpoint
CREATE INDEX `idx_wiki_articles_job` ON `wiki_articles` (`job_id`);--> statement-breakpoint
CREATE INDEX `idx_wiki_articles_views` ON `wiki_articles` (`views`);--> statement-breakpoint
CREATE INDEX `idx_wiki_articles_enrich` ON `wiki_articles` (`enrich_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wiki_articles_page` ON `wiki_articles` (`project`,`page_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wiki_articles_title` ON `wiki_articles` (`project`,`title_normalized`);--> statement-breakpoint
CREATE TABLE `wiki_import_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`project` text NOT NULL,
	`period_start` text NOT NULL,
	`period_end` text NOT NULL,
	`total_rows` integer DEFAULT 0 NOT NULL,
	`read_rows` integer DEFAULT 0 NOT NULL,
	`imported_rows` integer DEFAULT 0 NOT NULL,
	`duplicate_rows` integer DEFAULT 0 NOT NULL,
	`error_rows` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_wiki_jobs_status` ON `wiki_import_jobs` (`status`,`updated_at`);