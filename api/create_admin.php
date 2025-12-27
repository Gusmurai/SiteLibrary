<?php
require 'config.php';

// Данные будущего админа
$login = 'admin';
$password = 'adminpass'; // Пароль, который мы хотим
$fullName = 'Главный Администратор';
$role = 'admin';

// Хэшируем пароль (самое важное требование безопасности!)
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// Проверяем, нет ли уже такого пользователя
$stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE login = ?");
$stmt->execute([$login]);
if ($stmt->fetchColumn() > 0) {
    echo json_encode(['message' => 'Пользователь admin уже существует!']);
    exit;
}

// Вставляем в базу
$sql = "INSERT INTO users (login, password, full_name, role) VALUES (?, ?, ?, ?)";
$stmt = $pdo->prepare($sql);

try {
    $stmt->execute([$login, $passwordHash, $fullName, $role]);
    echo json_encode(['message' => "Администратор создан! Логин: $login, Пароль: $password"]);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Ошибка создания: ' . $e->getMessage()]);
}
?>