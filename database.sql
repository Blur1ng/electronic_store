-- База данных для интернет-магазина электроники
-- PostgreSQL версия

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица категорий
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER,
    seller_id INTEGER,
    brand VARCHAR(100),
    country VARCHAR(100),
    specifications JSONB,
    image_url VARCHAR(500),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Таблица корзины
CREATE TABLE IF NOT EXISTS cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Создание триггера для orders
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Таблица элементов заказа
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Вставка начальных данных
INSERT INTO categories (name, description) VALUES 
('Ноутбуки', 'Портативные компьютеры для работы и развлечений'),
('Смартфоны', 'Мобильные телефоны с расширенным функционалом'),
('Планшеты', 'Портативные устройства с сенсорным экраном'),
('Наушники', 'Аудио устройства для прослушивания музыки'),
('Клавиатуры', 'Устройства ввода для компьютеров')
ON CONFLICT DO NOTHING;

-- Пароль для всех тестовых пользователей: password
INSERT INTO users (email, password, name, role) VALUES 
('admin@store.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Администратор', 'admin'),
('seller@store.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Продавец', 'seller'),
('buyer@store.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Покупатель', 'buyer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (name, description, price, category_id, seller_id, brand, country, specifications, stock_quantity) VALUES 
('MacBook Pro 13"', 'Профессиональный ноутбук от Apple с процессором M2', 129999.00, 1, 2, 'Apple', 'США', '{"processor": "M2", "ram": "8GB", "storage": "256GB", "screen": "13.3 inch"}'::jsonb, 5),
('iPhone 14', 'Новейший смартфон от Apple с камерой 48MP', 79999.00, 2, 2, 'Apple', 'США', '{"camera": "48MP", "storage": "128GB", "battery": "3279mAh"}'::jsonb, 10),
('Samsung Galaxy S23', 'Флагманский смартфон Samsung с мощным процессором', 69999.00, 2, 2, 'Samsung', 'Южная Корея', '{"camera": "50MP", "storage": "256GB", "battery": "3900mAh"}'::jsonb, 8),
('iPad Air', 'Планшет Apple с дисплеем Liquid Retina', 49999.00, 3, 2, 'Apple', 'США', '{"screen": "10.9 inch", "storage": "64GB", "processor": "M1"}'::jsonb, 6),
('AirPods Pro', 'Беспроводные наушники с активным шумоподавлением', 19999.00, 4, 2, 'Apple', 'США', '{"noise_cancellation": true, "battery": "6 hours"}'::jsonb, 15);
