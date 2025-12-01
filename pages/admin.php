<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Панель администратора - Electronics Store</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <h1><a href="../index.php">Electronics Store</a></h1>
                </div>
                <nav class="nav">
                    <ul>
                        <li><a href="../index.php">Главная</a></li>
                        <li><a href="catalog.php">Каталог</a></li>
                        <li><a href="admin.php" class="active">Админ-панель</a></li>
                    </ul>
                </nav>
                <div class="header-actions">
                    <!-- Скрытые элементы для поиска (для совместимости с main.js) -->
                    <div class="search-box" style="display: none;">
                        <input type="text" id="searchInput" placeholder="Поиск товаров...">
                        <button id="searchBtn">Поиск</button>
                    </div>
                    <!-- Скрытый элемент корзины (для совместимости с main.js) -->
                    <div class="cart" style="display: none;">
                        <span id="cartCount">0</span>
                    </div>
                    <div class="auth">
                        <div id="authButtons" style="display: none;">
                            <button id="loginBtn">Войти</button>
                            <button id="registerBtn">Регистрация</button>
                        </div>
                        <div id="userMenu">
                            <span id="userName"></span>
                            <div class="dropdown">
                                <button id="userMenuBtn">▼</button>
                                <div id="userDropdown" class="dropdown-content">
                                    <a href="profile.php">Профиль</a>
                                    <a href="orders.php">Мои заказы</a>
                                    <a href="#" id="logoutBtn">Выйти</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <main class="main">
        <div class="container">
            <h2>Панель администратора</h2>
            
            <!-- Статистика -->
            <div class="admin-stats" id="adminStats">
                <!-- Статистика будет загружена через JavaScript -->
            </div>
            
            <!-- Навигация по разделам -->
            <div class="admin-nav">
                <button class="btn btn-primary" onclick="admin.showSection('orders')">Заказы</button>
                <button class="btn btn-primary" onclick="admin.showSection('products')">Товары</button>
                <button class="btn btn-primary" onclick="admin.showSection('users')">Пользователи</button>
            </div>
            
            <!-- Раздел заказов -->
            <div id="ordersSection" class="admin-section">
                <h3>Управление заказами</h3>
                <div id="ordersList">
                    <!-- Заказы будут загружены через JavaScript -->
                </div>
            </div>
            
            <!-- Раздел товаров -->
            <div id="productsSection" class="admin-section" style="display: none;">
                <h3>Управление товарами</h3>
                <div class="admin-actions">
                    <button class="btn btn-success" onclick="admin.showAddProductForm()">Добавить товар</button>
                </div>
                <div id="productsList">
                    <!-- Товары будут загружены через JavaScript -->
                </div>
            </div>
            
            <!-- Раздел пользователей -->
            <div id="usersSection" class="admin-section" style="display: none;">
                <h3>Управление пользователями</h3>
                <div id="usersList">
                    <!-- Пользователи будут загружены через JavaScript -->
                </div>
            </div>
        </div>
    </main>

    <!-- Модальное окно изменения статуса заказа -->
    <div id="orderStatusModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Изменение статуса заказа</h3>
            <form id="orderStatusForm">
                <input type="hidden" id="orderId">
                <div class="form-group">
                    <label for="orderStatus">Статус:</label>
                    <select id="orderStatus">
                        <option value="pending">Ожидает подтверждения</option>
                        <option value="confirmed">Подтвержден</option>
                        <option value="shipped">Отправлен</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменен</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Обновить статус</button>
            </form>
        </div>
    </div>

    <!-- Модальное окно добавления товара -->
    <div id="addProductModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Добавление товара</h3>
            <form id="addProductForm">
                <div class="form-group">
                    <label for="productName">Название:</label>
                    <input type="text" id="productName" required>
                </div>
                <div class="form-group">
                    <label for="productDescription">Описание:</label>
                    <textarea id="productDescription" required></textarea>
                </div>
                <div class="form-group">
                    <label for="productPrice">Цена:</label>
                    <input type="number" id="productPrice" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="productCategory">Категория:</label>
                    <select id="productCategory" required>
                        <!-- Категории будут загружены через JavaScript -->
                    </select>
                </div>
                <div class="form-group">
                    <label for="productBrand">Бренд:</label>
                    <input type="text" id="productBrand">
                </div>
                <div class="form-group">
                    <label for="productCountry">Страна:</label>
                    <input type="text" id="productCountry">
                </div>
                <div class="form-group">
                    <label for="productStock">Количество на складе:</label>
                    <input type="number" id="productStock" min="0" required>
                </div>
                <div class="form-group">
                    <label for="productSpecs">Характеристики (JSON):</label>
                    <textarea id="productSpecs" placeholder='{"processor": "M2", "ram": "8GB"}'></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Добавить товар</button>
            </form>
        </div>
    </div>

    <!-- Модальное окно редактирования пользователя -->
    <div id="editUserModal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Редактирование пользователя</h3>
            <form id="editUserForm">
                <input type="hidden" id="editUserId">
                <div class="form-group">
                    <label for="editUserRole">Роль:</label>
                    <select id="editUserRole" required>
                        <option value="buyer">Покупатель</option>
                        <option value="seller">Продавец</option>
                        <option value="admin">Администратор</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Обновить роль</button>
            </form>
        </div>
    </div>

    <!-- Модальные окна авторизации (для main.js) -->
    <div id="loginModal" class="modal" style="display: none;">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Вход в систему</h3>
            <form id="loginForm">
                <div class="form-group">
                    <label for="loginEmail">Email:</label>
                    <input type="email" id="loginEmail" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">Пароль:</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="btn btn-primary">Войти</button>
            </form>
        </div>
    </div>

    <div id="registerModal" class="modal" style="display: none;">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Регистрация</h3>
            <form id="registerForm">
                <div class="form-group">
                    <label for="registerName">Имя:</label>
                    <input type="text" id="registerName" required>
                </div>
                <div class="form-group">
                    <label for="registerEmail">Email:</label>
                    <input type="email" id="registerEmail" required>
                </div>
                <div class="form-group">
                    <label for="registerPassword">Пароль:</label>
                    <input type="password" id="registerPassword" required>
                </div>
                <div class="form-group">
                    <label for="registerPhone">Телефон:</label>
                    <input type="tel" id="registerPhone">
                </div>
                <div class="form-group">
                    <label for="registerAddress">Адрес:</label>
                    <textarea id="registerAddress"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
            </form>
        </div>
    </div>

    <script src="../assets/js/main.js"></script>
    <script src="../assets/js/admin.js"></script>
</body>
</html>
