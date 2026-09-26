DROP INDEX `idx_wiki_articles_title`;--> statement-breakpoint
CREATE INDEX `idx_wiki_articles_title` ON `wiki_articles` (`project`,`title_normalized`);