-- Create savings_schemes table for managing savings scheme types
CREATE TABLE IF NOT EXISTS `savings_schemes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `scheme_code` text NOT NULL UNIQUE,
  `scheme_name` text NOT NULL,
  `description` text,
  `default_interest_rate` real NOT NULL DEFAULT 3.5,
  `minimum_balance` real NOT NULL DEFAULT 0,
  `is_active` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- Insert default savings scheme types
INSERT INTO `savings_schemes` (`scheme_code`, `scheme_name`, `description`, `default_interest_rate`, `minimum_balance`, `is_active`, `created_at`, `updated_at`) VALUES 
('REG', 'Regular Savings', 'Standard savings account for everyday deposits', 3.5, 0, 1, unixepoch(), unixepoch()),
('FIXED', 'Fixed Deposit', 'Locked savings with higher interest rates', 8.0, 10000, 1, unixepoch(), unixepoch()),
('HOLIDAY', 'Holiday Savings', 'Savings target for holiday expenses', 4.5, 500, 1, unixepoch(), unixepoch()),
('EMERGENCY', 'Emergency Fund', 'Reserved funds for unexpected expenses', 5.0, 0, 1, unixepoch(), unixepoch());
