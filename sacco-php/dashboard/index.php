<?php
$pageTitle = 'Dashboard';
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();

// Stats
$totalMembers = $db->query("SELECT COUNT(*) FROM members WHERE status='active'")->fetchColumn();
$totalSavings = $db->query("SELECT COALESCE(SUM(balance),0) FROM savings_accounts WHERE status='active'")->fetchColumn();
$activeLoansCount = $db->query("SELECT COUNT(*) FROM loans WHERE status='active'")->fetchColumn();
$activeLoanBalance = $db->query("SELECT COALESCE(SUM(balance),0) FROM loans WHERE status='active'")->fetchColumn();
$pendingLoans = $db->query("SELECT COUNT(*) FROM loans WHERE status='pending'")->fetchColumn();

// Recent transactions
$recentTx = $db->query("
    SELECT t.*, m.first_name, m.last_name
    FROM transactions t
    LEFT JOIN members m ON t.member_id = m.id
    ORDER BY t.created_at DESC
    LIMIT 8
")->fetchAll();

// Loan portfolio by status
$loanPortfolio = $db->query("
    SELECT status, COUNT(*) as count, COALESCE(SUM(principal_amount),0) as total
    FROM loans
    GROUP BY status
")->fetchAll();
?>

<div class="page-header">
    <div>
        <h1>Dashboard</h1>
        <p>Welcome back! Here's an overview of your SACCO.</p>
    </div>
    <div style="color:#64748b;font-size:13px;"><?= date('l, d F Y') ?></div>
</div>

<!-- Stats -->
<div class="stats-grid">
    <div class="stat-card">
        <div class="stat-label">Total Members</div>
        <div class="stat-value"><?= number_format($totalMembers) ?></div>
        <div class="stat-sub text-green">Active members</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Total Savings</div>
        <div class="stat-value" style="font-size:18px;"><?= formatCurrency($totalSavings) ?></div>
        <div class="stat-sub text-green">Across all accounts</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Active Loan Portfolio</div>
        <div class="stat-value" style="font-size:18px;"><?= formatCurrency($activeLoanBalance) ?></div>
        <div class="stat-sub" style="color:#f59e0b;"><?= number_format($activeLoansCount) ?> active loans</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Pending Approvals</div>
        <div class="stat-value" style="color:#7c3aed;"><?= number_format($pendingLoans) ?></div>
        <div class="stat-sub" style="color:#7c3aed;">Loan applications</div>
    </div>
</div>

<div class="grid-2" style="gap:20px;">
    <!-- Recent Transactions -->
    <div class="card">
        <div class="card-header">
            <h2>Recent Transactions</h2>
            <a href="../transactions/index.php" class="btn btn-secondary btn-sm">View All</a>
        </div>
        <?php if (empty($recentTx)): ?>
            <div class="empty-state">
                <div class="icon">🔄</div>
                <p>No transactions yet</p>
            </div>
        <?php else: ?>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Member</th>
                            <th class="text-right">Amount</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recentTx as $tx): ?>
                        <?php
                            $typeColors = [
                                'deposit' => 'badge-active',
                                'withdrawal' => 'badge-danger',
                                'loan_disbursement' => 'badge-info',
                                'loan_repayment' => 'badge-purple',
                                'interest' => 'badge-warning',
                            ];
                            $badgeClass = $typeColors[$tx['type']] ?? 'badge-inactive';
                            $isDebit = in_array($tx['type'], ['withdrawal', 'loan_disbursement']);
                        ?>
                        <tr>
                            <td><span class="badge <?= $badgeClass ?>"><?= ucwords(str_replace('_', ' ', $tx['type'])) ?></span></td>
                            <td><?= $tx['first_name'] ? clean($tx['first_name'] . ' ' . $tx['last_name']) : '—' ?></td>
                            <td class="text-right font-bold <?= $isDebit ? 'text-red' : 'text-green' ?>">
                                <?= $isDebit ? '-' : '+' ?><?= formatCurrency($tx['amount']) ?>
                            </td>
                            <td class="text-muted text-sm"><?= formatDateTime($tx['created_at']) ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>

    <!-- Right column -->
    <div style="display:flex;flex-direction:column;gap:20px;">
        <!-- Loan Portfolio -->
        <div class="card">
            <div class="card-header">
                <h2>Loan Portfolio</h2>
            </div>
            <div class="card-body">
                <?php if (empty($loanPortfolio)): ?>
                    <div class="empty-state" style="padding:20px;">
                        <p>No loans yet</p>
                    </div>
                <?php else: ?>
                    <?php
                    $statusColors = [
                        'pending' => '#f59e0b',
                        'approved' => '#3b82f6',
                        'active' => '#10b981',
                        'completed' => '#94a3b8',
                        'defaulted' => '#ef4444',
                        'rejected' => '#f43f5e',
                    ];
                    foreach ($loanPortfolio as $item):
                        $color = $statusColors[$item['status']] ?? '#94a3b8';
                    ?>
                    <div class="flex items-center justify-between" style="margin-bottom:12px;">
                        <div class="flex items-center gap-2">
                            <div style="width:10px;height:10px;border-radius:50%;background:<?= $color ?>;"></div>
                            <span style="font-size:13px;text-transform:capitalize;"><?= $item['status'] ?></span>
                        </div>
                        <div class="text-right">
                            <div class="font-bold" style="font-size:13px;"><?= $item['count'] ?></div>
                            <div class="text-muted text-sm"><?= formatCurrency($item['total']) ?></div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
            <div class="card-header"><h2>Quick Actions</h2></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:8px;">
                <a href="../members/add.php" class="btn btn-primary">➕ Register Member</a>
                <a href="../loans/add.php" class="btn btn-secondary">💳 New Loan Application</a>
                <a href="../savings/deposit.php" class="btn btn-secondary">💰 Record Deposit</a>
                <a href="../savings/withdraw.php" class="btn btn-secondary">🏧 Record Withdrawal</a>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
