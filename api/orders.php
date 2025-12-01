<?php
require_once '../config/database.php';
require_once '../classes/Order.php';
require_once '../classes/Cart.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$order = new Order();

switch ($action) {
    case 'create':
        if ($method === 'POST') {
            if (!isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Необходима авторизация']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $currentUser = getCurrentUser();
            
            if (empty($data['shipping_address'])) {
                echo json_encode(['success' => false, 'message' => 'Укажите адрес доставки']);
                exit;
            }
            
            try {
                $orderId = $order->createOrder($currentUser['id'], $data['shipping_address'], $data['notes'] ?? '');
                echo json_encode(['success' => true, 'message' => 'Заказ создан', 'order_id' => $orderId]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'message' => $e->getMessage()]);
            }
        }
        break;
        
    case 'list':
        if ($method === 'GET') {
            if (!isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Необходима авторизация']);
                exit;
            }
            
            $currentUser = getCurrentUser();
            $orders = $order->getUserOrders($currentUser['id']);
            echo json_encode(['success' => true, 'orders' => $orders]);
        }
        break;
        
    case 'get':
        if ($method === 'GET' && !empty($_GET['id'])) {
            if (!isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Необходима авторизация']);
                exit;
            }
            
            $orderData = $order->getOrderById($_GET['id']);
            $currentUser = getCurrentUser();
            
            // Проверяем, что заказ принадлежит пользователю или пользователь - админ
            if (!$orderData || ($orderData['user_id'] != $currentUser['id'] && !hasRole('admin'))) {
                echo json_encode(['success' => false, 'message' => 'Заказ не найден']);
                exit;
            }
            
            $orderItems = $order->getOrderItems($_GET['id']);
            echo json_encode(['success' => true, 'order' => $orderData, 'items' => $orderItems]);
        }
        break;
        
    case 'update_status':
        if ($method === 'PUT' && hasRole('admin')) {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['order_id']) || empty($data['status'])) {
                echo json_encode(['success' => false, 'message' => 'Неверные данные']);
                exit;
            }
            
            if ($order->updateOrderStatus($data['order_id'], $data['status'])) {
                echo json_encode(['success' => true, 'message' => 'Статус заказа обновлен']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при обновлении статуса']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Доступ запрещен']);
        }
        break;
        
    case 'cancel':
        if ($method === 'POST') {
            if (!isLoggedIn()) {
                echo json_encode(['success' => false, 'message' => 'Необходима авторизация']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $currentUser = getCurrentUser();
            
            if (empty($data['order_id'])) {
                echo json_encode(['success' => false, 'message' => 'ID заказа не указан']);
                exit;
            }
            
            // Проверяем, что заказ принадлежит пользователю
            $orderData = $order->getOrderById($data['order_id']);
            if (!$orderData || $orderData['user_id'] != $currentUser['id']) {
                echo json_encode(['success' => false, 'message' => 'Заказ не найден']);
                exit;
            }
            
            // Можно отменить только заказы со статусом pending или confirmed
            if (!in_array($orderData['status'], ['pending', 'confirmed'])) {
                echo json_encode(['success' => false, 'message' => 'Заказ нельзя отменить']);
                exit;
            }
            
            if ($order->updateOrderStatus($data['order_id'], 'cancelled')) {
                echo json_encode(['success' => true, 'message' => 'Заказ отменен']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при отмене заказа']);
            }
        }
        break;
        
    case 'all':
        if ($method === 'GET' && hasRole('admin')) {
            $orders = $order->getAllOrders();
            echo json_encode(['success' => true, 'orders' => $orders]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Доступ запрещен']);
        }
        break;
        
    case 'stats':
        if ($method === 'GET' && hasRole('admin')) {
            $stats = $order->getOrderStats();
            echo json_encode(['success' => true, 'stats' => $stats]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Доступ запрещен']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
        break;
}
?>
