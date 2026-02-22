<?php
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();
$id = intval($_GET['id'] ?? 0);

$loan = $db->prepare("
    SELECT l.*, m.first_name, m.last_name, m.member_number, m.id AS member_id
    FROM loans l
    LEFT JOIN members m ON l.member_id = m.id
    WHERE l.id = ?
");
$loan->execute([$id]);
$loan = $loan->fetch();

if (!$loan) {
    setFlash('error', 'Loan not found');
    redirect('index.php');
}

$pageTitle = $loan['loan_number'];

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'approve' && $loan['status'] === 'pending') {
        $db->prepare("UPDATE loans SET status='approved', approved_by='Admin' WHERE id=?")->execute([$id]);
        setFlash('success', 'Loan approved successfully');
        redirect("view.php?id=$id");
    }

    if ($action === 'reject' && $loan['status'] === 'pending') {
        $db->prepare("UPDATE loans SET status='rejected' WHERE id=?")->execute([$id]);
        setFlash('success', 'Loan application rejected');
        redirect("view.php?id=$id");
    }

    if ($action === 'disburse' && $loan['status'] === 'approved') {
        $dueDate = date('Y-m-d', strtotime("+{$loan['term_months']} months"));
        $db->prepare("UPDATE loans SET status='active', disbursed_at=NOW(), due_date=? WHERE id=?")->execute([$dueDate, $id]);

        // Record transaction
        $txNum = generateNumber('TXN');
        $db->prepare("
            INSERT INTO transactions (transaction_number, member_id, type, amount, balance, description, reference_id, reference_type, processed_by)
            VALUES (?, ?, 'loan_disbursement', ?, 0, ?, ?, 'loan', 'Admin')
        ")->execute([$txNum, $loan['member_id'], $loan['principal_amount'],
            "Loan disbursement - {$loan['loan_number']}", $id]);

        setFlash('success', 'Loan disbursed successfully');
        redirect("view.php?id=$id");
    }

    if ($action === 'repay' && $loan['status'] === 'active') {
        $amount = floatval($_POST['repay_amount'] ?? 0);
        if ($amount <= 0) {
            setFlash('error', 'Invalid repayment amount');
            redirect("view.php?id=$id");
        }

        $monthlyRate = $loan['interest_rate'] / 100 / 12;
        $interestPortion = $loan['balance'] * $monthlyRate;
        $principalPortion = min($amount - $interestPortion, $loan['balance']);
        $newBalance = max(0, $loan['balance'] - $principalPortion);
        $newAmountPaid = $loan['amount_paid'] + $amount;
        $newStatus = $newBalance <= 0.01 ? 'completed' : 'active';

        $db->prepare("UPDATE loans SET balance=?, amount_paid=?, status=? WHERE id=?")
            ->execute([$newBalance, $newAmountPaid, $newStatus, $id]);

        // Record transaction
        $txNum = generateNumber('TXN');
        $db->prepare("
            INSERT INTO transactions (transaction_number, member_id, type, amount, balance, description, reference_id, reference_type, processed_by)
            VALUES (?, ?, 'loan_repayment', ?, ?, ?, ?, 'loan', 'Admin')
        ")->execute([$txNum, $loan['member_id'], $amount, $newBalance,
            "Loan repayment - {$loan['loan_number']}", $id]);

        $txId = $db->lastInsertId();

        // Record repayment detail
        $db->prepare("
            INSERT INTO loan_repayments (loan_id, member_id, amount, principal, interest, balance, transaction_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ")->execute([$id, $loan['member_id'], $amount, $principalPortion, $interestPortion, $newBalance, $txId]);

        setFlash('success', 'Repayment of ' . formatCurrency($amount) . ' recorded successfully');
        redirect("view.php?id=$id");
    }
}

