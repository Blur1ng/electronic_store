<?php
require_once __DIR__ . '/../config/database.php';

class Cart {
    private $pdo;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
    }
    
    // Добавить товар в корзину
    public function addToCart($userId, $productId, $quantity = 1) {
        // Проверяем, есть ли уже этот товар в корзине
        $stmt = $this->pdo->prepare("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$userId, $productId]);
        $existingItem = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingItem) {
            // Обновляем количество
            $newQuantity = $existingItem['quantity'] + $quantity;
            $stmt = $this->pdo->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
            return $stmt->execute([$newQuantity, $existingItem['id']]);
        } else {
            // Добавляем новый товар
            $stmt = $this->pdo->prepare("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)");
            return $stmt->execute([$userId, $productId, $quantity]);
        }
    }
    
    // Получить корзину пользователя
    public function getCart($userId) {
        $stmt = $this->pdo->prepare("SELECT c.*, p.name, p.price, p.image_url FROM cart c 
                                    JOIN products p ON c.product_id = p.id 
                                    WHERE c.user_id = ? ORDER BY c.created_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Обновить количество товара в корзине
    public function updateQuantity($userId, $productId, $quantity) {
        if ($quantity <= 0) {
            return $this->removeFromCart($userId, $productId);
        }
        
        $stmt = $this->pdo->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?");
        return $stmt->execute([$quantity, $userId, $productId]);
    }
    
    // Удалить товар из корзины
    public function removeFromCart($userId, $productId) {
        $stmt = $this->pdo->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
        return $stmt->execute([$userId, $productId]);
    }
    
    // Очистить корзину
    public function clearCart($userId) {
        $stmt = $this->pdo->prepare("DELETE FROM cart WHERE user_id = ?");
        return $stmt->execute([$userId]);
    }
    
    // Получить общую сумму корзины
    public function getCartTotal($userId) {
        $stmt = $this->pdo->prepare("SELECT SUM(c.quantity * p.price) as total FROM cart c 
                                    JOIN products p ON c.product_id = p.id 
                                    WHERE c.user_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['total'] ?? 0;
    }
    
    // Получить количество товаров в корзине
    public function getCartCount($userId) {
        $stmt = $this->pdo->prepare("SELECT SUM(quantity) as count FROM cart WHERE user_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] ?? 0;
    }
}
?>
