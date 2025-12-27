<?php
// api/login.php
require 'config.php';

/**
 * Получаем данные, отправленные с клиента (React)
 * React отправляет данные в формате JSON, поэтому $_POST здесь не сработает напрямую
 */
$data = json_decode(file_get_contents("php://input"), true);

// Проверяем, пришли ли данные
if (!isset($data['login']) || !isset($data['password'])) {
    echo json_encode(['error' => 'Не введен логин или пароль']);
    exit;
}

$login = $data['login'];
$password = $data['password'];

// Ищем пользователя в БД по логину
$stmt = $pdo->prepare("SELECT * FROM users WHERE login = ?");
$stmt->execute([$login]);
$user = $stmt->fetch();

/**
 * Проверяем 2 вещи:
 * 1. Нашелся ли пользователь ($user)
 * 2. Совпадает ли пароль с хэшем в базе (password_verify)
 */
if ($user && password_verify($password, $user['password'])) {
    
    // Если пользователь заблокирован - не пускаем
    if ($user['is_blocked'] == 1) {
        echo json_encode(['error' => 'Ваш аккаунт заблокирован. Обратитесь к библиотекарю.']);
        exit;
    }

    // Успешный вход! Возвращаем данные пользователя (без пароля!)
    echo json_encode([
        'status' => 'success',
        'user' => [
            'id' => $user['id'],
            'login' => $user['login'],
            'full_name' => $user['full_name'],
            'role' => $user['role'] // admin, librarian или reader
        ]
    ], JSON_UNESCAPED_UNICODE);
} else {
    // Ошибка входа
    echo json_encode(['error' => 'Неверный логин или пароль'], JSON_UNESCAPED_UNICODE);
}
?>