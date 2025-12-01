<?php
require_once '../config/database.php';
require_once '../classes/Product.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

$product = new Product();

switch ($action) {
    case 'list':
        if ($method === 'GET') {
            $filters = [];
            
            if (!empty($_GET['category'])) {
                $filters['category'] = $_GET['category'];
            }
            if (!empty($_GET['brand'])) {
                $filters['brand'] = $_GET['brand'];
            }
            if (!empty($_GET['country'])) {
                $filters['country'] = $_GET['country'];
            }
            if (!empty($_GET['min_price'])) {
                $filters['min_price'] = $_GET['min_price'];
            }
            if (!empty($_GET['max_price'])) {
                $filters['max_price'] = $_GET['max_price'];
            }
            if (!empty($_GET['search'])) {
                $filters['search'] = $_GET['search'];
            }
            
            $products = $product->getProducts($filters);
            echo json_encode(['success' => true, 'products' => $products]);
        }
        break;
        
    case 'get':
        if ($method === 'GET' && !empty($_GET['id'])) {
            $productData = $product->getProductById($_GET['id']);
            if ($productData) {
                echo json_encode(['success' => true, 'product' => $productData]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Товар не найден']);
            }
        }
        break;
        
    case 'categories':
        if ($method === 'GET') {
            $categories = $product->getCategories();
            echo json_encode(['success' => true, 'categories' => $categories]);
        }
        break;
        
    case 'brands':
        if ($method === 'GET') {
            $brands = $product->getBrands();
            echo json_encode(['success' => true, 'brands' => $brands]);
        }
        break;
        
    case 'countries':
        if ($method === 'GET') {
            $countries = $product->getCountries();
            echo json_encode(['success' => true, 'countries' => $countries]);
        }
        break;
        
    case 'add':
        if ($method === 'POST' && (hasRole('seller') || hasRole('admin'))) {
            $data = json_decode(file_get_contents('php://input'), true);
            $currentUser = getCurrentUser();
            
            $data['seller_id'] = $currentUser['id'];
            
            if ($product->addProduct($data)) {
                echo json_encode(['success' => true, 'message' => 'Товар добавлен']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при добавлении товара']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Доступ запрещен']);
        }
        break;
        
    case 'update':
        if ($method === 'PUT' && (hasRole('seller') || hasRole('admin'))) {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['id'])) {
                echo json_encode(['success' => false, 'message' => 'ID товара не указан']);
                exit;
            }
            
            if ($product->updateProduct($data['id'], $data)) {
                echo json_encode(['success' => true, 'message' => 'Товар обновлен']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при обновлении товара']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Доступ запрещен']);
        }
        break;
        
    case 'delete':
        if ($method === 'DELETE' && (hasRole('seller') || hasRole('admin'))) {
            $id = $_GET['id'] ?? '';
            
            if (empty($id)) {
                echo json_encode(['success' => false, 'message' => 'ID товара не указан']);
                exit;
            }
            
            if ($product->deleteProduct($id)) {
                echo json_encode(['success' => true, 'message' => 'Товар удален']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ошибка при удалении товара']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Доступ запрещен']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
        break;
}
?>
