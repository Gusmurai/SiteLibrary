<?php
// api/book_book.php
require 'config.php';

// Получение данных запроса в формате json
$data = json_decode(file_get_contents("php://input"), true);

$userId = $data['user_id'] ?? null;
$bookId = $data['book_id'] ?? null;

// Проверка наличия обязательных идентификаторов
if (!$userId || !$bookId) {
    echo json_encode(['error' => 'Некорректные данные запроса']);
    exit;
}

try {
    // Начало транзакции для обеспечения целостности данных
    $pdo->beginTransaction();

    // 1. Проверка наличия книги на полке
    $stmt = $pdo->prepare("SELECT available_quantity, title FROM books WHERE id = ? FOR UPDATE");
    $stmt->execute([$bookId]);
    $book = $stmt->fetch();

    if (!$book || $book['available_quantity'] < 1) {
        throw new Exception("Выбранной книги нет в наличии");
    }

    // 2. Проверка лимита активных бронирований (максимум 5 книг)
    $stmtLimit = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE user_id = ? AND status = 'active'");
    $stmtLimit->execute([$userId]);
    $activeCount = $stmtLimit->fetchColumn();

    if ($activeCount >= 5) {
        throw new Exception("Достигнут лимит бронирований. Одновременно можно забронировать не более 5 книг.");
    }

    // 3. Проверка на наличие повторной брони этой же книги
    $stmtCheck = $pdo->prepare("SELECT id FROM bookings WHERE user_id = ? AND book_id = ? AND status = 'active'");
    $stmtCheck->execute([$userId, $bookId]);
    if ($stmtCheck->fetch()) {
        throw new Exception("Вы уже забронировали этот экземпляр книги");
    }

    // 4. Ввод новой записи о бронировании в базу данных
    $stmtInsert = $pdo->prepare("INSERT INTO bookings (user_id, book_id, booking_date, status) VALUES (?, ?, NOW(), 'active')");
    $stmtInsert->execute([$userId, $bookId]);

    // 5. Динамическое уменьшение доступного количества экземпляров в каталоге
    $stmtUpdate = $pdo->prepare("UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?");
    $stmtUpdate->execute([$bookId]);

    // Подтверждение всех изменений в базе данных
    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => "Книга забронирована! Заберите её в течение 3 дней."]);

} catch (Exception $e) {
    // Отмена всех операций в случае ошибки
    $pdo->rollBack();
    echo json_encode(['error' => $e->getMessage()]);
}
?>