<?php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Вывод истории бронирований для конкретного пользователя
if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        echo json_encode([]);
        exit;
    }

    // Получение связанных данных из таблиц бронирования и книг
    $sql = "SELECT b.id, b.booking_date, b.status, bk.title, bk.author, bk.cover_image
            FROM bookings b
            JOIN books bk ON b.book_id = bk.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    echo json_encode($stmt->fetchAll());
}

// Функция отмены бронирования пользователем с возвратом книги в фонд
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $bookingId = $data['booking_id'];
    $userId = $data['user_id'];

    // Проверка прав собственности на бронь перед внесением изменений
    $check = $pdo->prepare("SELECT book_id FROM bookings WHERE id = ? AND user_id = ? AND status = 'active'");
    $check->execute([$bookingId, $userId]);
    $bookId = $check->fetchColumn();

    if (!$bookId) {
        echo json_encode(['error' => 'Запись не найдена']);
        exit;
    }

    // Динамическое обновление статуса и увеличение доступного количества книг
    $pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?")->execute([$bookingId]);
    $pdo->prepare("UPDATE books SET available_quantity = available_quantity + 1 WHERE id = ?")->execute([$bookId]);

    echo json_encode(['status' => 'success', 'message' => 'Бронь отменена']);
}
?>