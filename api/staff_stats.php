<?php
// api/staff_stats.php
require 'config.php';

$userId = $_GET['user_id'] ?? null;
$role = $_GET['role'] ?? null;

if (!$userId || !$role) {
    echo json_encode(['error' => 'No data']);
    exit;
}

$stats = [];

if ($role === 'admin') {
    // Стастистика для администратора
    
    // Пользователей
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $stats['total_users'] = $stmt->fetchColumn();

    //  Книг в фонде
    $stmt = $pdo->query("SELECT SUM(total_quantity) FROM books");
    $stats['total_books'] = $stmt->fetchColumn() ?: 0;

    //  Активные
    $stmt = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'active'");
    $stats['active_bookings'] = $stmt->fetchColumn();

    // Выдано
    $stmt = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'completed'");
    $stats['completed_bookings'] = $stmt->fetchColumn();

    //  Всего заявок за всё время (история)
    $stmt = $pdo->query("SELECT COUNT(*) FROM bookings");
    $stats['all_time_bookings'] = $stmt->fetchColumn();

    // Отменено + Истекло
    $stmt = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status IN ('cancelled', 'expired')");
    $stats['cancelled_bookings'] = $stmt->fetchColumn();
    
} elseif ($role === 'librarian') {
    // Статистика лоя библиотекаря
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE processed_by = ? AND status = 'completed'");
    $stmt->execute([$userId]);
    $stats['issued_by_me'] = $stmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE processed_by = ? AND status = 'cancelled'");
    $stmt->execute([$userId]);
    $stats['cancelled_by_me'] = $stmt->fetchColumn();

    $stats['total_processed'] = $stats['issued_by_me'] + $stats['cancelled_by_me'];
}

echo json_encode($stats);
?>