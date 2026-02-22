-- SACCO Management System Database
-- MySQL/MariaDB compatible
-- Run this in phpMyAdmin or MySQL CLI

CREATE DATABASE IF NOT EXISTS sacco_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sacco_db;

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    national_id VARCHAR(20) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    occupation VARCHAR(100),
    status ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    share_capital DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    join_date DATE NOT NULL DEFAULT (CURDATE()),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Savings accounts table
CREATE TABLE IF NOT EXISTS savings_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    member_id INT NOT NULL,
    account_type ENUM('regular','fixed','holiday') NOT NULL DEFAULT 'regular',
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 3.50,
    status ENUM('active','dormant','closed') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_number VARCHAR(20) NOT NULL UNIQUE,
    member_id INT NOT NULL,
    loan_type ENUM('personal','business','emergency','development') NOT NULL DEFAULT 'personal',
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    term_months INT NOT NULL,
    monthly_payment DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    balance DECIMAL(15,2) NOT NULL,
    status ENUM('pending','approved','active','completed','defaulted','rejected') NOT NULL DEFAULT 'pending',
    purpose TEXT,
    guarantor_id INT,
    approved_by VARCHAR(100),
    disbursed_at TIMESTAMP NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    FOREIGN KEY (guarantor_id) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_number VARCHAR(30) NOT NULL UNIQUE,
    member_id INT,
    type ENUM('deposit','withdrawal','loan_disbursement','loan_repayment','interest','fee','share_capital') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    reference_id INT,
    reference_type ENUM('loan','savings'),
    processed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Loan repayments table
CREATE TABLE IF NOT EXISTS loan_repayments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    member_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    principal DECIMAL(15,2) NOT NULL,
    interest DECIMAL(15,2) NOT NULL,
    balance DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transaction_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Chart of accounts
CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(10) NOT NULL UNIQUE,
    account_name VARCHAR(150) NOT NULL,
    account_type ENUM('asset','liability','equity','income','expense') NOT NULL,
    parent_id INT,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_number VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    debit_account_id INT NOT NULL,
    credit_account_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_id INT,
    entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debit_account_id) REFERENCES accounts(id),
    FOREIGN KEY (credit_account_id) REFERENCES accounts(id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    role ENUM('admin','manager','teller') NOT NULL DEFAULT 'teller',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash, full_name, email, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@sacco.co.ke', 'admin');

-- Default chart of accounts
INSERT INTO accounts (account_code, account_name, account_type) VALUES
('1001', 'Cash and Bank', 'asset'),
('1002', 'Loan Portfolio', 'asset'),
('1003', 'Interest Receivable', 'asset'),
('1004', 'Other Assets', 'asset'),
('2001', 'Member Savings', 'liability'),
('2002', 'External Borrowings', 'liability'),
('2003', 'Other Liabilities', 'liability'),
('3001', 'Share Capital', 'equity'),
('3002', 'Retained Earnings', 'equity'),
('3003', 'Reserves', 'equity'),
('4001', 'Interest Income', 'income'),
('4002', 'Loan Processing Fees', 'income'),
('4003', 'Membership Fees', 'income'),
('5001', 'Interest Expense', 'expense'),
('5002', 'Operating Expenses', 'expense'),
('5003', 'Salaries and Wages', 'expense');
