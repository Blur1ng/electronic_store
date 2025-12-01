// JavaScript для страницы каталога

class CatalogPage {
    constructor() {
        this.filters = {};
        this.init();
    }

    init() {
        this.loadFilters();
        this.loadProducts();
        this.setupEventListeners();
        this.parseUrlParams();
    }

    // Парсинг параметров URL
    parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('search')) {
            document.getElementById('searchInput').value = urlParams.get('search');
            this.filters.search = urlParams.get('search');
        }
        
        if (urlParams.get('category')) {
            this.filters.category = urlParams.get('category');
        }
        
        this.applyFilters();
    }

    // Загрузка фильтров
    async loadFilters() {
        try {
            // Загружаем категории
            const categoriesResponse = await fetch(API_BASE + 'products.php?action=categories');
            const categoriesData = await categoriesResponse.json();
            
            if (categoriesData.success) {
                this.populateSelect('categoryFilter', categoriesData.categories, 'id', 'name');
            }

            // Загружаем бренды
            const brandsResponse = await fetch(API_BASE + 'products.php?action=brands');
            const brandsData = await brandsResponse.json();
            
            if (brandsData.success) {
                this.populateSelect('brandFilter', brandsData.brands);
            }

            // Загружаем страны
            const countriesResponse = await fetch(API_BASE + 'products.php?action=countries');
            const countriesData = await countriesResponse.json();
            
            if (countriesData.success) {
                this.populateSelect('countryFilter', countriesData.countries);
            }
        } catch (error) {
            console.error('Ошибка загрузки фильтров:', error);
        }
    }

    // Заполнение select элементов
    populateSelect(selectId, data, valueKey = null, textKey = null) {
        const select = document.getElementById(selectId);
        
        // Очищаем существующие опции (кроме первой)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = valueKey ? item[valueKey] : item;
            option.textContent = textKey ? item[textKey] : item;
            select.appendChild(option);
        });
    }

    // Загрузка товаров
    async loadProducts() {
        this.showLoading(true);
        
        try {
            const queryParams = new URLSearchParams();
            
            Object.keys(this.filters).forEach(key => {
                if (this.filters[key]) {
                    queryParams.append(key, this.filters[key]);
                }
            });
            
            const response = await fetch(`${API_BASE}products.php?action=list&${queryParams.toString()}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderProducts(data.products);
            } else {
                this.showAlert('Ошибка загрузки товаров', 'error');
            }
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            this.showAlert('Ошибка загрузки товаров', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Отображение товаров
    renderProducts(products) {
        const productGrid = document.getElementById('productGrid');
        
        if (products.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; padding: 2rem;">Товары не найдены</p>';
            return;
        }
        
        productGrid.innerHTML = '';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image_url || '../assets/images/no-image.jpg'}" alt="${product.name}">
                <h4>${product.name}</h4>
                <div class="price">${this.formatPrice(product.price)}</div>
                <div class="description">${product.description ? product.description.substring(0, 100) + '...' : ''}</div>
                <div class="product-info">
                    <small>Бренд: ${product.brand || 'Не указан'}</small><br>
                    <small>Страна: ${product.country || 'Не указана'}</small><br>
                    <small>Категория: ${product.category_name || 'Не указана'}</small>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="catalog.addToCart(${product.id})">В корзину</button>
                    <a href="product.php?id=${product.id}" class="btn btn-secondary">Подробнее</a>
                </div>
            `;
            productGrid.appendChild(productCard);
        });
    }

    // Применение фильтров
    applyFilters() {
        this.filters = {
            category: document.getElementById('categoryFilter').value,
            brand: document.getElementById('brandFilter').value,
            country: document.getElementById('countryFilter').value,
            min_price: document.getElementById('minPriceFilter').value,
            max_price: document.getElementById('maxPriceFilter').value,
            search: document.getElementById('searchInput').value
        };
        
        // Удаляем пустые фильтры
        Object.keys(this.filters).forEach(key => {
            if (!this.filters[key]) {
                delete this.filters[key];
            }
        });
        
        this.loadProducts();
    }

    // Очистка фильтров
    clearFilters() {
        document.getElementById('categoryFilter').value = '';
        document.getElementById('brandFilter').value = '';
        document.getElementById('countryFilter').value = '';
        document.getElementById('minPriceFilter').value = '';
        document.getElementById('maxPriceFilter').value = '';
        document.getElementById('searchInput').value = '';
        
        this.filters = {};
        this.loadProducts();
    }

    // Добавление товара в корзину
    async addToCart(productId) {
        if (!store.currentUser) {
            store.showModal('loginModal');
            return;
        }

        try {
            const response = await fetch('../api/cart.php?action=add', {
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
                store.updateCartCount();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления в корзину:', error);
            this.showAlert('Ошибка при добавлении товара', 'error');
        }
    }

    // Показать/скрыть индикатор загрузки
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        loadingIndicator.style.display = show ? 'block' : 'none';
    }

    // Форматирование цены
    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }

    // Показать уведомление
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const main = document.querySelector('.main');
        main.insertBefore(alertDiv, main.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Применение фильтров
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        // Очистка фильтров
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Поиск
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.applyFilters();
            }
        });

        // Изменение фильтров
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('brandFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('countryFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('minPriceFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('maxPriceFilter').addEventListener('change', () => {
            this.applyFilters();
        });
    }
}

// Инициализация страницы каталога
const catalog = new CatalogPage();
