// Основной JavaScript файл для Electronics Store

// Определение базового пути к API в зависимости от текущей страницы
const API_BASE = window.location.pathname.includes('/pages/') ? '../api/' : 'api/';

class ElectronicsStore {
    constructor() {
        this.currentUser = null;
        this.cartCount = 0;
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadCategories();
        this.loadFeaturedProducts();
        this.setupEventListeners();
        this.updateCartCount();
    }

    // Проверка авторизации
    async checkAuth() {
        try {
            const response = await fetch(API_BASE + 'auth.php?action=profile');
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.showUserMenu();
            } else {
                this.showAuthButtons();
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            this.showAuthButtons();
        }
    }

    // Показать кнопки авторизации
    showAuthButtons() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        if (authButtons) authButtons.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }

    // Показать меню пользователя
    showUserMenu() {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (userName) userName.textContent = this.currentUser.name;
    }

    // Загрузка категорий
    async loadCategories() {
        try {
            const response = await fetch(API_BASE + 'products.php?action=categories');
            const data = await response.json();
            
            if (data.success) {
                this.renderCategories(data.categories);
            }
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    }

    // Отображение категорий
    renderCategories(categories) {
        const categoryGrid = document.getElementById('categoryGrid');
        const footerCategories = document.getElementById('footerCategories');
        
        if (!categoryGrid || !footerCategories) return; // Элементы могут отсутствовать
        
        categoryGrid.innerHTML = '';
        footerCategories.innerHTML = '';
        
        categories.forEach(category => {
            // Основная сетка категорий
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.innerHTML = `
                <h4>${category.name}</h4>
                <p>${category.description || 'Описание категории'}</p>
                <a href="pages/catalog.php?category=${category.id}" class="btn btn-primary">Смотреть товары</a>
            `;
            categoryGrid.appendChild(categoryCard);
            
            // Футер категории
            const footerItem = document.createElement('li');
            footerItem.innerHTML = `<a href="pages/catalog.php?category=${category.id}">${category.name}</a>`;
            footerCategories.appendChild(footerItem);
        });
    }

    // Загрузка рекомендуемых товаров
    async loadFeaturedProducts() {
        try {
            const response = await fetch(API_BASE + 'products.php?action=list');
            const data = await response.json();
            
            if (data.success) {
                // Показываем первые 6 товаров как рекомендуемые
                const featuredProducts = data.products.slice(0, 6);
                this.renderProducts(featuredProducts, 'featuredProducts');
            }
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        }
    }

    // Отображение товаров
    renderProducts(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image_url || 'assets/images/no-image.jpg'}" alt="${product.name}">
                <h4>${product.name}</h4>
                <div class="price">${this.formatPrice(product.price)}</div>
                <div class="description">${product.description || ''}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="store.addToCart(${product.id})">В корзину</button>
                    <a href="pages/product.php?id=${product.id}" class="btn btn-secondary">Подробнее</a>
                </div>
            `;
            container.appendChild(productCard);
        });
    }

    // Добавление товара в корзину
    async addToCart(productId) {
        if (!this.currentUser) {
            this.showModal('loginModal');
            return;
        }

        try {
            const response = await fetch(API_BASE + 'cart.php?action=add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: 1
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Товар добавлен в корзину', 'success');
                this.updateCartCount();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления в корзину:', error);
            this.showAlert('Ошибка при добавлении товара', 'error');
        }
    }

    // Обновление счетчика корзины
    async updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (!cartCount) return; // Элемент может отсутствовать на некоторых страницах

        try {
            const response = await fetch(API_BASE + 'cart.php?action=count');
            const data = await response.json();
            
            if (data.success) {
                this.cartCount = data.count || 0;
                cartCount.textContent = data.count || 0;
            } else {
                cartCount.textContent = '0';
            }
        } catch (error) {
            console.error('Ошибка обновления корзины:', error);
            cartCount.textContent = '0';
        }
    }

    // Форматирование цены
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }

    // Показать модальное окно
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    // Скрыть модальное окно
    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    // Показать уведомление
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Добавляем уведомление в начало страницы
        const main = document.querySelector('.main');
        main.insertBefore(alertDiv, main.firstChild);
        
        // Удаляем уведомление через 5 секунд
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Кнопки авторизации
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.showModal('loginModal');
            });
        }

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.showModal('registerModal');
            });
        }

        // Поиск
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Формы авторизации
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Выход
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Закрытие модальных окон
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        // Закрытие модальных окон по клику вне их
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    // Выполнение поиска
    performSearch() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        if (searchTerm) {
            window.location.href = `pages/catalog.php?search=${encodeURIComponent(searchTerm)}`;
        }
    }

    // Обработка входа
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch(API_BASE + 'auth.php?action=login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                this.showUserMenu();
                this.hideModal('loginModal');
                this.showAlert('Вход выполнен успешно', 'success');
                this.updateCartCount();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showAlert('Ошибка при входе в систему', 'error');
        }
    }

    // Обработка регистрации
    async handleRegister() {
        const formData = {
            name: document.getElementById('registerName').value,
            email: document.getElementById('registerEmail').value,
            password: document.getElementById('registerPassword').value,
            phone: document.getElementById('registerPhone').value,
            address: document.getElementById('registerAddress').value
        };

        try {
            const response = await fetch(API_BASE + 'auth.php?action=register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.hideModal('registerModal');
                this.showAlert('Регистрация успешна! Теперь вы можете войти в систему', 'success');
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showAlert('Ошибка при регистрации', 'error');
        }
    }

    // Обработка выхода
    async handleLogout() {
        try {
            const response = await fetch(API_BASE + 'auth.php?action=logout', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = null;
                this.showAuthButtons();
                this.showAlert('Выход выполнен', 'success');
                this.updateCartCount();
            }
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    }
}

// Инициализация приложения
const store = new ElectronicsStore();
