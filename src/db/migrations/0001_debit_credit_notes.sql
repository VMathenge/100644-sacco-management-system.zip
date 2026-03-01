-- Migration: Add debit_notes and credit_notes tables
-- Created: 2026-03-01

-- Debit notes table
CREATE TABLE IF NOT EXISTS "debit_notes" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "note_number" TEXT NOT NULL UNIQUE,
  "member_id" INTEGER REFERENCES "members" ("id"),
  "account_id" INTEGER NOT NULL REFERENCES "accounts" ("id"),
  "amount" REAL NOT NULL,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "due_date" INTEGER,
  "reference_id" INTEGER,
  "reference_type" TEXT,
  "issued_by" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);

-- Credit notes table
CREATE TABLE IF NOT EXISTS "credit_notes" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  "note_number" TEXT NOT NULL UNIQUE,
  "member_id" INTEGER REFERENCES "members" ("id"),
  "account_id" INTEGER NOT NULL REFERENCES "accounts" ("id"),
  "amount" REAL NOT NULL,
  "reason" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "due_date" INTEGER,
  "reference_id" INTEGER,
  "reference_type" TEXT,
  "issued_by" TEXT,
  "created_at" INTEGER NOT NULL,
  "updated_at" INTEGER NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "debit_notes_member_id" ON "debit_notes" ("member_id");
CREATE INDEX IF NOT EXISTS "debit_notes_account_id" ON "debit_notes" ("account_id");
CREATE INDEX IF NOT EXISTS "debit_notes_status" ON "debit_notes" ("status");

CREATE INDEX IF NOT EXISTS "credit_notes_member_id" ON "credit_notes" ("member_id");
CREATE INDEX IF NOT EXISTS "credit_notes_account_id" ON "credit_notes" ("account_id");
CREATE INDEX IF NOT EXISTS "credit_notes_status" ON "credit_notes" ("status");
