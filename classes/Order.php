<?php
require_once __DIR__ . '/../config/database.php';

class Order {
    private $pdo;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
    }
    
    // Создать заказ
    public function createOrder($userId, $shippingAddress, $notes = '') {
        $this->pdo->beginTransaction();
        
        try {
            // Получаем товары из корзины
            $cart = new Cart();
            $cartItems = $cart->getCart($userId);
            
            if (empty($cartItems)) {
                throw new Exception("Корзина пуста");
            }
            
            // Вычисляем общую сумму
            $totalAmount = $cart->getCartTotal($userId);
            
            // Создаем заказ
            $stmt = $this->pdo->prepare("INSERT INTO orders (user_id, total_amount, shipping_address, notes) VALUES (?, ?, ?, ?)");
            $stmt->execute([$userId, $totalAmount, $shippingAddress, $notes]);
            // Для PostgreSQL нужно явно указывать имя последовательности
            $orderId = $this->pdo->lastInsertId('orders_id_seq');
            
            // Добавляем товары в заказ
            foreach ($cartItems as $item) {
                $stmt = $this->pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
                $stmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['price']]);
            }
            
            // Очищаем корзину
            $cart->clearCart($userId);
            
            $this->pdo->commit();
            return $orderId;
            
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    // Получить заказы пользователя
    public function getUserOrders($userId) {
        $stmt = $this->pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Получить заказ по ID
    public function getOrderById($id) {
        $stmt = $this->pdo->prepare("SELECT o.*, u.name as user_name FROM orders o 
                                    JOIN users u ON o.user_id = u.id 
                                    WHERE o.id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Получить товары заказа
    public function getOrderItems($orderId) {
        $stmt = $this->pdo->prepare("SELECT oi.*, p.name, p.image_url FROM order_items oi 
                                    JOIN products p ON oi.product_id = p.id 
                                    WHERE oi.order_id = ?");
        $stmt->execute([$orderId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Обновить статус заказа
    public function updateOrderStatus($orderId, $status) {
        $stmt = $this->pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $orderId]);
    }
    
    // Получить все заказы (для админа)
    public function getAllOrders() {
        $stmt = $this->pdo->prepare("SELECT o.*, u.name as user_name FROM orders o 
                                    JOIN users u ON o.user_id = u.id 
                                    ORDER BY o.created_at DESC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Получить статистику заказов
    public function getOrderStats() {
        $stats = [];
        
        // Общее количество заказов
        $stmt = $this->pdo->prepare("SELECT COUNT(*) as total FROM orders");
        $stmt->execute();
        $stats['total'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Заказы по статусам
        $stmt = $this->pdo->prepare("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
        $stmt->execute();
        $statusStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($statusStats as $stat) {
            $stats['by_status'][$stat['status']] = $stat['count'];
        }
        
        // Общая сумма заказов
        $stmt = $this->pdo->prepare("SELECT SUM(total_amount) as total_amount FROM orders");
        $stmt->execute();
        $stats['total_amount'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_amount'] ?? 0;
        
        return $stats;
    }
}
?>
