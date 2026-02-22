<?php
$pageTitle = 'Members';
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();
$search = trim($_GET['search'] ?? '');

$sql = "
    SELECT m.*,
        COALESCE((SELECT SUM(balance) FROM savings_accounts WHERE member_id=m.id AND status='active'), 0) AS savings_balance,
        COALESCE((SELECT COUNT(*) FROM loans WHERE member_id=m.id AND status='active'), 0) AS active_loans
    FROM members m
";

if ($search) {
    $sql .= " WHERE m.first_name LIKE :s OR m.last_name LIKE :s OR m.email LIKE :s OR m.member_number LIKE :s OR m.phone LIKE :s";
    $stmt = $db->prepare($sql . " ORDER BY m.created_at DESC");
    $stmt->execute([':s' => "%$search%"]);
} else {
    $stmt = $db->query($sql . " ORDER BY m.created_at DESC");
}

$members = $stmt->fetchAll();
?>

<div class="page-header">
    <div>
        <h1>Members</h1>
        <p><?= count($members) ?> member<?= count($members) !== 1 ? 's' : '' ?> registered</p>
    </div>
    <a href="add.php" class="btn btn-primary">➕ Register Member</a>
</div>

<!-- Search -->
<div class="card mb-4" style="margin-bottom:16px;">
    <div class="card-body" style="padding:12px 16px;">
        <form method="GET">
            <div class="search-bar">
                <span class="search-icon">🔍</span>
                <input type="text" name="search" class="form-control" value="<?= clean($search) ?>"
                    placeholder="Search by name, email, phone, or member number...">
            </div>
        </form>
    </div>
</div>

<!-- Table -->
<div class="card">
    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Savings</th>
                    <th>Share Capital</th>
                    <th>Active Loans</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($members)): ?>
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">👥</div>
                            <p><?= $search ? 'No members found for "' . clean($search) . '"' : 'No members registered yet' ?></p>
                        </div>
                    </td>
                </tr>
                <?php else: ?>
                <?php foreach ($members as $m): ?>
                <tr>
                    <td>
                        <div class="flex items-center gap-2">
                            <div class="avatar"><?= strtoupper(substr($m['first_name'],0,1) . substr($m['last_name'],0,1)) ?></div>
                            <div>
                                <div class="font-medium"><?= clean($m['first_name'] . ' ' . $m['last_name']) ?></div>
                                <div class="text-muted text-sm"><?= clean($m['member_number']) ?></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div><?= clean($m['email']) ?></div>
                        <div class="text-muted text-sm"><?= clean($m['phone']) ?></div>
                    </td>
                    <td class="font-bold"><?= formatCurrency($m['savings_balance']) ?></td>
                    <td class="font-bold"><?= formatCurrency($m['share_capital']) ?></td>
                    <td>
                        <span class="badge <?= $m['active_loans'] > 0 ? 'badge-warning' : 'badge-inactive' ?>">
                            <?= $m['active_loans'] ?>
                        </span>
                    </td>
                    <td><?= statusBadge($m['status']) ?></td>
                    <td>
                        <div class="flex gap-2">
                            <a href="view.php?id=<?= $m['id'] ?>" class="btn btn-info btn-sm">View</a>
                            <a href="edit.php?id=<?= $m['id'] ?>" class="btn btn-secondary btn-sm">Edit</a>
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
