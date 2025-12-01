<?php
require_once __DIR__ . '/../config/database.php';

class Product {
    private $pdo;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
    }
    
    // Получить все товары с фильтрацией
    public function getProducts($filters = []) {
        $sql = "SELECT p.*, c.name as category_name FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.is_active = 1";
        $params = [];
        
        if (!empty($filters['category'])) {
            $sql .= " AND p.category_id = ?";
            $params[] = $filters['category'];
        }
        
        if (!empty($filters['brand'])) {
            $sql .= " AND p.brand = ?";
            $params[] = $filters['brand'];
        }
        
        if (!empty($filters['country'])) {
            $sql .= " AND p.country = ?";
            $params[] = $filters['country'];
        }
        
        if (!empty($filters['min_price'])) {
            $sql .= " AND p.price >= ?";
            $params[] = $filters['min_price'];
        }
        
        if (!empty($filters['max_price'])) {
            $sql .= " AND p.price <= ?";
            $params[] = $filters['max_price'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (p.name LIKE ? OR p.description LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $sql .= " ORDER BY p.created_at DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Получить товар по ID
    public function getProductById($id) {
        $stmt = $this->pdo->prepare("SELECT p.*, c.name as category_name FROM products p 
                                    LEFT JOIN categories c ON p.category_id = c.id 
                                    WHERE p.id = ? AND p.is_active = 1");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Получить все категории
    public function getCategories() {
        $stmt = $this->pdo->prepare("SELECT * FROM categories ORDER BY name");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Получить уникальные бренды
    public function getBrands() {
        $stmt = $this->pdo->prepare("SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL ORDER BY brand");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    // Получить уникальные страны
    public function getCountries() {
        $stmt = $this->pdo->prepare("SELECT DISTINCT country FROM products WHERE country IS NOT NULL ORDER BY country");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }
    
    // Добавить товар (для продавцов)
    public function addProduct($data) {
        $stmt = $this->pdo->prepare("INSERT INTO products (name, description, price, category_id, seller_id, brand, country, specifications, stock_quantity) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        return $stmt->execute([
            $data['name'],
            $data['description'],
            $data['price'],
            $data['category_id'],
            $data['seller_id'],
            $data['brand'],
            $data['country'],
            json_encode($data['specifications']),
            $data['stock_quantity']
        ]);
    }
    
    // Обновить товар
    public function updateProduct($id, $data) {
        $stmt = $this->pdo->prepare("UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, 
                                    brand = ?, country = ?, specifications = ?, stock_quantity = ? WHERE id = ?");
        return $stmt->execute([
            $data['name'],
            $data['description'],
            $data['price'],
            $data['category_id'],
            $data['brand'],
            $data['country'],
            json_encode($data['specifications']),
            $data['stock_quantity'],
            $id
        ]);
    }
    
    // Удалить товар
    public function deleteProduct($id) {
        $stmt = $this->pdo->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
        return $stmt->execute([$id]);
    }
}
?>
