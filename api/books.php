<?php
require 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Получение списка книг из базы данных
if ($method === 'GET') {
    $showArchived = isset($_GET['show_archived']) && $_GET['show_archived'] === 'true';

    // Формирование запроса в зависимости от прав доступа текущего пользователя
    $sql = "SELECT * FROM books";
    if (!$showArchived) {
        $sql .= " WHERE is_archived = 0";
    }
    $sql .= " ORDER BY title ASC";

    $stmt = $pdo->query($sql);
    // Вывод данных в формате json для отображения на странице
    echo json_encode($stmt->fetchAll());
}

// Обработка изменений в каталоге книг
elseif ($method === 'POST') {
    $action = $_POST['action'] ?? '';

    // Функция переключения статуса архивности книги
    if ($action === 'toggle_archive') {
        $id = $_POST['id'];
        $sql = "UPDATE books SET is_archived = NOT is_archived WHERE id = ?";
        $pdo->prepare($sql)->execute([$id]);
        echo json_encode(['status' => 'success', 'message' => 'Статус изменен']);
        exit;
    }

    // Ввод данных из формы редактирования или добавления книги
    $title = $_POST['title'] ?? '';
    $author = $_POST['author'] ?? '';
    $genre = $_POST['genre'] ?? '';
    $desc = $_POST['description'] ?? '';
    $total = (int)($_POST['total_quantity'] ?? 0);
    $available = (int)($_POST['available_quantity'] ?? 0);
    $bookId = $_POST['id'] ?? null;

    // Проверка корректности введенных числовых значений
    if ($available > $total) {
        echo json_encode(['error' => 'Ошибка: доступных книг больше, чем всего в фонде']);
        exit;
    }

    // Обработка загрузки изображения обложки на сервер
    $imageName = null;
    if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES['cover_image']['name'], PATHINFO_EXTENSION);
        $imageName = uniqid() . '.' . $ext;
        $uploadDir = '../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        move_uploaded_file($_FILES['cover_image']['tmp_name'], $uploadDir . $imageName);
    }

    // Динамическое обновление существующей записи в базе данных
    if ($bookId) {
        $sql = "UPDATE books SET title=?, author=?, genre=?, description=?, total_quantity=?, available_quantity=? WHERE id=?";
        $params = [$title, $author, $genre, $desc, $total, $available, $bookId];
        $pdo->prepare($sql)->execute($params);
        
        if ($imageName) {
            $pdo->prepare("UPDATE books SET cover_image=? WHERE id=?")->execute([$imageName, $bookId]);
        }
        echo json_encode(['status' => 'success', 'message' => 'Книга обновлена']);
    } 
    // Динамический ввод новой записи в базу данных
    else {
        if (!isset($_POST['available_quantity'])) $available = $total;
        $sql = "INSERT INTO books (title, author, genre, description, total_quantity, available_quantity, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$title, $author, $genre, $desc, $total, $available, $imageName]);
        echo json_encode(['status' => 'success', 'message' => 'Книга добавлена']);
    }
}
?>