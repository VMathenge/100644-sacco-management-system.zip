<?php
$pageTitle = 'New Loan Application';
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();
$preselectedMember = intval($_GET['member'] ?? 0);
$errors = [];

// Get all active members
$members = $db->query("SELECT id, member_number, first_name, last_name FROM members WHERE status='active' ORDER BY first_name")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $memberId      = intval($_POST['member_id'] ?? 0);
    $loanType      = $_POST['loan_type'] ?? 'personal';
    $principal     = floatval($_POST['principal_amount'] ?? 0);
    $rate          = floatval($_POST['interest_rate'] ?? 12);
    $term          = intval($_POST['term_months'] ?? 12);
    $purpose       = trim($_POST['purpose'] ?? '');
    $guarantorId   = intval($_POST['guarantor_id'] ?? 0) ?: null;

    if (!$memberId) $errors[] = 'Please select a member';
    if ($principal <= 0) $errors[] = 'Principal amount must be greater than 0';
    if ($term <= 0) $errors[] = 'Term must be at least 1 month';

    if (empty($errors)) {
        // Calculate monthly payment (reducing balance)
        $monthlyRate = $rate / 100 / 12;
        if ($monthlyRate > 0) {
            $monthlyPayment = ($principal * $monthlyRate * pow(1 + $monthlyRate, $term)) / (pow(1 + $monthlyRate, $term) - 1);
        } else {
            $monthlyPayment = $principal / $term;
        }
        $totalAmount = $monthlyPayment * $term;

        $loanNumber = generateNumber('LN');

        $db->prepare("
            INSERT INTO loans (loan_number, member_id, loan_type, principal_amount, interest_rate,
                term_months, monthly_payment, total_amount, amount_paid, balance, status, purpose, guarantor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending', ?, ?)
        ")->execute([$loanNumber, $memberId, $loanType, $principal, $rate,
            $term, round($monthlyPayment, 2), round($totalAmount, 2), $principal, $purpose ?: null, $guarantorId]);

        setFlash('success', "Loan application {$loanNumber} submitted successfully!");
        redirect('index.php');
    }
}
?>

<a href="index.php" class="back-link">← Back to Loans</a>

<div class="page-header">
    <div>
        <h1>New Loan Application</h1>
        <p>Fill in the loan details below</p>
    </div>
</div>

<?php if (!empty($errors)): ?>
<div class="alert alert-error">
    <?php foreach ($errors as $e): ?><div>✗ <?= clean($e) ?></div><?php endforeach; ?>
</div>
<?php endif; ?>

<form method="POST" id="loanForm">
    <!-- Loan Details -->
    <div class="card mb-4" style="margin-bottom:16px;">
        <div class="card-header"><h2>Loan Details</h2></div>
        <div class="card-body">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Member *</label>
                    <select name="member_id" class="form-control" required>
                        <option value="">Select a member</option>
                        <?php foreach ($members as $m): ?>
                        <option value="<?= $m['id'] ?>"
                            <?= (($_POST['member_id'] ?? $preselectedMember) == $m['id']) ? 'selected' : '' ?>>
                            <?= clean($m['first_name'] . ' ' . $m['last_name']) ?> (<?= clean($m['member_number']) ?>)
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Loan Type *</label>
                    <select name="loan_type" class="form-control">
                        <?php foreach (['personal','business','emergency','development'] as $t): ?>
                        <option value="<?= $t ?>" <?= ($_POST['loan_type'] ?? 'personal') === $t ? 'selected' : '' ?>><?= ucfirst($t) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group col-span-2">
                    <label class="form-label">Purpose</label>
                    <textarea name="purpose" class="form-control" placeholder="Describe the purpose of the loan..."><?= clean($_POST['purpose'] ?? '') ?></textarea>
                </div>
            </div>
        </div>
    </div>

    <!-- Loan Calculator -->
    <div class="card mb-4" style="margin-bottom:16px;">
        <div class="card-header"><h2>Loan Calculator</h2></div>
        <div class="card-body">
            <div class="form-grid-3" style="margin-bottom:16px;">
                <div class="form-group">
                    <label class="form-label">Principal Amount (KES) *</label>
                    <input type="number" name="principal_amount" id="principal" class="form-control" min="1000" step="1000"
                        value="<?= $_POST['principal_amount'] ?? '50000' ?>" oninput="calcLoan()" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Interest Rate (% p.a.) *</label>
                    <input type="number" name="interest_rate" id="rate" class="form-control" min="0" max="100" step="0.5"
                        value="<?= $_POST['interest_rate'] ?? '12' ?>" oninput="calcLoan()" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Term (Months) *</label>
                    <input type="number" name="term_months" id="term" class="form-control" min="1" max="120"
                        value="<?= $_POST['term_months'] ?? '12' ?>" oninput="calcLoan()" required>
                </div>
            </div>

            <!-- Summary -->
            <div class="summary-box">
                <div class="grid-4">
                    <div class="summary-item">
                        <div class="label">Monthly Payment</div>
                        <div class="value" id="monthlyPayment">KES 0</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Total Amount</div>
                        <div class="value" id="totalAmount">KES 0</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Total Interest</div>
                        <div class="value" id="totalInterest">KES 0</div>
                    </div>
                    <div class="summary-item">
                        <div class="label">Term</div>
                        <div class="value" id="termDisplay">12 months</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Guarantor -->
    <div class="card mb-4" style="margin-bottom:16px;">
        <div class="card-header"><h2>Guarantor (Optional)</h2></div>
        <div class="card-body">
            <div class="form-group" style="max-width:400px;">
                <label class="form-label">Guarantor Member</label>
                <select name="guarantor_id" class="form-control">
                    <option value="">No guarantor</option>
                    <?php foreach ($members as $m): ?>
                    <option value="<?= $m['id'] ?>" <?= ($_POST['guarantor_id'] ?? '') == $m['id'] ? 'selected' : '' ?>>
                        <?= clean($m['first_name'] . ' ' . $m['last_name']) ?> (<?= clean($m['member_number']) ?>)
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
    </div>

    <div class="flex gap-2">
        <button type="submit" class="btn btn-primary">✓ Submit Application</button>
        <a href="index.php" class="btn btn-secondary">Cancel</a>
    </div>
</form>

<script>
function formatKES(n) {
    return 'KES ' + n.toLocaleString('en-KE', {minimumFractionDigits: 0, maximumFractionDigits: 0});
}

function calcLoan() {
    const principal = parseFloat(document.getElementById('principal').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    const term = parseInt(document.getElementById('term').value) || 0;

    const monthlyRate = rate / 100 / 12;
    let monthly = 0;
    if (monthlyRate > 0 && term > 0) {
        monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    } else if (term > 0) {
        monthly = principal / term;
    }

    const total = monthly * term;
    const interest = total - principal;

    document.getElementById('monthlyPayment').textContent = formatKES(monthly);
    document.getElementById('totalAmount').textContent = formatKES(total);
    document.getElementById('totalInterest').textContent = formatKES(interest);
    document.getElementById('termDisplay').textContent = term + ' months';
}

calcLoan();
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
