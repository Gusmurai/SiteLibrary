<?php
require 'config.php';

// Получение входного потока данных для регистрации
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['login']) || !isset($data['password']) || !isset($data['full_name'])) {
    echo json_encode(['error' => 'Заполните все необходимые поля']);
    exit;
}

$login = $data['login'];
$fullName = $data['full_name'];
$role = $data['role'] ?? 'reader';

// Функция проверки уникальности логина перед вводом новой записи в базу
$stmt = $pdo->prepare("SELECT id FROM users WHERE login = ?");
$stmt->execute([$login]);
if ($stmt->fetch()) {
    echo json_encode(['error' => 'Пользователь с таким логином уже зарегистрирован']);
    exit;
}

// Динамический ввод нового пользователя в таблицу
$password = password_hash($data['password'], PASSWORD_DEFAULT);
$sql = "INSERT INTO users (login, password, full_name, role) VALUES (?, ?, ?, ?)";
$stmt = $pdo->prepare($sql);

if ($stmt->execute([$login, $password, $fullName, $role])) {
    echo json_encode(['status' => 'success', 'message' => 'Регистрация прошла успешно']);
} else {
    echo json_encode(['error' => 'Ошибка базы данных при регистрации']);
}
?>