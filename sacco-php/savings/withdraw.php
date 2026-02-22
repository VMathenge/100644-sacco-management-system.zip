<?php
$pageTitle = 'Record Withdrawal';
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();
$preselectedAccount = intval($_GET['account'] ?? 0);
$errors = [];

$accounts = $db->query("
    SELECT sa.*, m.first_name, m.last_name
    FROM savings_accounts sa
    LEFT JOIN members m ON sa.member_id = m.id
    WHERE sa.status = 'active'
    ORDER BY m.first_name
")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accountId   = intval($_POST['account_id'] ?? 0);
    $amount      = floatval($_POST['amount'] ?? 0);
    $description = trim($_POST['description'] ?? '');

    if (!$accountId) $errors[] = 'Please select an account';
    if ($amount <= 0) $errors[] = 'Amount must be greater than 0';

    if (empty($errors)) {
        $account = $db->prepare("SELECT * FROM savings_accounts WHERE id=? AND status='active'");
        $account->execute([$accountId]);
        $account = $account->fetch();

        if (!$account) {
            $errors[] = 'Account not found or inactive';
        } elseif ($amount > $account['balance']) {
            $errors[] = 'Insufficient balance. Available: ' . formatCurrency($account['balance']);
        } else {
            $newBalance = $account['balance'] - $amount;

            $db->prepare("UPDATE savings_accounts SET balance=? WHERE id=?")->execute([$newBalance, $accountId]);

            $txNum = generateNumber('TXN');
            $db->prepare("
                INSERT INTO transactions (transaction_number, member_id, type, amount, balance, description, reference_id, reference_type, processed_by)
                VALUES (?, ?, 'withdrawal', ?, ?, ?, ?, 'savings', 'Admin')
            ")->execute([$txNum, $account['member_id'], $amount, $newBalance,
                $description ?: 'Savings withdrawal', $accountId]);

            setFlash('success', 'Withdrawal of ' . formatCurrency($amount) . ' recorded. New balance: ' . formatCurrency($newBalance));
            redirect('index.php');
        }
    }
}
?>

<a href="index.php" class="back-link">← Back to Savings</a>

<div class="page-header">
    <div>
        <h1>Record Withdrawal</h1>
        <p>Withdraw funds from a member's savings account</p>
    </div>
</div>

<?php if (!empty($errors)): ?>
<div class="alert alert-error">
    <?php foreach ($errors as $e): ?><div>✗ <?= clean($e) ?></div><?php endforeach; ?>
</div>
<?php endif; ?>

<form method="POST" style="max-width:500px;">
    <div class="card">
        <div class="card-body">
            <div class="form-group">
                <label class="form-label">Savings Account *</label>
                <select name="account_id" class="form-control" required>
                    <option value="">Select an account</option>
                    <?php foreach ($accounts as $acc): ?>
                    <option value="<?= $acc['id'] ?>"
                        <?= (($_POST['account_id'] ?? $preselectedAccount) == $acc['id']) ? 'selected' : '' ?>>
                        <?= clean($acc['account_number']) ?> — <?= clean($acc['first_name'] . ' ' . $acc['last_name']) ?>
                        (Bal: <?= formatCurrency($acc['balance']) ?>)
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Amount (KES) *</label>
                <input type="number" name="amount" class="form-control" min="1" step="0.01" required
                    value="<?= clean($_POST['amount'] ?? '') ?>" placeholder="2000">
            </div>

            <div class="form-group">
                <label class="form-label">Description / Reason</label>
                <input type="text" name="description" class="form-control"
                    value="<?= clean($_POST['description'] ?? '') ?>" placeholder="Withdrawal reason">
            </div>
        </div>
    </div>

    <div class="flex gap-2 mt-4">
        <button type="submit" class="btn btn-danger">🏧 Record Withdrawal</button>
        <a href="index.php" class="btn btn-secondary">Cancel</a>
    </div>
</form>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
