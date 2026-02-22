<?php
$pageTitle = 'Transactions';
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();
$typeFilter = $_GET['type'] ?? '';

$sql = "
    SELECT t.*, m.first_name, m.last_name, m.member_number
    FROM transactions t
    LEFT JOIN members m ON t.member_id = m.id
";
$params = [];

if ($typeFilter) {
    $sql .= " WHERE t.type = ?";
    $params[] = $typeFilter;
}

$sql .= " ORDER BY t.created_at DESC LIMIT 300";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$transactions = $stmt->fetchAll();

// Summary totals
$totals = $db->query("
    SELECT type, COALESCE(SUM(amount),0) as total, COUNT(*) as count
    FROM transactions
    GROUP BY type
")->fetchAll();

$totalsByType = [];
foreach ($totals as $t) {
    $totalsByType[$t['type']] = $t;
}

$txTypes = ['deposit','withdrawal','loan_disbursement','loan_repayment','interest','fee','share_capital'];
$creditTypes = ['deposit','loan_repayment','interest','share_capital'];
?>

<div class="page-header">
    <div>
        <h1>Transactions</h1>
        <p><?= count($transactions) ?> transaction<?= count($transactions) !== 1 ? 's' : '' ?></p>
    </div>
</div>

<!-- Summary Cards -->
<div class="grid-4" style="margin-bottom:20px;">
    <?php
    $summaryCards = [
        ['Total Deposits', 'deposit', 'text-green'],
        ['Total Withdrawals', 'withdrawal', 'text-red'],
        ['Loan Disbursements', 'loan_disbursement', 'text-blue'],
        ['Loan Repayments', 'loan_repayment', 'badge-purple'],
    ];
    foreach ($summaryCards as [$label, $type, $color]):
        $total = $totalsByType[$type]['total'] ?? 0;
        $count = $totalsByType[$type]['count'] ?? 0;
    ?>
    <div class="stat-card">
        <div class="stat-label"><?= $label ?></div>
        <div class="stat-value" style="font-size:16px;" class="<?= $color ?>"><?= formatCurrency($total) ?></div>
        <div class="stat-sub text-muted"><?= $count ?> transactions</div>
    </div>
    <?php endforeach; ?>
</div>

<!-- Type Filter -->
<div class="card mb-4" style="margin-bottom:16px;">
    <div class="card-body" style="padding:12px 16px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="index.php" class="btn <?= !$typeFilter ? 'btn-primary' : 'btn-secondary' ?> btn-sm">All</a>
            <?php foreach ($txTypes as $t): ?>
            <a href="?type=<?= $t ?>" class="btn <?= $typeFilter === $t ? 'btn-primary' : 'btn-secondary' ?> btn-sm" style="text-transform:capitalize;">
                <?= str_replace('_', ' ', $t) ?>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
</div>

<!-- Table -->
<div class="card">
    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>Transaction #</th>
                    <th>Type</th>
                    <th>Member</th>
                    <th>Description</th>
                    <th class="text-right">Amount</th>
                    <th>Processed By</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($transactions)): ?>
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">🔄</div>
                            <p>No transactions found</p>
                        </div>
                    </td>
                </tr>
                <?php else: ?>
                <?php foreach ($transactions as $tx): ?>
                <?php
                    $typeColors = [
                        'deposit' => 'badge-active',
                        'withdrawal' => 'badge-danger',
                        'loan_disbursement' => 'badge-info',
                        'loan_repayment' => 'badge-purple',
                        'interest' => 'badge-warning',
                        'fee' => 'badge-warning',
                        'share_capital' => 'badge-active',
                    ];
                    $badgeClass = $typeColors[$tx['type']] ?? 'badge-inactive';
                    $isDebit = !in_array($tx['type'], $creditTypes);
                ?>
                <tr>
                    <td class="text-muted text-sm" style="font-family:monospace;"><?= clean($tx['transaction_number']) ?></td>
                    <td><span class="badge <?= $badgeClass ?>"><?= ucwords(str_replace('_', ' ', $tx['type'])) ?></span></td>
                    <td>
                        <?php if ($tx['first_name']): ?>
                        <div class="font-medium"><?= clean($tx['first_name'] . ' ' . $tx['last_name']) ?></div>
                        <div class="text-muted text-sm"><?= clean($tx['member_number']) ?></div>
                        <?php else: ?>
                        <span class="text-muted">—</span>
                        <?php endif; ?>
                    </td>
                    <td class="text-muted"><?= clean($tx['description'] ?? '—') ?></td>
                    <td class="text-right font-bold <?= $isDebit ? 'text-red' : 'text-green' ?>">
                        <?= $isDebit ? '-' : '+' ?><?= formatCurrency($tx['amount']) ?>
                    </td>
                    <td class="text-muted text-sm"><?= clean($tx['processed_by'] ?? '—') ?></td>
                    <td class="text-muted text-sm"><?= formatDateTime($tx['created_at']) ?></td>
                </tr>
                <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
