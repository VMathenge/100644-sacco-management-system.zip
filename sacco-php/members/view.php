<?php
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();
$id = intval($_GET['id'] ?? 0);

$member = $db->prepare("SELECT * FROM members WHERE id=?");
$member->execute([$id]);
$member = $member->fetch();

if (!$member) {
    setFlash('error', 'Member not found');
    redirect('index.php');
}

$pageTitle = $member['first_name'] . ' ' . $member['last_name'];

$savings = $db->prepare("SELECT * FROM savings_accounts WHERE member_id=? ORDER BY created_at DESC");
$savings->execute([$id]);
$savings = $savings->fetchAll();

$loans = $db->prepare("SELECT * FROM loans WHERE member_id=? ORDER BY created_at DESC");
$loans->execute([$id]);
$loans = $loans->fetchAll();

$transactions = $db->prepare("SELECT * FROM transactions WHERE member_id=? ORDER BY created_at DESC LIMIT 10");
$transactions->execute([$id]);
$transactions = $transactions->fetchAll();

$totalSavings = array_sum(array_column($savings, 'balance'));
$activeLoanBalance = array_sum(array_map(fn($l) => $l['status'] === 'active' ? $l['balance'] : 0, $loans));
$activeLoansCount = count(array_filter($loans, fn($l) => $l['status'] === 'active'));
?>

<a href="index.php" class="back-link">← Back to Members</a>

<div class="page-header">
    <div class="flex items-center gap-2">
        <div class="avatar" style="width:48px;height:48px;font-size:18px;">
            <?= strtoupper(substr($member['first_name'],0,1) . substr($member['last_name'],0,1)) ?>
        </div>
        <div>
            <h1><?= clean($member['first_name'] . ' ' . $member['last_name']) ?></h1>
            <p><?= clean($member['member_number']) ?></p>
        </div>
    </div>
    <div class="flex gap-2">
        <?= statusBadge($member['status']) ?>
        <a href="edit.php?id=<?= $id ?>" class="btn btn-secondary">✏️ Edit</a>
    </div>
</div>

<!-- Summary Cards -->
<div class="grid-3" style="margin-bottom:20px;">
    <div class="stat-card">
        <div class="stat-label">Total Savings</div>
        <div class="stat-value" style="font-size:20px;"><?= formatCurrency($totalSavings) ?></div>
        <div class="stat-sub text-muted"><?= count($savings) ?> account<?= count($savings) !== 1 ? 's' : '' ?></div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Active Loan Balance</div>
        <div class="stat-value" style="font-size:20px;"><?= formatCurrency($activeLoanBalance) ?></div>
        <div class="stat-sub" style="color:#f59e0b;"><?= $activeLoansCount ?> active loan<?= $activeLoansCount !== 1 ? 's' : '' ?></div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Share Capital</div>
        <div class="stat-value" style="font-size:20px;"><?= formatCurrency($member['share_capital']) ?></div>
        <div class="stat-sub text-muted">Member since <?= formatDate($member['join_date']) ?></div>
    </div>
</div>

<div class="grid-2" style="gap:20px;margin-bottom:20px;">
    <!-- Personal Details -->
    <div class="card">
        <div class="card-header"><h2>Personal Details</h2></div>
        <div class="card-body">
            <?php
            $details = [
                'Full Name'    => $member['first_name'] . ' ' . $member['last_name'],
                'Email'        => $member['email'],
                'Phone'        => $member['phone'],
                'National ID'  => $member['national_id'],
                'Date of Birth'=> formatDate($member['date_of_birth']),
                'Occupation'   => $member['occupation'] ?: '—',
                'Address'      => $member['address'],
                'Join Date'    => formatDate($member['join_date']),
            ];
            foreach ($details as $label => $value):
            ?>
            <div class="dl-row">
                <span class="dl-label"><?= $label ?></span>
                <span class="dl-value"><?= clean($value) ?></span>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Savings Accounts -->
    <div class="card">
        <div class="card-header">
            <h2>Savings Accounts</h2>
            <a href="../savings/deposit.php?member=<?= $id ?>" class="btn btn-primary btn-sm">+ Deposit</a>
        </div>
        <?php if (empty($savings)): ?>
        <div class="empty-state"><p>No savings accounts</p></div>
        <?php else: ?>
        <div class="card-body" style="padding:12px;">
            <?php foreach ($savings as $acc): ?>
            <div style="background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:8px;">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-medium" style="font-size:13px;"><?= clean($acc['account_number']) ?></div>
                        <div class="text-muted text-sm"><?= ucfirst($acc['account_type']) ?> • <?= $acc['interest_rate'] ?>% p.a.</div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-green"><?= formatCurrency($acc['balance']) ?></div>
                        <?= statusBadge($acc['status']) ?>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</div>

<!-- Loans -->
<div class="card" style="margin-bottom:20px;">
    <div class="card-header">
        <h2>Loans</h2>
        <a href="../loans/add.php?member=<?= $id ?>" class="btn btn-primary btn-sm">+ New Loan</a>
    </div>
    <?php if (empty($loans)): ?>
    <div class="empty-state"><p>No loans found</p></div>
    <?php else: ?>
    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>Loan #</th>
                    <th>Type</th>
                    <th>Principal</th>
                    <th>Balance</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($loans as $loan): ?>
                <tr>
                    <td><a href="../loans/view.php?id=<?= $loan['id'] ?>" class="text-green font-medium"><?= clean($loan['loan_number']) ?></a></td>
                    <td style="text-transform:capitalize;"><?= $loan['loan_type'] ?></td>
                    <td class="font-bold"><?= formatCurrency($loan['principal_amount']) ?></td>
                    <td class="font-bold"><?= formatCurrency($loan['balance']) ?></td>
                    <td><?= $loan['interest_rate'] ?>%</td>
                    <td><?= statusBadge($loan['status']) ?></td>
                    <td class="text-muted text-sm"><?= formatDate($loan['created_at']) ?></td>
                    <td><a href="../loans/view.php?id=<?= $loan['id'] ?>" class="btn btn-info btn-sm">View</a></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<!-- Recent Transactions -->
<div class="card">
    <div class="card-header"><h2>Recent Transactions</h2></div>
    <?php if (empty($transactions)): ?>
    <div class="empty-state"><p>No transactions yet</p></div>
    <?php else: ?>
    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>Transaction #</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th class="text-right">Amount</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($transactions as $tx): ?>
                <?php $isDebit = in_array($tx['type'], ['withdrawal', 'loan_disbursement']); ?>
                <tr>
                    <td class="text-muted text-sm"><?= clean($tx['transaction_number']) ?></td>
                    <td style="text-transform:capitalize;"><?= str_replace('_', ' ', $tx['type']) ?></td>
                    <td class="text-muted"><?= clean($tx['description'] ?? '—') ?></td>
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

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
