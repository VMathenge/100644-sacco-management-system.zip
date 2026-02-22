<?php
$pageTitle = 'Accounting';
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();

$accounts = $db->query("SELECT * FROM accounts WHERE is_active=1 ORDER BY account_code")->fetchAll();

$journalEntries = $db->query("
    SELECT je.*,
        da.account_code AS debit_code, da.account_name AS debit_name,
        ca.account_code AS credit_code, ca.account_name AS credit_name
    FROM journal_entries je
    LEFT JOIN accounts da ON je.debit_account_id = da.id
    LEFT JOIN accounts ca ON je.credit_account_id = ca.id
    ORDER BY je.entry_date DESC
    LIMIT 20
")->fetchAll();

// Group accounts by type
$byType = [];
foreach ($accounts as $acc) {
    $byType[$acc['account_type']][] = $acc;
}

$totals = [];
foreach ($byType as $type => $accs) {
    $totals[$type] = array_sum(array_column($accs, 'balance'));
}

$typeColors = [
    'asset'     => 'badge-info',
    'liability' => 'badge-danger',
    'equity'    => 'badge-purple',
    'income'    => 'badge-active',
    'expense'   => 'badge-warning',
];
?>

<div class="page-header">
    <div>
        <h1>Accounting</h1>
        <p>Chart of accounts and journal entries</p>
    </div>
</div>

<!-- Financial Summary -->
<div class="grid-4" style="margin-bottom:20px;grid-template-columns:repeat(5,1fr);">
    <?php
    $summaryItems = [
        ['Total Assets', 'asset', '#2563eb'],
        ['Total Liabilities', 'liability', '#dc2626'],
        ['Total Equity', 'equity', '#7c3aed'],
        ['Total Income', 'income', '#059669'],
        ['Total Expenses', 'expense', '#d97706'],
    ];
    foreach ($summaryItems as [$label, $type, $color]):
    ?>
    <div class="stat-card">
        <div class="stat-label"><?= $label ?></div>
        <div class="stat-value" style="font-size:16px;color:<?= $color ?>;"><?= formatCurrency($totals[$type] ?? 0) ?></div>
    </div>
    <?php endforeach; ?>
</div>

<div class="grid-2" style="gap:20px;">
    <!-- Chart of Accounts -->
    <div class="card">
        <div class="card-header"><h2>Chart of Accounts</h2></div>
        <?php if (empty($accounts)): ?>
        <div class="empty-state">
            <div class="icon">📋</div>
            <p>No accounts set up yet</p>
            <p style="font-size:12px;margin-top:4px;">The default accounts are created when you import the SQL file</p>
        </div>
        <?php else: ?>
        <?php foreach (['asset','liability','equity','income','expense'] as $type): ?>
        <?php if (!empty($byType[$type])): ?>
        <div style="background:#f8fafc;padding:8px 16px;border-bottom:1px solid #f1f5f9;">
            <span class="badge <?= $typeColors[$type] ?>" style="text-transform:uppercase;font-size:10px;"><?= $type ?></span>
        </div>
        <?php foreach ($byType[$type] as $acc): ?>
        <div class="flex justify-between items-center" style="padding:10px 16px;border-bottom:1px solid #f8fafc;">
            <div>
                <span class="font-medium" style="font-size:13px;"><?= clean($acc['account_name']) ?></span>
                <span class="text-muted text-sm" style="margin-left:8px;"><?= clean($acc['account_code']) ?></span>
            </div>
            <span class="font-bold" style="font-size:13px;"><?= formatCurrency($acc['balance']) ?></span>
        </div>
        <?php endforeach; ?>
        <?php endif; ?>
        <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <!-- Journal Entries -->
    <div class="card">
        <div class="card-header"><h2>Recent Journal Entries</h2></div>
        <?php if (empty($journalEntries)): ?>
        <div class="empty-state"><p>No journal entries yet</p></div>
        <?php else: ?>
        <div style="divide-y:1px solid #f1f5f9;">
            <?php foreach ($journalEntries as $entry): ?>
            <div style="padding:14px 16px;border-bottom:1px solid #f8fafc;">
                <div class="flex justify-between items-start" style="margin-bottom:6px;">
                    <div>
                        <div class="font-medium" style="font-size:13px;"><?= clean($entry['description']) ?></div>
                        <div class="text-muted text-sm"><?= clean($entry['entry_number']) ?> • <?= formatDate($entry['entry_date']) ?></div>
                    </div>
                    <div class="font-bold" style="font-size:13px;"><?= formatCurrency($entry['amount']) ?></div>
                </div>
                <div style="display:flex;gap:16px;font-size:11px;">
                    <span><span style="color:#dc2626;font-weight:600;">DR</span> <?= clean($entry['debit_code']) ?> <?= clean($entry['debit_name']) ?></span>
                    <span><span style="color:#059669;font-weight:600;">CR</span> <?= clean($entry['credit_code']) ?> <?= clean($entry['credit_name']) ?></span>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
