<?php
require_once '../config/database.php';
require_once '../classes/User.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if (!hasRole('admin')) {
    echo json_encode(['success' => false, 'message' => 'Доступ запрещен']);
    exit;
}

$user = new User();

switch ($action) {
    case 'list':
        if ($method === 'GET') {
            $stmt = $pdo->prepare("SELECT id, name, email, role, phone, address, created_at FROM users ORDER BY created_at DESC");
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'users' => $users]);
        }
        break;
        
    case 'update_role':
        if ($method === 'PUT') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['user_id']) || empty($data['role'])) {
                echo json_encode(['success' => false, 'message' => 'Неверные данные']);
                exit;
            }
            
            $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
            if ($stmt->execute([$data['role'], $data['user_id']])) {
                echo json_encode(['success' => true, 'message' => 'Роль пользователя обновлена']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при обновлении роли']);
            }
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
        break;
}
?>
