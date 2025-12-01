<?php
require_once '../config/database.php';
require_once '../classes/User.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$user = new User();

switch ($action) {
    case 'register':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
                echo json_encode(['success' => false, 'message' => 'Заполните все обязательные поля']);
                exit;
            }
            
            if ($user->emailExists($data['email'])) {
                echo json_encode(['success' => false, 'message' => 'Пользователь с таким email уже существует']);
                exit;
            }
            
            if ($user->register($data['email'], $data['password'], $data['name'], $data['phone'] ?? '', $data['address'] ?? '')) {
                echo json_encode(['success' => true, 'message' => 'Регистрация успешна']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при регистрации']);
            }
        }
        break;
        
    case 'login':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['email']) || empty($data['password'])) {
                echo json_encode(['success' => false, 'message' => 'Заполните email и пароль']);
                exit;
            }
            
            if ($user->login($data['email'], $data['password'])) {
                $currentUser = getCurrentUser();
                echo json_encode(['success' => true, 'message' => 'Вход выполнен успешно', 'user' => $currentUser]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Неверный email или пароль']);
            }
        }
        break;
        
    case 'logout':
        if ($method === 'POST') {
            $user->logout();
            echo json_encode(['success' => true, 'message' => 'Выход выполнен']);
        }
        break;
        
    case 'profile':
        if ($method === 'GET') {
            if (!isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Необходима авторизация']);
                exit;
            }
            
            $currentUser = getCurrentUser();
            echo json_encode(['success' => true, 'user' => $currentUser]);
        } elseif ($method === 'PUT') {
            if (!isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Необходима авторизация']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $currentUser = getCurrentUser();
            
            if ($user->updateProfile($currentUser['id'], $data['name'], $data['phone'] ?? '', $data['address'] ?? '')) {
                echo json_encode(['success' => true, 'message' => 'Профиль обновлен']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при обновлении профиля']);
            }
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
        break;
}
?>
