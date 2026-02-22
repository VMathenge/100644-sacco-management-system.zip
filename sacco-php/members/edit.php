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

$pageTitle = 'Edit ' . $member['first_name'];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName  = trim($_POST['first_name'] ?? '');
    $lastName   = trim($_POST['last_name'] ?? '');
    $email      = trim($_POST['email'] ?? '');
    $phone      = trim($_POST['phone'] ?? '');
    $dob        = trim($_POST['date_of_birth'] ?? '');
    $address    = trim($_POST['address'] ?? '');
    $occupation = trim($_POST['occupation'] ?? '');
    $status     = $_POST['status'] ?? 'active';
    $shareCapital = floatval($_POST['share_capital'] ?? 0);

    if (!$firstName) $errors[] = 'First name is required';
    if (!$lastName)  $errors[] = 'Last name is required';
    if (!$email)     $errors[] = 'Email is required';
    if (!$phone)     $errors[] = 'Phone is required';

    if (empty($errors)) {
        $db->prepare("
            UPDATE members SET first_name=?, last_name=?, email=?, phone=?,
                date_of_birth=?, address=?, occupation=?, status=?, share_capital=?
            WHERE id=?
        ")->execute([$firstName, $lastName, $email, $phone, $dob, $address,
            $occupation ?: null, $status, $shareCapital, $id]);

        setFlash('success', 'Member updated successfully');
        redirect("view.php?id=$id");
    }

    // Update member array for form repopulation
    $member = array_merge($member, $_POST);
}
?>

<a href="view.php?id=<?= $id ?>" class="back-link">← Back to Member</a>

<div class="page-header">
    <div>
        <h1>Edit Member</h1>
        <p><?= clean($member['member_number']) ?></p>
    </div>
</div>

<?php if (!empty($errors)): ?>
<div class="alert alert-error">
    <?php foreach ($errors as $e): ?><div>✗ <?= clean($e) ?></div><?php endforeach; ?>
</div>
<?php endif; ?>

<form method="POST">
    <div class="card mb-4" style="margin-bottom:16px;">
        <div class="card-header"><h2>Personal Information</h2></div>
        <div class="card-body">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">First Name *</label>
                    <input type="text" name="first_name" class="form-control" required value="<?= clean($member['first_name']) ?>">
                </div>
                <div class="form-group">
                    <label class="form-label">Last Name *</label>
                    <input type="text" name="last_name" class="form-control" required value="<?= clean($member['last_name']) ?>">
                </div>
                <div class="form-group">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" name="date_of_birth" class="form-control" value="<?= clean($member['date_of_birth']) ?>">
                </div>
                <div class="form-group">
                    <label class="form-label">Occupation</label>
                    <input type="text" name="occupation" class="form-control" value="<?= clean($member['occupation'] ?? '') ?>">
                </div>
                <div class="form-group col-span-2">
                    <label class="form-label">Address *</label>
                    <input type="text" name="address" class="form-control" required value="<?= clean($member['address']) ?>">
                </div>
            </div>
        </div>
    </div>

    <div class="card mb-4" style="margin-bottom:16px;">
        <div class="card-header"><h2>Contact Information</h2></div>
        <div class="card-body">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" name="email" class="form-control" required value="<?= clean($member['email']) ?>">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone *</label>
                    <input type="tel" name="phone" class="form-control" required value="<?= clean($member['phone']) ?>">
                </div>
            </div>
        </div>
    </div>

    <div class="card mb-4" style="margin-bottom:16px;">
        <div class="card-header"><h2>SACCO Details</h2></div>
        <div class="card-body">
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Share Capital (KES)</label>
                    <input type="number" name="share_capital" class="form-control" min="0" step="0.01" value="<?= $member['share_capital'] ?>">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select name="status" class="form-control">
                        <?php foreach (['active','inactive','suspended'] as $s): ?>
                        <option value="<?= $s ?>" <?= $member['status'] === $s ? 'selected' : '' ?>><?= ucfirst($s) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <div class="flex gap-2">
        <button type="submit" class="btn btn-primary">✓ Save Changes</button>
        <a href="view.php?id=<?= $id ?>" class="btn btn-secondary">Cancel</a>
    </div>
</form>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
