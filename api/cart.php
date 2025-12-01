<?php
require_once '../config/database.php';
require_once '../classes/Cart.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Для действия count разрешаем без авторизации (вернем 0)
if ($action === 'count' && $method === 'GET') {
    if (!isLoggedIn()) {
        echo json_encode(['success' => true, 'count' => 0]);
        exit;
    }
    $cart = new Cart();
    $currentUser = getCurrentUser();
    $count = $cart->getCartCount($currentUser['id']);
    echo json_encode(['success' => true, 'count' => $count]);
    exit;
}

// Для остальных действий требуется авторизация
if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'message' => 'Необходима авторизация']);
    exit;
}

$cart = new Cart();
$currentUser = getCurrentUser();

switch ($action) {
    case 'get':
        if ($method === 'GET') {
            $cartItems = $cart->getCart($currentUser['id']);
            $total = $cart->getCartTotal($currentUser['id']);
            $count = $cart->getCartCount($currentUser['id']);
            
            echo json_encode([
                'success' => true, 
                'items' => $cartItems,
                'total' => $total,
                'count' => $count
            ]);
        }
        break;
        
    case 'add':
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['product_id'])) {
                echo json_encode(['success' => false, 'message' => 'ID товара не указан']);
                exit;
            }
            
            $quantity = $data['quantity'] ?? 1;
            
            if ($cart->addToCart($currentUser['id'], $data['product_id'], $quantity)) {
                echo json_encode(['success' => true, 'message' => 'Товар добавлен в корзину']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при добавлении в корзину']);
            }
        }
        break;
        
    case 'update':
        if ($method === 'PUT') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['product_id']) || !isset($data['quantity'])) {
                echo json_encode(['success' => false, 'message' => 'Неверные данные']);
                exit;
            }
            
            if ($cart->updateQuantity($currentUser['id'], $data['product_id'], $data['quantity'])) {
                echo json_encode(['success' => true, 'message' => 'Количество обновлено']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при обновлении количества']);
            }
        }
        break;
        
    case 'remove':
        if ($method === 'DELETE') {
            $productId = $_GET['product_id'] ?? '';
            
            if (empty($productId)) {
                echo json_encode(['success' => false, 'message' => 'ID товара не указан']);
                exit;
            }
            
            if ($cart->removeFromCart($currentUser['id'], $productId)) {
                echo json_encode(['success' => true, 'message' => 'Товар удален из корзины']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при удалении товара']);
            }
        }
        break;
        
    case 'clear':
        if ($method === 'DELETE') {
            if ($cart->clearCart($currentUser['id'])) {
                echo json_encode(['success' => true, 'message' => 'Корзина очищена']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при очистке корзины']);
            }
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
        break;
}
?>
