<?php
// config.php

// Настройки базы данных
$host = 'localhost';
$db   = 'library_db';
$user = 'root';
$pass = ''; // В Open Server по умолчанию пароль пустой
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$opt = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

// Разрешаем запросы с любого адреса (нужно для React, т.к. он работает на другом порту)
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: *");
header("Content-Type: application/json; charset=UTF-8");

// Если браузер отправляет предварительный запрос OPTIONS, завершаем выполнение (чтобы не было ошибок CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $pdo = new PDO($dsn, $user, $pass, $opt);
} catch (\PDOException $e) {
    // Если ошибка подключения, выводим её
    echo json_encode(['error' => 'Ошибка подключения к БД: ' . $e->getMessage()]);
    exit;
}
?>