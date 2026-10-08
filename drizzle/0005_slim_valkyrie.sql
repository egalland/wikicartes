PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_wiki_articles` (
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
	`latitude` real,
	`longitude` real,
	`categories` text,
	`enrich_status` text DEFAULT 'pending' NOT NULL,
	`enrich_error` text,
	`enriched_at` integer,
	`card_id` integer
);
--> statement-breakpoint
INSERT INTO `__new_wiki_articles`("id", "job_id", "project", "page_id", "title", "title_normalized", "views", "period_start", "period_end", "wikipedia_url", "api_url", "canonical_title", "excerpt", "thumbnail", "wikidata_id", "latitude", "longitude", "categories", "enrich_status", "enrich_error", "enriched_at", "card_id") SELECT "id", "job_id", "project", "page_id", "title", "title_normalized", "views", "period_start", "period_end", "wikipedia_url", "api_url", "canonical_title", "excerpt", "thumbnail", "wikidata_id", "latitude", "longitude", "categories", "enrich_status", "enrich_error", "enriched_at", "card_id" FROM `wiki_articles`;--> statement-breakpoint
DROP TABLE `wiki_articles`;--> statement-breakpoint
ALTER TABLE `__new_wiki_articles` RENAME TO `wiki_articles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_wiki_articles_job` ON `wiki_articles` (`job_id`);--> statement-breakpoint
CREATE INDEX `idx_wiki_articles_views` ON `wiki_articles` (`views`);--> statement-breakpoint
CREATE INDEX `idx_wiki_articles_enrich` ON `wiki_articles` (`enrich_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wiki_articles_page` ON `wiki_articles` (`project`,`page_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_wiki_articles_title` ON `wiki_articles` (`project`,`title_normalized`);