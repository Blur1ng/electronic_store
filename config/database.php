<?php
// Конфигурация базы данных (PostgreSQL)
define('DB_HOST', getenv('DB_HOST') ?: 'postgres');
define('DB_NAME', getenv('DB_NAME') ?: 'electronics_store');
define('DB_USER', getenv('DB_USER') ?: 'store_user');
define('DB_PASS', getenv('DB_PASS') ?: 'store_password');
define('DB_PORT', getenv('DB_PORT') ?: '5432');

// Настройки приложения
define('SITE_URL', getenv('SITE_URL') ?: 'http://localhost:8080');
define('SITE_NAME', getenv('SITE_NAME') ?: 'Electronics Store');

// Настройки сессии
session_start();

// Подключение к базе данных PostgreSQL
try {
    $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";options='--client_encoding=UTF8'";
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die("Ошибка подключения к базе данных: " . $e->getMessage());
}

// Функция для проверки авторизации
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

// Функция для получения текущего пользователя
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// Функция для проверки роли пользователя
function hasRole($role) {
    $user = getCurrentUser();
    return $user && $user['role'] === $role;
}

// Функция для редиректа
function redirect($url) {
    header("Location: " . $url);
    exit();
}

// Функция для форматирования цены
function formatPrice($price) {
    return number_format($price, 0, ',', ' ') . ' ₽';
}
?>
