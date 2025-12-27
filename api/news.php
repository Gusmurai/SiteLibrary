<?php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Вывод списка всех новостей библиотеки
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM news ORDER BY publish_date DESC");
    echo json_encode($stmt->fetchAll());
}

// Управление контентом новостей
elseif ($method === 'POST') {
    $action = $_POST['action'] ?? '';
    
    // Функция удаления новости и связанного с ней изображения
    if ($action === 'delete') {
        $id = $_POST['id'] ?? null;
        $stmt = $pdo->prepare("SELECT image FROM news WHERE id = ?");
        $stmt->execute([$id]);
        $imageName = $stmt->fetchColumn();

        if ($imageName && file_exists("../uploads/news/$imageName")) {
            unlink("../uploads/news/$imageName");
        }

        $stmt = $pdo->prepare("DELETE FROM news WHERE id = ?");
        if ($stmt->execute([$id])) {
            echo json_encode(['status' => 'success', 'message' => 'Новость удалена']);
        }
        exit;
    }

    // Ввод текстовых данных новости из формы
    $title = $_POST['title'] ?? '';
    $short = $_POST['short_content'] ?? '';
    $full = $_POST['full_content'] ?? '';
    $newsId = $_POST['id'] ?? null; 
    
    if (!$title || !$short || !$full) {
        echo json_encode(['error' => 'Заполните все обязательные поля']);
        exit;
    }

    // Загрузка и сохранение файла изображения на сервере
    $imageName = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $imageName = uniqid() . '.' . $ext;
        $uploadDir = '../uploads/news/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $imageName);
    }

    // Обновление существующей записи или создание новой новости
    if ($newsId) {
        $sql = "UPDATE news SET title=?, short_content=?, full_content=?";
        $params = [$title, $short, $full];
        if ($imageName) {
            $sql .= ", image=?";
            $params[] = $imageName;
        }
        $sql .= " WHERE id=?";
        $params[] = $newsId;
        $pdo->prepare($sql)->execute($params);
        echo json_encode(['status' => 'success', 'message' => 'Новость обновлена']);
    } else {
        $sql = "INSERT INTO news (title, short_content, full_content, publish_date, image) VALUES (?, ?, ?, NOW(), ?)";
        $pdo->prepare($sql)->execute([$title, $short, $full, $imageName]);
        echo json_encode(['status' => 'success', 'message' => 'Новость добавлена']);
    }
}
?>