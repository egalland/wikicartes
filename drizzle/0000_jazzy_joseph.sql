CREATE TABLE `cards` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`family` text NOT NULL,
	`image` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`url` text NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`license` text DEFAULT '' NOT NULL,
	`license_url` text DEFAULT '' NOT NULL,
	`file_url` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_cards_family` ON `cards` (`family`);--> statement-breakpoint
CREATE INDEX `idx_cards_views` ON `cards` (`views`);--> statement-breakpoint
CREATE TABLE `config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `families` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`enabled` integer DEFAULT 1 NOT NULL,
	`cursor` text
);
--> statement-breakpoint
CREATE TABLE `flags` (
	`user_id` text NOT NULL,
	`card_id` integer NOT NULL,
	`kind` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_flags_unique` ON `flags` (`user_id`,`card_id`,`kind`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_id` integer NOT NULL,
	`test_only` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'owned' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_inventory_owner` ON `inventory` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_inventory_card` ON `inventory` (`card_id`);--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`seller_id` text NOT NULL,
	`inventory_id` text NOT NULL,
	`start_price` integer NOT NULL,
	`highest_bid` integer,
	`highest_bidder` text,
	`ends_at` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_listings_status_end` ON `listings` (`status`,`ends_at`);--> statement-breakpoint
CREATE TABLE `trades` (
	`id` text PRIMARY KEY NOT NULL,
	`proposer_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`offered_inventory_id` text NOT NULL,
	`requested_inventory_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_trades_recipient` ON `trades` (`recipient_id`,`status`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`last_pack_at` integer DEFAULT 0 NOT NULL,
	`test_mode` integer DEFAULT 0 NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL
);
