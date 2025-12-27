<?php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Функция выгрузки данных из базы в файл формата json
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM books");
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="books_export.json"');
    
    echo json_encode($books, JSON_UNESCAPED_UNICODE);
    exit;
}

// Функция загрузки данных из внешнего файла в базу данных
elseif ($method === 'POST') {
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $jsonContent = file_get_contents($_FILES['file']['tmp_name']);
        $books = json_decode($jsonContent, true);

        if (!$books) {
            echo json_encode(['error' => 'Ошибка чтения файла']);
            exit;
        }

        // Цикл динамической вставки данных в таблицу книг
        $stmt = $pdo->prepare("INSERT INTO books (title, author, genre, description, total_quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?)");
        $count = 0;
        foreach ($books as $book) {
            $stmt->execute([
                $book['title'], 
                $book['author'], 
                $book['genre'] ?? 'Разное', 
                $book['description'] ?? '', 
                $book['total_quantity'] ?? 1, 
                $book['available_quantity'] ?? 1
            ]);
            $count++;
        }
        echo json_encode(['status' => 'success', 'message' => "Загружено книг: $count"]);
    } else {
        echo json_encode(['error' => 'Файл не выбран']);
    }
}
?>