// Reload loan after actions
$loan = $db->prepare("
    SELECT l.*, m.first_name, m.last_name, m.member_number, m.id AS member_id
    FROM loans l LEFT JOIN members m ON l.member_id = m.id WHERE l.id = ?
");
$loan->execute([$id]);
$loan = $loan->fetch();

// Repayments
$repayments = $db->prepare("SELECT * FROM loan_repayments WHERE loan_id=? ORDER BY payment_date DESC");
$repayments->execute([$id]);
$repayments = $repayments->fetchAll();

$progressPct = $loan['total_amount'] > 0 ? min(100, ($loan['amount_paid'] / $loan['total_amount']) * 100) : 0;
?>

<a href="index.php" class="back-link">← Back to Loans</a>

<div class="page-header">
    <div>
        <h1><?= clean($loan['loan_number']) ?></h1>
        <p style="text-transform:capitalize;"><?= $loan['loan_type'] ?> Loan</p>
    </div>
    <?= statusBadge($loan['status']) ?>
</div>

<!-- Summary Cards -->
<div class="grid-4" style="margin-bottom:20px;">
    <?php
    $cards = [
        ['Principal', formatCurrency($loan['principal_amount'])],
        ['Balance', formatCurrency($loan['balance'])],
        ['Amount Paid', formatCurrency($loan['amount_paid'])],
        ['Monthly Payment', formatCurrency($loan['monthly_payment'])],
    ];
    foreach ($cards as [$label, $value]):
    ?>
    <div class="stat-card">
        <div class="stat-label"><?= $label ?></div>
        <div class="stat-value" style="font-size:18px;"><?= $value ?></div>
    </div>
    <?php endforeach; ?>
</div>

<?php if (in_array($loan['status'], ['active','completed'])): ?>
<!-- Progress -->
<div class="card" style="margin-bottom:20px;">
    <div class="card-body">
        <div class="flex justify-between" style="margin-bottom:8px;">
            <span style="font-size:13px;font-weight:500;">Repayment Progress</span>
            <span class="text-green font-bold"><?= number_format($progressPct, 1) ?>%</span>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width:<?= $progressPct ?>%;"></div>
        </div>
        <div class="flex justify-between mt-1">
            <span class="text-muted text-sm">Paid: <?= formatCurrency($loan['amount_paid']) ?></span>
            <span class="text-muted text-sm">Total: <?= formatCurrency($loan['total_amount']) ?></span>
        </div>
    </div>
</div>
<?php endif; ?>

<div class="grid-2" style="gap:20px;margin-bottom:20px;">
    <!-- Loan Details -->
    <div class="card">
        <div class="card-header"><h2>Loan Details</h2></div>
        <div class="card-body">
            <?php
            $details = [
                'Member'        => '<a href="../members/view.php?id=' . $loan['member_id'] . '">' . clean($loan['first_name'] . ' ' . $loan['last_name']) . ' (' . clean($loan['member_number']) . ')</a>',
                'Loan Type'     => ucfirst($loan['loan_type']),
                'Interest Rate' => $loan['interest_rate'] . '% p.a.',
                'Term'          => $loan['term_months'] . ' months',
                'Purpose'       => clean($loan['purpose'] ?? '—'),
                'Applied On'    => formatDate($loan['created_at']),
                'Disbursed On'  => formatDate($loan['disbursed_at']),
                'Due Date'      => formatDate($loan['due_date']),
                'Approved By'   => clean($loan['approved_by'] ?? '—'),
            ];
            foreach ($details as $label => $value):
            ?>
            <div class="dl-row">
                <span class="dl-label"><?= $label ?></span>
                <span class="dl-value"><?= $value ?></span>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Actions -->
    <div class="card">
        <div class="card-header"><h2>Actions</h2></div>
        <div class="card-body">
            <?php if ($loan['status'] === 'pending'): ?>
            <form method="POST" style="display:flex;flex-direction:column;gap:8px;">
                <button type="submit" name="action" value="approve" class="btn btn-primary"
                    onclick="return confirm('Approve this loan application?')">
                    ✓ Approve Loan
                </button>
                <button type="submit" name="action" value="reject" class="btn btn-danger"
                    onclick="return confirm('Reject this loan application?')">
                    ✗ Reject Application
                </button>
            </form>

            <?php elseif ($loan['status'] === 'approved'): ?>
            <form method="POST">
                <button type="submit" name="action" value="disburse" class="btn btn-info"
                    onclick="return confirm('Disburse this loan to the member?')" style="width:100%;">
                    💸 Disburse Loan
                </button>
            </form>

            <?php elseif ($loan['status'] === 'active'): ?>
            <form method="POST">
                <div class="form-group">
                    <label class="form-label">Repayment Amount (KES)</label>
                    <input type="number" name="repay_amount" class="form-control" min="1" step="0.01"
                        value="<?= $loan['monthly_payment'] ?>" required>
                </div>
                <button type="submit" name="action" value="repay" class="btn btn-primary" style="width:100%;">
                    💳 Record Repayment
                </button>
            </form>

            <?php else: ?>
            <div class="empty-state" style="padding:20px;">
                <p>No actions available for <?= $loan['status'] ?> loans</p>
            </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Repayment History -->
<div class="card">
    <div class="card-header"><h2>Repayment History</h2></div>
    <?php if (empty($repayments)): ?>
    <div class="empty-state"><p>No repayments recorded yet</p></div>
    <?php else: ?>
    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Balance</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($repayments as $i => $r): ?>
                <tr>
                    <td class="text-muted"><?= count($repayments) - $i ?></td>
                    <td><?= formatDateTime($r['payment_date']) ?></td>
                    <td class="font-bold"><?= formatCurrency($r['amount']) ?></td>
                    <td><?= formatCurrency($r['principal']) ?></td>
                    <td><?= formatCurrency($r['interest']) ?></td>
                    <td class="font-bold"><?= formatCurrency($r['balance']) ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
