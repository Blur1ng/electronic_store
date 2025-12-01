<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Профиль - Electronics Store</title>
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
                        <li><a href="about.php">О нас</a></li>
                        <li><a href="contact.php">Контакты</a></li>
                    </ul>
                </nav>
                <div class="header-actions">
                    <div class="search-box">
                        <input type="text" id="searchInput" placeholder="Поиск товаров...">
                        <button id="searchBtn">Поиск</button>
                    </div>
                    <div class="cart">
                        <a href="cart.php" id="cartLink">
                            Корзина (<span id="cartCount">0</span>)
                        </a>
                    </div>
                    <div class="auth">
                        <div id="authButtons">
                            <button id="loginBtn">Войти</button>
                            <button id="registerBtn">Регистрация</button>
                        </div>
                        <div id="userMenu" style="display: none;">
                            <span id="userName"></span>
                            <div class="dropdown">
                                <button id="userMenuBtn">▼</button>
                                <div id="userDropdown" class="dropdown-content">
                                    <a href="profile.php" class="active">Профиль</a>
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
            <h2>Мой профиль</h2>
            
            <div class="profile-content">
                <div class="profile-form">
                    <h3>Личная информация</h3>
                    <form id="profileForm">
                        <div class="form-group">
                            <label for="profileName">Имя:</label>
                            <input type="text" id="profileName" required>
                        </div>
                        <div class="form-group">
                            <label for="profileEmail">Email:</label>
                            <input type="email" id="profileEmail" readonly>
                        </div>
                        <div class="form-group">
                            <label for="profilePhone">Телефон:</label>
                            <input type="tel" id="profilePhone">
                        </div>
                        <div class="form-group">
                            <label for="profileAddress">Адрес:</label>
                            <textarea id="profileAddress"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="profileRole">Роль:</label>
                            <input type="text" id="profileRole" readonly>
                        </div>
                        <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                    </form>
                </div>
                
                <div class="profile-stats">
                    <h3>Статистика</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <h4 id="totalOrders">0</h4>
                            <p>Всего заказов</p>
                        </div>
                        <div class="stat-item">
                            <h4 id="totalSpent">0 ₽</h4>
                            <p>Потрачено</p>
                        </div>
                        <div class="stat-item">
                            <h4 id="cartItems">0</h4>
                            <p>В корзине</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Electronics Store</h4>
                    <p>Ваш надежный партнер в мире электроники</p>
                </div>
                <div class="footer-section">
                    <h4>Категории</h4>
                    <ul id="footerCategories">
                        <!-- Категории будут загружены через JavaScript -->
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Контакты</h4>
                    <p>Email: info@electronics-store.com</p>
                    <p>Телефон: +7 (999) 123-45-67</p>
                </div>
            </div>
        </div>
    </footer>

    <!-- Модальные окна авторизации -->
    <div id="loginModal" class="modal">
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

    <div id="registerModal" class="modal">
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
    <script src="../assets/js/profile.js"></script>
</body>
</html>
