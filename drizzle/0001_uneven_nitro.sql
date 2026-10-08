CREATE TABLE `discoveries` (
	`user_id` text NOT NULL,
	`card_id` integer NOT NULL,
	`first_opened_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_discoveries_unique` ON `discoveries` (`user_id`,`card_id`);--> statement-breakpoint
CREATE TABLE `sales` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`card_id` integer NOT NULL,
	`seller_id` text NOT NULL,
	`buyer_id` text NOT NULL,
	`price` integer NOT NULL,
	`sold_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sales_listing_id_unique` ON `sales` (`listing_id`);--> statement-breakpoint
CREATE INDEX `idx_sales_card` ON `sales` (`card_id`,`sold_at`);--> statement-breakpoint
CREATE TABLE `showcase` (
	`user_id` text NOT NULL,
	`slot` integer NOT NULL,
	`inventory_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_showcase_slot` ON `showcase` (`user_id`,`slot`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_showcase_inventory` ON `showcase` (`inventory_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `joined_at` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `opened_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `pack_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `legendary_opened` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `peak_balance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE users SET joined_at=COALESCE((SELECT MIN(created_at) FROM inventory WHERE user_id=users.id),CAST(strftime('%s','now') AS integer)*1000), opened_count=(SELECT COUNT(*) FROM inventory WHERE user_id=users.id), peak_balance=balance;
