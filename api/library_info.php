<?php
// api/library_info.php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM library_info WHERE id = 1");
    $info = $stmt->fetch();

    // 1. Считаем всего книг в фонде
    $stmtTotal = $pdo->query("SELECT SUM(total_quantity) FROM books");
    $info['book_count'] = $stmtTotal->fetchColumn() ?: 0;

    // 2. Считаем АКТИВНЫЕ брони (сколько людей забронировали и ждут/читают)
    $stmtActive = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'active'");
    $info['active_bookings'] = $stmtActive->fetchColumn() ?: 0;

    // 3. Считаем ВЫДАННЫЕ книги (история успеха)
    $stmtCompleted = $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'completed'");
    $info['completed_bookings'] = $stmtCompleted->fetchColumn() ?: 0;

    echo json_encode($info, JSON_UNESCAPED_UNICODE);
}

// POST часть оставляем без изменений (для сохранения настроек админа)
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $sql = "UPDATE library_info SET 
            library_name = ?, address = ?, phone = ?, email = ?, description = ?, map_code = ?
            WHERE id = 1";
            
    $stmt = $pdo->prepare($sql);
    if ($stmt->execute([
        $data['library_name'], $data['address'], $data['phone'], $data['email'], $data['description'], $data['map_code']
    ])) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['error' => 'Ошибка БД']);
    }
}
?>