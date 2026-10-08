CREATE TABLE `bids` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`bidder_id` text NOT NULL,
	`amount` integer NOT NULL,
	`placed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bids_listing` ON `bids` (`listing_id`,`placed_at`);--> statement-breakpoint
CREATE INDEX `idx_bids_bidder` ON `bids` (`bidder_id`);--> statement-breakpoint
CREATE TABLE `friendships` (
	`requester_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_friends_pair` ON `friendships` (`requester_id`,`recipient_id`);--> statement-breakpoint
CREATE TABLE `import_records` (
	`page_id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`family` text,
	`status` text NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`checked_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_import_status` ON `import_records` (`status`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`message` text NOT NULL,
	`listing_id` text,
	`read_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `reward_claims` (
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`claimed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rewards_unique` ON `reward_claims` (`user_id`,`key`);--> statement-breakpoint
ALTER TABLE `cards` ADD `category` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `cards` ADD `draw_enabled` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `inventory` ADD `plus` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `instant_price` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `nickname` text;--> statement-breakpoint
ALTER TABLE `users` ADD `xp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `standard_packs` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `premium_packs` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `standard_next_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `login_day` text;--> statement-breakpoint
ALTER TABLE `users` ADD `login_streak` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_nickname_unique` ON `users` (`nickname`);--> statement-breakpoint
UPDATE users SET xp=opened_count, standard_packs=CASE WHEN last_pack_at=0 THEN 1 ELSE 0 END, standard_next_at=CASE WHEN last_pack_at=0 THEN 0 ELSE last_pack_at+600000 END;--> statement-breakpoint
UPDATE inventory SET plus=1 WHERE card_id IN (SELECT id FROM cards WHERE views>=110000);
