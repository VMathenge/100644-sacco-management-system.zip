CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_code` text NOT NULL,
	`account_name` text NOT NULL,
	`account_type` text NOT NULL,
	`parent_id` integer,
	`balance` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_account_code_unique` ON `accounts` (`account_code`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_number` text NOT NULL,
	`description` text NOT NULL,
	`debit_account_id` integer NOT NULL,
	`credit_account_id` integer NOT NULL,
	`amount` real NOT NULL,
	`transaction_id` integer,
	`entry_date` integer,
	`created_at` integer,
	FOREIGN KEY (`debit_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`credit_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journal_entries_entry_number_unique` ON `journal_entries` (`entry_number`);--> statement-breakpoint
CREATE TABLE `loan_repayments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`loan_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`amount` real NOT NULL,
	`principal` real NOT NULL,
	`interest` real NOT NULL,
	`balance` real NOT NULL,
	`payment_date` integer,
	`transaction_id` integer,
	`created_at` integer,
	FOREIGN KEY (`loan_id`) REFERENCES `loans`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `loans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`loan_number` text NOT NULL,
	`member_id` integer NOT NULL,
	`loan_type` text DEFAULT 'personal' NOT NULL,
	`principal_amount` real NOT NULL,
	`interest_rate` real DEFAULT 12 NOT NULL,
	`term_months` integer NOT NULL,
	`monthly_payment` real NOT NULL,
	`total_amount` real NOT NULL,
	`amount_paid` real DEFAULT 0 NOT NULL,
	`balance` real NOT NULL,
	`disbursed_at` integer,
	`due_date` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`purpose` text,
	`guarantor_id` integer,
	`approved_by` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`guarantor_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `loans_loan_number_unique` ON `loans` (`loan_number`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_number` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`national_id` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`address` text NOT NULL,
	`occupation` text,
	`status` text DEFAULT 'active' NOT NULL,
	`share_capital` real DEFAULT 0 NOT NULL,
	`join_date` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_member_number_unique` ON `members` (`member_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_national_id_unique` ON `members` (`national_id`);--> statement-breakpoint
CREATE TABLE `savings_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_number` text NOT NULL,
	`member_id` integer NOT NULL,
	`account_type` text DEFAULT 'regular' NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`interest_rate` real DEFAULT 3.5 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `savings_accounts_account_number_unique` ON `savings_accounts` (`account_number`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transaction_number` text NOT NULL,
	`member_id` integer,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`description` text,
	`reference_id` integer,
	`reference_type` text,
	`processed_by` text,
	`created_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_transaction_number_unique` ON `transactions` (`transaction_number`);