<?php
$pageTitle = 'Savings';
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();

$accounts = $db->query("
    SELECT sa.*, m.first_name, m.last_name, m.member_number, m.id AS member_id
    FROM savings_accounts sa
    LEFT JOIN members m ON sa.member_id = m.id
    ORDER BY sa.created_at DESC
")->fetchAll();

$totalBalance = array_sum(array_column($accounts, 'balance'));
$activeCount = count(array_filter($accounts, fn($a) => $a['status'] === 'active'));
?>

<div class="page-header">
    <div>
        <h1>Savings</h1>
        <p><?= $activeCount ?> active account<?= $activeCount !== 1 ? 's' : '' ?> • Total: <?= formatCurrency($totalBalance) ?></p>
    </div>
    <div class="flex gap-2">
        <a href="deposit.php" class="btn btn-primary">💰 Record Deposit</a>
        <a href="withdraw.php" class="btn btn-secondary">🏧 Withdrawal</a>
    </div>
</div>

<!-- Summary -->
<div class="grid-3" style="margin-bottom:20px;">
    <div class="stat-card">
        <div class="stat-label">Total Savings</div>
        <div class="stat-value" style="font-size:20px;color:#059669;"><?= formatCurrency($totalBalance) ?></div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Active Accounts</div>
        <div class="stat-value" style="color:#2563eb;"><?= $activeCount ?></div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Total Accounts</div>
        <div class="stat-value"><?= count($accounts) ?></div>
    </div>
</div>

<!-- Table -->
<div class="card">
    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>Account #</th>
                    <th>Member</th>
                    <th>Type</th>
                    <th>Balance</th>
                    <th>Interest Rate</th>
                    <th>Status</th>
                    <th>Opened</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($accounts)): ?>
                <tr>
                    <td colspan="8">
                        <div class="empty-state">
                            <div class="icon">💰</div>
                            <p>No savings accounts yet. Accounts are created automatically when members register.</p>
                        </div>
                    </td>
                </tr>
                <?php else: ?>
                <?php foreach ($accounts as $acc): ?>
                <tr>
                    <td class="font-medium"><?= clean($acc['account_number']) ?></td>
                    <td>
                        <a href="../members/view.php?id=<?= $acc['member_id'] ?>">
                            <div class="font-medium"><?= clean($acc['first_name'] . ' ' . $acc['last_name']) ?></div>
                            <div class="text-muted text-sm"><?= clean($acc['member_number']) ?></div>
                        </a>
                    </td>
                    <td style="text-transform:capitalize;"><?= $acc['account_type'] ?></td>
                    <td class="font-bold text-green"><?= formatCurrency($acc['balance']) ?></td>
                    <td><?= $acc['interest_rate'] ?>% p.a.</td>
                    <td><?= statusBadge($acc['status']) ?></td>
                    <td class="text-muted text-sm"><?= formatDate($acc['created_at']) ?></td>
                    <td>
                        <div class="flex gap-2">
                            <a href="deposit.php?account=<?= $acc['id'] ?>" class="btn btn-primary btn-sm">Deposit</a>
                            <a href="withdraw.php?account=<?= $acc['id'] ?>" class="btn btn-secondary btn-sm">Withdraw</a>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
