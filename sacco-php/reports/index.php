<?php
$pageTitle = 'Reports';
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();

// Member stats
$memberStats = $db->query("SELECT status, COUNT(*) as count FROM members GROUP BY status")->fetchAll();
$totalMembers = array_sum(array_column($memberStats, 'count'));

// Loan portfolio health
$loanHealth = $db->query("SELECT status, COUNT(*) as count, COALESCE(SUM(balance),0) as total FROM loans GROUP BY status")->fetchAll();
$totalLoans = array_sum(array_column($loanHealth, 'count'));

// Loans by type (active)
$loansByType = $db->query("
    SELECT loan_type, COUNT(*) as count,
        COALESCE(SUM(principal_amount),0) as total_principal,
        COALESCE(SUM(balance),0) as total_balance
    FROM loans WHERE status='active'
    GROUP BY loan_type
")->fetchAll();

// Transaction summary
$txSummary = $db->query("
    SELECT type, COUNT(*) as count, COALESCE(SUM(amount),0) as total
    FROM transactions GROUP BY type ORDER BY total DESC
")->fetchAll();

// Top savers
$topSavers = $db->query("
    SELECT m.id, m.first_name, m.last_name, m.member_number,
        COALESCE(SUM(sa.balance),0) as total_savings
    FROM members m
    LEFT JOIN savings_accounts sa ON sa.member_id = m.id AND sa.status='active'
    GROUP BY m.id
    HAVING total_savings > 0
    ORDER BY total_savings DESC
    LIMIT 10
")->fetchAll();

// Key totals
$totalSavings = $db->query("SELECT COALESCE(SUM(balance),0) FROM savings_accounts WHERE status='active'")->fetchColumn();
$totalLoanPortfolio = $db->query("SELECT COALESCE(SUM(balance),0) FROM loans WHERE status='active'")->fetchColumn();
$totalRepayments = $db->query("SELECT COALESCE(SUM(amount),0) FROM loan_repayments")->fetchColumn();

$statusColors = [
    'active' => '#10b981', 'pending' => '#f59e0b', 'approved' => '#3b82f6',
    'completed' => '#94a3b8', 'defaulted' => '#ef4444', 'rejected' => '#f43f5e',
];
$loanTypeColors = [
    'personal' => '#3b82f6', 'business' => '#10b981', 'emergency' => '#ef4444', 'development' => '#7c3aed',
];
?>

<div class="page-header">
    <div>
        <h1>Reports</h1>
        <p>SACCO performance overview and analytics</p>
    </div>
    <div class="text-muted text-sm">Generated: <?= date('d M Y, H:i') ?></div>
</div>

<!-- Key Metrics -->
<div class="grid-4" style="margin-bottom:20px;">
    <?php
    $metrics = [
        ['Total Members', number_format($totalMembers), '👥'],
        ['Total Savings', formatCurrency($totalSavings), '💰'],
        ['Loan Portfolio', formatCurrency($totalLoanPortfolio), '📋'],
        ['Total Repayments', formatCurrency($totalRepayments), '✅'],
    ];
    foreach ($metrics as [$label, $value, $icon]):
    ?>
    <div class="stat-card">
        <div style="font-size:24px;margin-bottom:8px;"><?= $icon ?></div>
        <div class="stat-label"><?= $label ?></div>
        <div class="stat-value" style="font-size:18px;"><?= $value ?></div>
    </div>
    <?php endforeach; ?>
</div>

<div class="grid-2" style="gap:20px;margin-bottom:20px;">
    <!-- Member Status -->
    <div class="card">
        <div class="card-header"><h2>Member Status Distribution</h2></div>
        <div class="card-body">
            <?php if (empty($memberStats)): ?>
            <div class="empty-state" style="padding:20px;"><p>No member data</p></div>
            <?php else: ?>
            <?php foreach ($memberStats as $stat): ?>
            <?php
                $pct = $totalMembers > 0 ? ($stat['count'] / $totalMembers) * 100 : 0;
                $colors = ['active' => '#10b981', 'inactive' => '#94a3b8', 'suspended' => '#ef4444'];
                $color = $colors[$stat['status']] ?? '#94a3b8';
            ?>
            <div style="margin-bottom:14px;">
                <div class="flex justify-between" style="margin-bottom:4px;font-size:13px;">
                    <span style="text-transform:capitalize;"><?= $stat['status'] ?></span>
                    <span class="font-bold"><?= $stat['count'] ?> (<?= number_format($pct, 1) ?>%)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:<?= $pct ?>%;background:<?= $color ?>;"></div>
                </div>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <!-- Loan Portfolio Health -->
    <div class="card">
        <div class="card-header"><h2>Loan Portfolio Health</h2></div>
        <div class="card-body">
            <?php if (empty($loanHealth)): ?>
            <div class="empty-state" style="padding:20px;"><p>No loan data</p></div>
            <?php else: ?>
            <?php foreach ($loanHealth as $item): ?>
            <?php
                $pct = $totalLoans > 0 ? ($item['count'] / $totalLoans) * 100 : 0;
                $color = $statusColors[$item['status']] ?? '#94a3b8';
            ?>
            <div style="margin-bottom:14px;">
                <div class="flex justify-between" style="margin-bottom:4px;font-size:13px;">
                    <span style="text-transform:capitalize;"><?= $item['status'] ?></span>
                    <div class="text-right">
                        <span class="font-bold"><?= $item['count'] ?> loans</span>
                        <span class="text-muted" style="margin-left:8px;">(<?= formatCurrency($item['total']) ?>)</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:<?= $pct ?>%;background:<?= $color ?>;"></div>
                </div>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <!-- Loans by Type -->
    <div class="card">
        <div class="card-header"><h2>Active Loans by Type</h2></div>
        <div class="card-body">
            <?php if (empty($loansByType)): ?>
            <div class="empty-state" style="padding:20px;"><p>No active loans</p></div>
            <?php else: ?>
            <?php foreach ($loansByType as $item): ?>
            <?php $color = $loanTypeColors[$item['loan_type']] ?? '#94a3b8'; ?>
            <div class="flex items-center" style="margin-bottom:14px;gap:12px;">
                <div style="width:12px;height:12px;border-radius:50%;background:<?= $color ?>;flex-shrink:0;"></div>
                <div style="flex:1;">
                    <div class="flex justify-between" style="font-size:13px;">
                        <span style="text-transform:capitalize;"><?= $item['loan_type'] ?></span>
                        <span class="font-bold"><?= $item['count'] ?> loans</span>
                    </div>
                    <div class="flex justify-between text-muted text-sm">
                        <span>Principal: <?= formatCurrency($item['total_principal']) ?></span>
                        <span>Balance: <?= formatCurrency($item['total_balance']) ?></span>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <!-- Transaction Summary -->
    <div class="card">
        <div class="card-header"><h2>Transaction Summary</h2></div>
        <div class="card-body">
            <?php if (empty($txSummary)): ?>
            <div class="empty-state" style="padding:20px;"><p>No transactions</p></div>
            <?php else: ?>
            <?php foreach ($txSummary as $tx): ?>
            <div class="dl-row">
                <span class="dl-label" style="text-transform:capitalize;"><?= str_replace('_', ' ', $tx['type']) ?></span>
                <div class="text-right">
                    <div class="font-bold" style="font-size:13px;"><?= formatCurrency($tx['total']) ?></div>
                    <div class="text-muted text-sm"><?= $tx['count'] ?> transactions</div>
                </div>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Top Savers -->
<div class="card">
    <div class="card-header"><h2>Top 10 Savers</h2></div>
    <?php if (empty($topSavers)): ?>
    <div class="empty-state"><p>No savings data available</p></div>
    <?php else: ?>
    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Member</th>
                    <th>Member Number</th>
                    <th class="text-right">Total Savings</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($topSavers as $i => $saver): ?>
                <tr>
                    <td class="text-muted font-bold"><?= $i + 1 ?></td>
                    <td>
                        <div class="flex items-center gap-2">
                            <div class="avatar"><?= strtoupper(substr($saver['first_name'],0,1) . substr($saver['last_name'],0,1)) ?></div>
                            <a href="../members/view.php?id=<?= $saver['id'] ?>" class="font-medium">
                                <?= clean($saver['first_name'] . ' ' . $saver['last_name']) ?>
                            </a>
                        </div>
                    </td>
                    <td class="text-muted"><?= clean($saver['member_number']) ?></td>
                    <td class="text-right font-bold text-green"><?= formatCurrency($saver['total_savings']) ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
