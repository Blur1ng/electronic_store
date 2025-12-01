<?php
require_once __DIR__ . '/../config/database.php';

class User {
    private $pdo;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
    }
    
    // Регистрация пользователя
    public function register($email, $password, $name, $phone = '', $address = '') {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $this->pdo->prepare("INSERT INTO users (email, password, name, phone, address) VALUES (?, ?, ?, ?, ?)");
        return $stmt->execute([$email, $hashedPassword, $name, $phone, $address]);
    }
    
    // Авторизация пользователя
    public function login($email, $password) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_role'] = $user['role'];
            return true;
        }
        return false;
    }
    
    // Выход из системы
    public function logout() {
        // Очищаем переменные сессии перед уничтожением
        unset($_SESSION['user_id']);
        unset($_SESSION['user_role']);
        session_destroy();
    }
    
    // Получить пользователя по ID
    public function getUserById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Обновить профиль пользователя
    public function updateProfile($id, $name, $phone, $address) {
        $stmt = $this->pdo->prepare("UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?");
        return $stmt->execute([$name, $phone, $address, $id]);
    }
    
    // Проверить существование email
    public function emailExists($email) {
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch() !== false;
    }
}
?>
