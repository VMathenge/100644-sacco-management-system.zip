<?php
$pageTitle = 'Loans';
require_once __DIR__ . '/../includes/layout.php';

$db = getDB();
$search = trim($_GET['search'] ?? '');
$statusFilter = $_GET['status'] ?? '';

$sql = "
    SELECT l.*, m.first_name, m.last_name, m.member_number
    FROM loans l
    LEFT JOIN members m ON l.member_id = m.id
    WHERE 1=1
";
$params = [];

if ($statusFilter) {
    $sql .= " AND l.status = ?";
    $params[] = $statusFilter;
}

if ($search) {
    $sql .= " AND (l.loan_number LIKE ? OR m.first_name LIKE ? OR m.last_name LIKE ? OR m.member_number LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$sql .= " ORDER BY l.created_at DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$loans = $stmt->fetchAll();

$statuses = ['pending','approved','active','completed','defaulted','rejected'];
?>

<div class="page-header">
    <div>
        <h1>Loans</h1>
        <p><?= count($loans) ?> loan<?= count($loans) !== 1 ? 's' : '' ?></p>
    </div>
    <a href="add.php" class="btn btn-primary">➕ New Loan Application</a>
</div>

<!-- Filters -->
<div class="card mb-4" style="margin-bottom:16px;">
    <div class="card-body" style="padding:12px 16px;">
        <form method="GET" style="display:flex;gap:12px;flex-wrap:wrap;">
            <div class="search-bar" style="flex:1;min-width:200px;">
                <span class="search-icon">🔍</span>
                <input type="text" name="search" class="form-control" value="<?= clean($search) ?>"
                    placeholder="Search by loan number or member...">
            </div>
            <select name="status" class="form-control" style="width:160px;">
                <option value="">All Statuses</option>
                <?php foreach ($statuses as $s): ?>
                <option value="<?= $s ?>" <?= $statusFilter === $s ? 'selected' : '' ?>><?= ucfirst($s) ?></option>
                <?php endforeach; ?>
            </select>
            <button type="submit" class="btn btn-secondary">Filter</button>
            <?php if ($search || $statusFilter): ?>
            <a href="index.php" class="btn btn-secondary">Clear</a>
            <?php endif; ?>
        </form>
    </div>
</div>

<!-- Table -->
<div class="card">
    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>Loan #</th>
                    <th>Member</th>
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
                <?php if (empty($loans)): ?>
                <tr>
                    <td colspan="9">
                        <div class="empty-state">
                            <div class="icon">💳</div>
                            <p>No loans found</p>
                        </div>
                    </td>
                </tr>
                <?php else: ?>
                <?php foreach ($loans as $loan): ?>
                <tr>
                    <td><a href="view.php?id=<?= $loan['id'] ?>" class="text-green font-medium"><?= clean($loan['loan_number']) ?></a></td>
                    <td>
                        <a href="../members/view.php?id=<?= $loan['member_id'] ?>">
                            <div class="font-medium"><?= clean($loan['first_name'] . ' ' . $loan['last_name']) ?></div>
                            <div class="text-muted text-sm"><?= clean($loan['member_number']) ?></div>
                        </a>
                    </td>
                    <td style="text-transform:capitalize;"><?= $loan['loan_type'] ?></td>
                    <td class="font-bold"><?= formatCurrency($loan['principal_amount']) ?></td>
                    <td class="font-bold"><?= formatCurrency($loan['balance']) ?></td>
                    <td><?= $loan['interest_rate'] ?>%</td>
                    <td><?= statusBadge($loan['status']) ?></td>
                    <td class="text-muted text-sm"><?= formatDate($loan['created_at']) ?></td>
                    <td><a href="view.php?id=<?= $loan['id'] ?>" class="btn btn-info btn-sm">View</a></td>
                </tr>
                <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
