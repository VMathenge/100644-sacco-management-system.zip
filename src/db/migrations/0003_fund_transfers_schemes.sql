-- Migration: Add fund transfers and schemes tables
-- Created: 2026-03-06

-- Fund transfers table
CREATE TABLE IF NOT EXISTS fund_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_number TEXT NOT NULL UNIQUE,
  member_id INTEGER REFERENCES members(id),
  from_account_id INTEGER NOT NULL REFERENCES accounts(id),
  to_account_id INTEGER NOT NULL REFERENCES accounts(id),
  amount REAL NOT NULL,
  transfer_type TEXT NOT NULL, -- internal, external, member_to_member, account_to_account
  description TEXT,
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  processed_by TEXT,
  processed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Schemes table
CREATE TABLE IF NOT EXISTS schemes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scheme_code TEXT NOT NULL UNIQUE,
  scheme_name TEXT NOT NULL,
  description TEXT,
  scheme_type TEXT NOT NULL, -- welfare, education, emergency, burial, medical, custom
  contribution_amount REAL NOT NULL DEFAULT 0,
  contribution_frequency TEXT, -- monthly, quarterly, annually, one-time
  is_active INTEGER NOT NULL DEFAULT 1,
  start_date INTEGER,
  end_date INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Scheme accounts table
CREATE TABLE IF NOT EXISTS scheme_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scheme_id INTEGER NOT NULL REFERENCES schemes(id),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  account_role TEXT NOT NULL, -- contribution, benefit, expense, reserve
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Scheme contributions table
CREATE TABLE IF NOT EXISTS scheme_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scheme_id INTEGER NOT NULL REFERENCES schemes(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  amount REAL NOT NULL,
  payment_method TEXT, -- cash, bank, mpesa, deduction
  reference_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  processed_by TEXT,
  contribution_date INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
