<?php
// Database Configuration
// Edit these settings to match your WAMP/MySQL setup

define('DB_HOST', 'localhost');
define('DB_USER', 'root');        // Default WAMP username
define('DB_PASS', '');            // Default WAMP password (empty)
define('DB_NAME', 'sacco_db');
define('DB_CHARSET', 'utf8mb4');

// Application Settings
define('APP_NAME', 'SACCO Management System');
define('APP_VERSION', '1.0.0');
define('CURRENCY', 'KES');
define('CURRENCY_SYMBOL', 'KES');

/**
 * Get PDO database connection
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die('<div style="font-family:sans-serif;padding:20px;background:#fee2e2;border:1px solid #ef4444;border-radius:8px;margin:20px;">
                <h2 style="color:#dc2626;">Database Connection Error</h2>
                <p>Could not connect to the database. Please check your settings in <code>config/database.php</code></p>
                <p><strong>Error:</strong> ' . htmlspecialchars($e->getMessage()) . '</p>
                <p>Make sure WAMP is running and the database <strong>' . DB_NAME . '</strong> exists.</p>
            </div>');
        }
    }
    return $pdo;
}

/**
 * Format currency
 */
function formatCurrency(float $amount): string {
    return CURRENCY_SYMBOL . ' ' . number_format($amount, 2);
}

/**
 * Format date
 */
function formatDate(?string $date): string {
    if (!$date) return '—';
    return date('d M Y', strtotime($date));
}

/**
 * Format datetime
 */
function formatDateTime(?string $date): string {
    if (!$date) return '—';
    return date('d M Y, H:i', strtotime($date));
}

/**
 * Generate unique number with prefix
 */
function generateNumber(string $prefix): string {
    return $prefix . date('Y') . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
}

/**
 * Redirect helper
 */
function redirect(string $url): void {
    header("Location: $url");
    exit;
}

/**
 * Flash message helper
 */
function setFlash(string $type, string $message): void {
    if (session_status() === PHP_SESSION_NONE) session_start();
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash(): ?array {
    if (session_status() === PHP_SESSION_NONE) session_start();
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

/**
 * Sanitize input
 */
function clean(string $value): string {
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

/**
 * Status badge HTML
 */
function statusBadge(string $status): string {
    $colors = [
        'active'    => 'badge-active',
        'inactive'  => 'badge-inactive',
        'suspended' => 'badge-danger',
        'pending'   => 'badge-warning',
        'approved'  => 'badge-info',
        'completed' => 'badge-inactive',
        'defaulted' => 'badge-danger',
        'rejected'  => 'badge-danger',
        'dormant'   => 'badge-warning',
        'closed'    => 'badge-inactive',
        'regular'   => 'badge-info',
        'fixed'     => 'badge-active',
        'holiday'   => 'badge-warning',
    ];
    $class = $colors[$status] ?? 'badge-inactive';
    return '<span class="badge ' . $class . '">' . ucfirst($status) . '</span>';
}
