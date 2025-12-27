<?php
// api/profile.php
require 'config.php';

// Получение входного потока данных в формате json от клиента
$data = json_decode(file_get_contents("php://input"), true);
$userId = $data['user_id'] ?? null;

// Проверка наличия идентификатора пользователя для безопасности
if (!$userId) {
    echo json_encode(['error' => 'Ошибка авторизации']);
    exit;
}

// Функция динамического обновления личной информации в профиле
if (isset($data['action']) && $data['action'] === 'update_info') {
    $fullName = $data['full_name'];
    $login = $data['login'];
    $phone = $data['phone'];

    // Проверка уникальности логина при его изменении
    $check = $pdo->prepare("SELECT id FROM users WHERE login = ? AND id != ?");
    $check->execute([$login, $userId]);
    if ($check->fetch()) {
        echo json_encode(['error' => 'Данный логин уже занят']);
        exit;
    }

    // Ввод обновленных данных в таблицу пользователей
    $sql = "UPDATE users SET full_name = ?, login = ?, phone = ? WHERE id = ?";
    if ($pdo->prepare($sql)->execute([$fullName, $login, $phone, $userId])) {
        
        // Получение актуальной роли пользователя для корректного обновления состояния на стороне клиента
        $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $role = $stmt->fetchColumn();

        // Вывод обновленного объекта пользователя для синхронизации интерфейса
        echo json_encode([
            'status' => 'success', 
            'message' => 'Профиль успешно обновлен', 
            'user' => [
                'id' => $userId, 
                'login' => $login, 
                'full_name' => $fullName, 
                'phone' => $phone,
                'role' => $role
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['error' => 'Ошибка базы данных']);
    }
}

// Функция безопасной смены пароля с предварительной проверкой текущего значения
elseif (isset($data['new_password']) && isset($data['old_password'])) {
    $oldPass = $data['old_password'];
    $newPass = $data['new_password'];

    // Получение текущего хэша пароля для верификации
    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!password_verify($oldPass, $user['password'])) {
        echo json_encode(['error' => 'Старый пароль введен неверно']);
        exit;
    }

    // Ввод нового зашифрованного пароля в базу данных
    $newHash = password_hash($newPass, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$newHash, $userId]);
    
    echo json_encode(['status' => 'success', 'message' => 'Пароль успешно изменен']);
}
?>