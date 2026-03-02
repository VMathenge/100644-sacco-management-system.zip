import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// Members table
export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberNumber: text("member_number").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  nationalId: text("national_id").notNull().unique(),
  dateOfBirth: text("date_of_birth").notNull(),
  address: text("address").notNull(),
  occupation: text("occupation"),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  shareCapital: real("share_capital").notNull().default(0),
  joinDate: integer("join_date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  photoUrl: text("photo_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Savings accounts table
export const savingsAccounts = sqliteTable("savings_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountNumber: text("account_number").notNull().unique(),
  memberId: integer("member_id").notNull().references(() => members.id),
  accountType: text("account_type").notNull().default("regular"), // regular, fixed, holiday
  balance: real("balance").notNull().default(0),
  interestRate: real("interest_rate").notNull().default(3.5),
  status: text("status").notNull().default("active"), // active, dormant, closed
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Loans table
export const loans = sqliteTable("loans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  loanNumber: text("loan_number").notNull().unique(),
  memberId: integer("member_id").notNull().references(() => members.id),
  loanType: text("loan_type").notNull().default("personal"), // personal, business, emergency, development
  principalAmount: real("principal_amount").notNull(),
  interestRate: real("interest_rate").notNull().default(12),
  termMonths: integer("term_months").notNull(),
  monthlyPayment: real("monthly_payment").notNull(),
  totalAmount: real("total_amount").notNull(),
  amountPaid: real("amount_paid").notNull().default(0),
  balance: real("balance").notNull(),
  disbursedAt: integer("disbursed_at", { mode: "timestamp" }),
  dueDate: text("due_date"),
  status: text("status").notNull().default("pending"), // pending, approved, active, completed, defaulted, rejected
  purpose: text("purpose"),
  guarantorId: integer("guarantor_id").references(() => members.id),
  approvedBy: text("approved_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Transactions table
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionNumber: text("transaction_number").notNull().unique(),
  memberId: integer("member_id").references(() => members.id),
  type: text("type").notNull(), // deposit, withdrawal, loan_disbursement, loan_repayment, interest, fee, share_capital
  amount: real("amount").notNull(),
  balance: real("balance").notNull().default(0),
  description: text("description"),
  referenceId: integer("reference_id"), // loan id or savings account id
  referenceType: text("reference_type"), // loan, savings
  processedBy: text("processed_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Loan repayments table
export const loanRepayments = sqliteTable("loan_repayments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  loanId: integer("loan_id").notNull().references(() => loans.id),
  memberId: integer("member_id").notNull().references(() => members.id),
  amount: real("amount").notNull(),
  principal: real("principal").notNull(),
  interest: real("interest").notNull(),
  balance: real("balance").notNull(),
  paymentDate: integer("payment_date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  transactionId: integer("transaction_id").references(() => transactions.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Chart of accounts
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountCode: text("account_code").notNull().unique(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(), // asset, liability, equity, income, expense
  parentId: integer("parent_id"),
  balance: real("balance").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Journal entries
export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryNumber: text("entry_number").notNull().unique(),
  description: text("description").notNull(),
  debitAccountId: integer("debit_account_id").notNull().references(() => accounts.id),
  creditAccountId: integer("credit_account_id").notNull().references(() => accounts.id),
  amount: real("amount").notNull(),
  transactionId: integer("transaction_id").references(() => transactions.id),
  entryDate: integer("entry_date", { mode: "timestamp" }).$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Debit notes - documents requesting money from members/customers
export const debitNotes = sqliteTable("debit_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteNumber: text("note_number").notNull().unique(),
  memberId: integer("member_id").references(() => members.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  amount: real("amount").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, issued, paid, cancelled
  dueDate: integer("due_date", { mode: "timestamp" }),
  referenceId: integer("reference_id"), // reference to related transaction
  referenceType: text("reference_type"), // loan, savings, other
  issuedBy: text("issued_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Credit notes - documents crediting money to members/customers
export const creditNotes = sqliteTable("credit_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteNumber: text("note_number").notNull().unique(),
  memberId: integer("member_id").references(() => members.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  amount: real("amount").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending, issued, applied, cancelled
  dueDate: integer("due_date", { mode: "timestamp" }),
  referenceId: integer("reference_id"), // reference to related transaction
  referenceType: text("reference_type"), // loan, savings, other
  issuedBy: text("issued_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
