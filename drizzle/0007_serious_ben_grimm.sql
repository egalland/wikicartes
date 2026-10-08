ALTER TABLE `wiki_import_jobs` ADD `enrich_status` text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_cursor` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_total` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_processed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_created` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_skipped` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_errors` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_lease_until` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_retry_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_retry_delay` integer DEFAULT 5000 NOT NULL;--> statement-breakpoint
ALTER TABLE `wiki_import_jobs` ADD `enrich_last_error` text;