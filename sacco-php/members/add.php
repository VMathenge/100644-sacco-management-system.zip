<?php
$pageTitle = 'Register Member';
require_once __DIR__ . '/../includes/layout.php';

$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db = getDB();

    $firstName  = trim($_POST['first_name'] ?? '');
    $lastName   = trim($_POST['last_name'] ?? '');
    $email      = trim($_POST['email'] ?? '');
    $phone      = trim($_POST['phone'] ?? '');
    $nationalId = trim($_POST['national_id'] ?? '');
    $dob        = trim($_POST['date_of_birth'] ?? '');
    $address    = trim($_POST['address'] ?? '');
    $occupation = trim($_POST['occupation'] ?? '');
    $status     = $_POST['status'] ?? 'active';
    $shareCapital = floatval($_POST['share_capital'] ?? 0);

    // Validation
    if (!$firstName) $errors[] = 'First name is required';
    if (!$lastName)  $errors[] = 'Last name is required';
    if (!$email)     $errors[] = 'Email is required';
    if (!$phone)     $errors[] = 'Phone is required';
    if (!$nationalId) $errors[] = 'National ID is required';
    if (!$dob)       $errors[] = 'Date of birth is required';
    if (!$address)   $errors[] = 'Address is required';

    if (empty($errors)) {
        // Check duplicates
        $check = $db->prepare("SELECT id FROM members WHERE email=? OR national_id=?");
        $check->execute([$email, $nationalId]);
        if ($check->fetch()) {
            $errors[] = 'A member with this email or National ID already exists';
        }
    }

    if (empty($errors)) {
        $memberNumber = generateNumber('MBR');

        $stmt = $db->prepare("
            INSERT INTO members (member_number, first_name, last_name, email, phone, national_id,
                date_of_birth, address, occupation, status, share_capital, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        ");
        $stmt->execute([$memberNumber, $firstName, $lastName, $email, $phone, $nationalId,
            $dob, $address, $occupation ?: null, $status, $shareCapital]);

        $memberId = $db->lastInsertId();

        // Auto-create savings account
        $accNumber = generateNumber('SAV');
        $db->prepare("
            INSERT INTO savings_accounts (account_number, member_id, account_type, balance, interest_rate, status)
            VALUES (?, ?, 'regular', 0, 3.50, 'active')
        ")->execute([$accNumber, $memberId]);

        setFlash('success', "Member {$firstName} {$lastName} registered successfully! Member #: {$memberNumber}");
        redirect('index.php');
    }
}
?>

<a href="index.php" class="back-link">← Back to Members</a>

<div class="page-header">
    <div>
        <h1>Register New Member</h1>
        <p>Fill in the member details below</p>
    </div>
</div>

<?php if (!empty($errors)): ?>
<div class="alert alert-error">
    <div>
        <strong>Please fix the following errors:</strong>
        <ul style="margin-top:6px;padding-left:16px;">
            <?php foreach ($errors as $e): ?>
            <li><?= clean($e) ?></li>
            <?php endforeach; ?>
        </ul>
    </div>
</div>
<?php endif; ?>

<form method="POST">
    <!-- Personal Information -->
    <div class="card mb-4" style="margin-bottom:16px;">
        <div class="card-header"><h2>Personal Information</h2></div>
        <div class="card-body">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">First Name *</label>
                    <input type="text" name="first_name" class="form-control" required
                        value="<?= clean($_POST['first_name'] ?? '') ?>" placeholder="John">
                </div>
                <div class="form-group">
                    <label class="form-label">Last Name *</label>
                    <input type="text" name="last_name" class="form-control" required
                        value="<?= clean($_POST['last_name'] ?? '') ?>" placeholder="Doe">
                </div>
                <div class="form-group">
                    <label class="form-label">National ID *</label>
                    <input type="text" name="national_id" class="form-control" required
                        value="<?= clean($_POST['national_id'] ?? '') ?>" placeholder="12345678">
                </div>
                <div class="form-group">
                    <label class="form-label">Date of Birth *</label>
                    <input type="date" name="date_of_birth" class="form-control" required
                        value="<?= clean($_POST['date_of_birth'] ?? '') ?>">
                </div>
                <div class="form-group">
                    <label class="form-label">Occupation</label>
                    <input type="text" name="occupation" class="form-control"
                        value="<?= clean($_POST['occupation'] ?? '') ?>" placeholder="e.g. Teacher, Farmer">
                </div>
                <div class="form-group">
                    <label class="form-label">Address *</label>
                    <input type="text" name="address" class="form-control" required
                        value="<?= clean($_POST['address'] ?? '') ?>" placeholder="P.O. Box 123, Nairobi">
                </div>
            </div>
        </div>
    </div>

    <!-- Contact Information -->
    <div class="card mb-4" style="margin-bottom:16px;">
        <div class="card-header"><h2>Contact Information</h2></div>
        <div class="card-body">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input type="email" name="email" class="form-control" required
                        value="<?= clean($_POST['email'] ?? '') ?>" placeholder="john@example.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" name="phone" class="form-control" required
                        value="<?= clean($_POST['phone'] ?? '') ?>" placeholder="+254 700 000 000">
                </div>
            </div>
        </div>
    </div>

    <!-- SACCO Details -->
    <div class="card mb-4" style="margin-bottom:16px;">
        <div class="card-header"><h2>SACCO Details</h2></div>
        <div class="card-body">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Share Capital (KES)</label>
                    <input type="number" name="share_capital" class="form-control" min="0" step="0.01"
                        value="<?= clean($_POST['share_capital'] ?? '0') ?>">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select name="status" class="form-control">
                        <option value="active" <?= ($_POST['status'] ?? 'active') === 'active' ? 'selected' : '' ?>>Active</option>
                        <option value="inactive" <?= ($_POST['status'] ?? '') === 'inactive' ? 'selected' : '' ?>>Inactive</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <div class="flex gap-2">
        <button type="submit" class="btn btn-primary">✓ Register Member</button>
        <a href="index.php" class="btn btn-secondary">Cancel</a>
    </div>
</form>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
