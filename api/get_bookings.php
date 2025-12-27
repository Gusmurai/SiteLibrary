<?php
// api/get_bookings.php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

//  ПОЛУЧЕНИЕ СПИСКА (GET) 
if ($method === 'GET') {
    // Делаем запрос:
    // 1. Соединяем с users (читатель) -> u
    // 2. Соединяем с books (книга) -> bk
    // 3. Соединяем с users (библиотекарь) -> lib (LEFT JOIN, так как его может не быть)
    
    $sql = "
        SELECT 
            b.id as booking_id,
            b.booking_date,
            b.status,
            u.full_name,
            u.login,
            u.phone,
            bk.title as book_title,
            bk.cover_image,
            lib.full_name as librarian_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN books bk ON b.book_id = bk.id
        LEFT JOIN users lib ON b.processed_by = lib.id
        ORDER BY 
            CASE WHEN b.status = 'active' THEN 1 ELSE 2 END, -- Сначала активные
            b.booking_date DESC
    ";

    $stmt = $pdo->query($sql);
    $bookings = $stmt->fetchAll();

    // Проверяем просрочку для подсветки на фронтенде
    foreach ($bookings as &$booking) {
        $bookingDate = new DateTime($booking['booking_date']);
        $now = new DateTime();
        $interval = $now->diff($bookingDate);
        // Если бронь активна и прошло > 3 дней
        $booking['is_overdue'] = ($booking['status'] === 'active' && $interval->days >= 3);
    }

    echo json_encode($bookings, JSON_UNESCAPED_UNICODE);
}

//  ОБРАБОТКА ЗАЯВКИ (POST) 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $bookingId = $data['booking_id'];
    $action = $data['action']; 
    $librarianId = $data['librarian_id']; // Кто нажал кнопку

    if ($action === 'complete') {
        // Выдаем книгу, записываем кто выдал
        $sql = "UPDATE bookings SET status = 'completed', processed_by = ? WHERE id = ?";
        $pdo->prepare($sql)->execute([$librarianId, $bookingId]);
        
    } elseif ($action === 'cancel') {
        // ЛОГИКА ОТМЕНЫ: Проверяем дату перед сменой статуса
        
        // 1. Получаем дату бронирования и ID книги
        $checkStmt = $pdo->prepare("SELECT booking_date, book_id FROM bookings WHERE id = ?");
        $checkStmt->execute([$bookingId]);
        $bookingData = $checkStmt->fetch();

        if ($bookingData) {
            $bookingDate = new DateTime($bookingData['booking_date']);
            $now = new DateTime();
            $interval = $now->diff($bookingDate);
            
            // Если прошло 3 дня и более - ставим статус 'expired' (Истекла)
            // Иначе - 'cancelled' (Отменена вручную)
            $newStatus = ($interval->days >= 3) ? 'expired' : 'cancelled';

            // 2. Обновляем статус и записываем, кто обработал
            $sql = "UPDATE bookings SET status = ?, processed_by = ? WHERE id = ?";
            $pdo->prepare($sql)->execute([$newStatus, $librarianId, $bookingId]);
            
            // 3. Возвращаем книгу на полку (+1)
            $pdo->prepare("UPDATE books SET available_quantity = available_quantity + 1 WHERE id = ?")
                ->execute([$bookingData['book_id']]);
        }
    }

    echo json_encode(['status' => 'success']);
}
?>