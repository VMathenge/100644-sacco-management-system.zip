<?php
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../config/database.php';

$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$flash = getFlash();

function isActive(string $page): string {
    global $currentPage;
    return $currentPage === $page ? 'active' : '';
}

function navLink(string $href, string $label, string $page, string $icon): string {
    $active = basename($href, '.php') === basename($_SERVER['PHP_SELF'], '.php') ? 'active' : '';
    return '<a href="' . $href . '" class="nav-link ' . $active . '">' . $icon . '<span>' . $label . '</span></a>';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($pageTitle) ? clean($pageTitle) . ' — ' : '' ?><?= APP_NAME ?></title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            display: flex;
            min-height: 100vh;
        }

        /* Sidebar */
        .sidebar {
            width: 240px;
            background: #0f172a;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0; left: 0;
            z-index: 100;
        }

        .sidebar-logo {
            padding: 20px 16px;
            border-bottom: 1px solid #1e293b;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-icon {
            width: 36px; height: 36px;
            background: #10b981;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 18px;
        }

        .logo-text h1 { color: #fff; font-size: 13px; font-weight: 700; }
        .logo-text p { color: #64748b; font-size: 11px; }

        .sidebar-nav { flex: 1; padding: 12px 8px; }

        .nav-link {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 8px;
            color: #94a3b8;
            text-decoration: none;
            font-size: 13.5px;
            font-weight: 500;
            margin-bottom: 2px;
            transition: all 0.15s;
        }

        .nav-link:hover { background: #1e293b; color: #fff; }
        .nav-link.active { background: #059669; color: #fff; }
        .nav-link .icon { font-size: 16px; width: 20px; text-align: center; }

        .sidebar-footer {
            padding: 16px;
            border-top: 1px solid #1e293b;
        }

        .user-info {
            display: flex; align-items: center; gap: 10px;
        }

        .user-avatar {
            width: 32px; height: 32px;
            background: #334155;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: #94a3b8; font-size: 14px;
        }

        .user-name { color: #fff; font-size: 12px; font-weight: 600; }
        .user-role { color: #64748b; font-size: 11px; }

        /* Main content */
        .main-content {
            margin-left: 240px;
            flex: 1;
            padding: 24px;
            min-height: 100vh;
        }

        /* Cards */
        .card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .card-header {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .card-header h2 { font-size: 15px; font-weight: 600; color: #0f172a; }
        .card-body { padding: 20px; }

        /* Stats grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .stat-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .stat-label { font-size: 12px; color: #64748b; font-weight: 500; }
        .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 4px; }
        .stat-sub { font-size: 11px; margin-top: 4px; }

        /* Tables */
        .table-wrapper { overflow-x: auto; }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
        }

        thead tr { background: #f8fafc; }
        th {
            text-align: left;
            padding: 10px 16px;
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e2e8f0;
        }

        td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
        }

        tr:hover td { background: #f8fafc; }
        tr:last-child td { border-bottom: none; }

        /* Badges */
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }

        .badge-active   { background: #d1fae5; color: #065f46; }
        .badge-inactive { background: #f1f5f9; color: #475569; }
        .badge-warning  { background: #fef3c7; color: #92400e; }
        .badge-danger   { background: #fee2e2; color: #991b1b; }
        .badge-info     { background: #dbeafe; color: #1e40af; }
        .badge-purple   { background: #ede9fe; color: #5b21b6; }

        /* Buttons */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.15s;
        }

        .btn-primary { background: #059669; color: #fff; }
        .btn-primary:hover { background: #047857; }
        .btn-secondary { background: #f1f5f9; color: #475569; }
        .btn-secondary:hover { background: #e2e8f0; }
        .btn-danger { background: #fee2e2; color: #991b1b; }
        .btn-danger:hover { background: #fecaca; }
        .btn-info { background: #dbeafe; color: #1e40af; }
        .btn-info:hover { background: #bfdbfe; }
        .btn-sm { padding: 5px 10px; font-size: 12px; }

        /* Forms */
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .form-control {
            width: 100%;
            padding: 9px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 13.5px;
            color: #1e293b;
            background: #fff;
            transition: border-color 0.15s;
        }
        .form-control:focus { outline: none; border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.1); }
        select.form-control { cursor: pointer; }
        textarea.form-control { resize: vertical; min-height: 80px; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .col-span-2 { grid-column: span 2; }

        /* Alerts */
        .alert {
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13.5px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .alert-error   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .alert-info    { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }

        /* Page header */
        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }

        .page-header h1 { font-size: 22px; font-weight: 700; color: #0f172a; }
        .page-header p { font-size: 13px; color: #64748b; margin-top: 2px; }

        /* Back link */
        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #64748b;
            text-decoration: none;
            font-size: 13px;
            margin-bottom: 16px;
        }
        .back-link:hover { color: #0f172a; }

        /* Progress bar */
        .progress-bar {
            width: 100%;
            background: #f1f5f9;
            border-radius: 99px;
            height: 8px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            border-radius: 99px;
            background: #059669;
            transition: width 0.3s;
        }

        /* Avatar */
        .avatar {
            width: 36px; height: 36px;
            border-radius: 50%;
            background: #d1fae5;
            color: #065f46;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 13px;
        }

        /* Search bar */
        .search-bar {
            position: relative;
        }
        .search-bar input {
            padding-left: 36px;
        }
        .search-icon {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
            font-size: 14px;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .sidebar { width: 200px; }
            .main-content { margin-left: 200px; padding: 16px; }
            .form-grid, .form-grid-3 { grid-template-columns: 1fr; }
            .col-span-2 { grid-column: span 1; }
        }

        /* Utility */
        .text-green  { color: #059669; }
        .text-red    { color: #dc2626; }
        .text-blue   { color: #2563eb; }
        .text-muted  { color: #64748b; }
        .font-bold   { font-weight: 700; }
        .font-medium { font-weight: 500; }
        .text-sm     { font-size: 12px; }
        .text-right  { text-align: right; }
        .mt-1 { margin-top: 4px; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .mb-4 { margin-bottom: 16px; }
        .gap-2 { gap: 8px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; }
        .empty-state { text-align: center; padding: 48px 20px; color: #94a3b8; }
        .empty-state .icon { font-size: 40px; margin-bottom: 12px; }
        .empty-state p { font-size: 14px; }
        .dl-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; }
        .dl-row:last-child { border-bottom: none; }
        .dl-label { color: #64748b; }
        .dl-value { font-weight: 500; color: #0f172a; text-align: right; max-width: 60%; }
        .summary-box { background: #f0fdf4; border-radius: 10px; padding: 16px; }
        .summary-item { margin-bottom: 8px; }
        .summary-item .label { font-size: 11px; color: #059669; font-weight: 600; }
        .summary-item .value { font-size: 18px; font-weight: 700; color: #065f46; }
    </style>
</head>
<body>

<!-- Sidebar -->
<aside class="sidebar">
    <div class="sidebar-logo">
        <div class="logo-icon">🏦</div>
        <div class="logo-text">
            <h1>SACCO</h1>
            <p>Management System</p>
        </div>
    </div>

    <nav class="sidebar-nav">
        <?= navLink('../dashboard/index.php', 'Dashboard', 'index', '<span class="icon">📊</span>') ?>
        <?= navLink('../members/index.php', 'Members', 'index', '<span class="icon">👥</span>') ?>
        <?= navLink('../savings/index.php', 'Savings', 'index', '<span class="icon">💰</span>') ?>
        <?= navLink('../loans/index.php', 'Loans', 'index', '<span class="icon">💳</span>') ?>
        <?= navLink('../accounting/index.php', 'Accounting', 'index', '<span class="icon">📋</span>') ?>
        <?= navLink('../transactions/index.php', 'Transactions', 'index', '<span class="icon">🔄</span>') ?>
        <?= navLink('../reports/index.php', 'Reports', 'index', '<span class="icon">📈</span>') ?>
    </nav>

    <div class="sidebar-footer">
        <div class="user-info">
            <div class="user-avatar">👤</div>
            <div>
                <div class="user-name">Admin User</div>
                <div class="user-role">Administrator</div>
            </div>
        </div>
    </div>
</aside>

<!-- Main Content -->
<main class="main-content">

<?php if ($flash): ?>
    <div class="alert alert-<?= $flash['type'] === 'success' ? 'success' : ($flash['type'] === 'error' ? 'error' : 'info') ?>">
        <?= $flash['type'] === 'success' ? '✓' : ($flash['type'] === 'error' ? '✗' : 'ℹ') ?>
        <?= clean($flash['message']) ?>
    </div>
<?php endif; ?>
