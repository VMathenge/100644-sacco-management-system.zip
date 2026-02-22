# SACCO Management System — PHP/MySQL Version

A complete digital SACCO management system built with PHP and MySQL, designed to run locally on **WAMP Server**.

## Features

- 📊 **Dashboard** — Key metrics, recent transactions, loan portfolio overview
- 👥 **Members** — Register, view, edit members with auto-created savings accounts
- 💰 **Savings** — Manage savings accounts, record deposits and withdrawals
- 💳 **Loans** — Apply, approve, disburse, and track loan repayments with built-in calculator
- 🔄 **Transactions** — Full transaction ledger with type filtering
- 📋 **Accounting** — Chart of accounts and journal entries
- 📈 **Reports** — Analytics, member stats, loan portfolio health, top savers

---

## Requirements

- **WAMP Server** (v3.x or later) — [Download from wampserver.com](https://www.wampserver.com)
- PHP 8.0 or later (included with WAMP)
- MySQL 5.7+ or MariaDB 10.x (included with WAMP)

---

## Installation Steps

### Step 1: Install WAMP Server

1. Download WAMP from [wampserver.com](https://www.wampserver.com)
2. Run the installer and follow the setup wizard
3. Start WAMP — the system tray icon should turn **green**

### Step 2: Copy Project Files

1. Open Windows Explorer and navigate to your WAMP `www` folder:
   ```
   C:\wamp64\www\
   ```
   *(or `C:\wamp\www\` for 32-bit WAMP)*

2. Copy the entire `sacco-php` folder into the `www` directory:
   ```
   C:\wamp64\www\sacco-php\
   ```

### Step 3: Create the Database

**Option A — Using phpMyAdmin (Recommended):**

1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Log in with:
   - Username: `root`
   - Password: *(leave empty by default)*
3. Click **"Import"** in the top menu
4. Click **"Choose File"** and select:
   ```
   C:\wamp64\www\sacco-php\database\sacco.sql
   ```
5. Click **"Go"** to import

**Option B — Using MySQL Command Line:**

1. Open Command Prompt
2. Run:
   ```bash
   mysql -u root -p < C:\wamp64\www\sacco-php\database\sacco.sql
   ```

### Step 4: Configure Database Connection

Open `config/database.php` and verify the settings match your WAMP setup:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');    // Default WAMP username
define('DB_PASS', '');        // Default WAMP password (empty)
define('DB_NAME', 'sacco_db');
```

> **Note:** If you've set a MySQL root password in WAMP, update `DB_PASS` accordingly.

### Step 5: Open the Application

Open your browser and go to:
```
http://localhost/sacco-php/
```

You should see the SACCO Dashboard!

---

## Default Login

The system currently uses a simple admin interface without authentication. The default admin user in the database is:

| Field    | Value         |
|----------|---------------|
| Username | `admin`       |
| Password | `admin123`    |
| Role     | Administrator |

*(Authentication can be added as a future enhancement)*

---

## Project Structure

```
sacco-php/
├── index.php                  # Redirects to dashboard
├── config/
│   └── database.php           # DB connection & helper functions
├── database/
│   └── sacco.sql              # MySQL database schema + seed data
├── includes/
│   ├── layout.php             # Main HTML layout with sidebar & CSS
│   └── footer.php             # Closing HTML tags
├── dashboard/
│   └── index.php              # Dashboard with key metrics
├── members/
│   ├── index.php              # Members list with search
│   ├── add.php                # Register new member
│   ├── view.php               # Member detail page
│   └── edit.php               # Edit member details
├── loans/
│   ├── index.php              # Loans list with filters
│   ├── add.php                # New loan application + calculator
│   └── view.php               # Loan detail + approve/disburse/repay
├── savings/
│   ├── index.php              # Savings accounts list
│   ├── deposit.php            # Record deposit
│   └── withdraw.php           # Record withdrawal
├── transactions/
│   └── index.php              # Transaction ledger
├── accounting/
│   └── index.php              # Chart of accounts + journal entries
└── reports/
    └── index.php              # Analytics & reports
```

---

## Database Tables

| Table              | Purpose                              |
|--------------------|--------------------------------------|
| `members`          | SACCO member records                 |
| `savings_accounts` | Member savings accounts              |
| `loans`            | Loan applications and tracking       |
| `transactions`     | All financial transactions           |
| `loan_repayments`  | Loan repayment history               |
| `accounts`         | Chart of accounts                    |
| `journal_entries`  | Double-entry bookkeeping             |
| `admin_users`      | System administrator accounts        |

---

## Troubleshooting

### "Database Connection Error"
- Make sure WAMP is running (green icon in system tray)
- Verify the database `sacco_db` was created (check phpMyAdmin)
- Check `config/database.php` credentials

### "Page Not Found"
- Ensure the folder is in `C:\wamp64\www\sacco-php\`
- Check that WAMP Apache is running
- Try accessing `http://localhost/` first

### "Import Failed" in phpMyAdmin
- Make sure you selected the correct `.sql` file
- Try running the SQL manually in phpMyAdmin's SQL tab

### White Page / PHP Errors
- Enable error display: In WAMP, click the tray icon → PHP → php.ini → set `display_errors = On`
- Check PHP version is 8.0+: WAMP tray → PHP → Version

---

## Customization

### Change Currency
Edit `config/database.php`:
```php
define('CURRENCY', 'KES');        // Change to USD, UGX, TZS, etc.
define('CURRENCY_SYMBOL', 'KES'); // Display symbol
```

### Change Interest Rates
Default savings interest rate is **3.5% p.a.** and loan rate is **12% p.a.**
These can be changed per account/loan when creating them.

### Add More Admin Users
In phpMyAdmin, run:
```sql
INSERT INTO admin_users (username, password_hash, full_name, email, role)
VALUES ('newuser', '$2y$10$...', 'New User', 'user@sacco.co.ke', 'teller');
```
*(Generate password hash using PHP's `password_hash('yourpassword', PASSWORD_DEFAULT)`)*

---

## License

This project is open source and free to use for your SACCO organization.
