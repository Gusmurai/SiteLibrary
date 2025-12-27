<?php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Получение и динамический вывод списка всех пользователей
if ($method === 'GET') {
    $sql = "SELECT id, login, full_name, role, phone, is_blocked FROM users ORDER BY id DESC";
    $stmt = $pdo->query($sql);
    echo json_encode($stmt->fetchAll());
}

// Обработка ввода данных для создания или изменения учетных записей
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Функция обновления данных существующего пользователя
    if (isset($data['id'])) {
        $id = $data['id'];
        
        // Обработка переключения статуса блокировки
        if (isset($data['action']) && $data['action'] == 'toggle_block') {
            $sql = "UPDATE users SET is_blocked = NOT is_blocked WHERE id = ?";
            $pdo->prepare($sql)->execute([$id]);
            echo json_encode(['status' => 'success', 'message' => 'Статус доступа изменен']);
            exit;
        }

        // Проверка уникальности нового логина среди других пользователей
        $checkLogin = $pdo->prepare("SELECT id FROM users WHERE login = ? AND id != ?");
        $checkLogin->execute([$data['login'], $id]);
        if ($checkLogin->fetch()) {
            echo json_encode(['error' => 'Ошибка: пользователь с таким логином уже существует']);
            exit;
        }

        // Ввод нового пароля, если он был указан в форме
        if (!empty($data['password'])) {
            $hash = password_hash($data['password'], PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$hash, $id]);
        }
        
        // Динамическое обновление персональной информации в базе данных
        $sql = "UPDATE users SET full_name = ?, login = ?, phone = ? WHERE id = ?";
        $pdo->prepare($sql)->execute([$data['full_name'], $data['login'], $data['phone'] ?? null, $id]);
        echo json_encode(['status' => 'success', 'message' => 'Данные успешно обновлены']);
    } 
    
    // Функция ввода данных для регистрации нового пользователя
    else {
        if (empty($data['login']) || empty($data['password'])) {
            echo json_encode(['error' => 'Заполните обязательные поля: логин и пароль']);
            exit;
        }

        // Проверка на наличие дубликата логина перед созданием записи
        $check = $pdo->prepare("SELECT id FROM users WHERE login = ?");
        $check->execute([$data['login']]);
        if ($check->fetch()) {
            echo json_encode(['error' => 'Ошибка: данный логин уже занят']);
            exit;
        }

        $hash = password_hash($data['password'], PASSWORD_DEFAULT);
        $sql = "INSERT INTO users (login, password, full_name, role, phone) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        if ($stmt->execute([$data['login'], $hash, $data['full_name'], $data['role'], $data['phone'] ?? null])) {
            echo json_encode(['status' => 'success', 'message' => 'Пользователь успешно зарегистрирован']);
        }
    }
}
?>