<?php
// api/get_user_info.php
require 'config.php';

// Получение данных динамическим выводом из базы по ID
if (isset($_GET['id'])) {
    $stmt = $pdo->prepare("SELECT id, login, full_name, role, phone FROM users WHERE id = ?");
    $stmt->execute([$_GET['id']]);
    $user = $stmt->fetch();

    if ($user) {
        echo json_encode($user, JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['error' => 'Пользователь не найден']);
    }
}
?>