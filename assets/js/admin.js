// JavaScript для админ-панели

class AdminPanel {
    constructor() {
        this.currentSection = 'orders';
        this.init();
    }

    async init() {
        await this.checkAdminAccess();
        this.loadStats();
        this.loadOrders();
        this.setupEventListeners();
    }

    // Проверка доступа администратора
    async checkAdminAccess() {
        // Ждем пока загрузится информация о пользователе
        let attempts = 0;
        while (!store.currentUser && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!store.currentUser || store.currentUser.role !== 'admin') {
            this.showAlert('Доступ запрещен. Требуются права администратора.', 'error');
            setTimeout(() => {
                window.location.href = '../index.php';
            }, 2000);
            return false;
        }
        return true;
    }

    // Загрузка статистики
    async loadStats() {
        try {
            const response = await fetch(API_BASE + 'orders.php?action=stats');
            const data = await response.json();
            
            if (data.success) {
                this.renderStats(data.stats);
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }

    // Отображение статистики
    renderStats(stats) {
        const statsContainer = document.getElementById('adminStats');
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>${stats.total}</h3>
                <p>Всего заказов</p>
            </div>
            <div class="stat-card">
                <h3>${this.formatPrice(stats.total_amount)}</h3>
                <p>Общая сумма</p>
            </div>
            <div class="stat-card">
                <h3>${stats.by_status?.pending || 0}</h3>
                <p>Ожидают подтверждения</p>
            </div>
            <div class="stat-card">
                <h3>${stats.by_status?.delivered || 0}</h3>
                <p>Доставлено</p>
            </div>
        `;
    }

    // Загрузка заказов
    async loadOrders() {
        try {
            const response = await fetch(API_BASE + 'orders.php?action=all');
            const data = await response.json();
            
            if (data.success) {
                this.renderOrders(data.orders);
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            this.showAlert('Ошибка загрузки заказов', 'error');
        }
    }

    // Отображение заказов
    renderOrders(orders) {
        const ordersList = document.getElementById('ordersList');
        ordersList.innerHTML = '';
        
        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            orderCard.innerHTML = `
                <div class="order-header">
                    <div>
                        <h4>Заказ #${order.id}</h4>
                        <small>Клиент: ${order.user_name}</small><br>
                        <small>Дата: ${this.formatDate(order.created_at)}</small>
                    </div>
                    <div>
                        <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                        <div class="order-total">${this.formatPrice(order.total_amount)}</div>
                    </div>
                </div>
                <div class="order-info">
                    <p><strong>Адрес доставки:</strong> ${order.shipping_address}</p>
                    ${order.notes ? `<p><strong>Комментарии:</strong> ${order.notes}</p>` : ''}
                </div>
                <div class="order-actions">
                    <button class="btn btn-secondary" onclick="admin.showOrderDetails(${order.id})">
                        Подробнее
                    </button>
                    <button class="btn btn-primary" onclick="admin.editOrderStatus(${order.id}, '${order.status}')">
                        Изменить статус
                    </button>
                </div>
            `;
            ordersList.appendChild(orderCard);
        });
    }

    // Загрузка товаров
    async loadProducts() {
        try {
            const response = await fetch(API_BASE + 'products.php?action=list');
            const data = await response.json();
            
            if (data.success) {
                this.renderProducts(data.products);
            }
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        }
    }

    // Отображение товаров
    renderProducts(products) {
        const productsList = document.getElementById('productsList');
        productsList.innerHTML = '';
        
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
                    <small>На складе: ${product.stock_quantity}</small>
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="admin.editProduct(${product.id})">Редактировать</button>
                    <button class="btn btn-danger" onclick="admin.deleteProduct(${product.id})">Удалить</button>
                </div>
            `;
            productsList.appendChild(productCard);
        });
    }

    // Загрузка пользователей
    async loadUsers() {
        try {
            const response = await fetch(API_BASE + 'users.php?action=list');
            const data = await response.json();
            
            if (data.success) {
                this.renderUsers(data.users);
            }
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        }
    }

    // Отображение пользователей
    renderUsers(users) {
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';
        
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <p>Email: ${user.email}</p>
                    <p>Роль: <span class="user-role role-${user.role}">${this.getRoleText(user.role)}</span></p>
                    <p>Дата регистрации: ${this.formatDate(user.created_at)}</p>
                </div>
                <div class="user-actions">
                    <button class="btn btn-primary" onclick="admin.editUser(${user.id})">Редактировать</button>
                </div>
            `;
            usersList.appendChild(userCard);
        });
    }

    // Показать раздел
    showSection(section) {
        // Скрыть все разделы
        document.querySelectorAll('.admin-section').forEach(div => {
            div.style.display = 'none';
        });
        
        // Показать выбранный раздел
        document.getElementById(section + 'Section').style.display = 'block';
        this.currentSection = section;
        
        // Загрузить данные для раздела
        switch (section) {
            case 'orders':
                this.loadOrders();
                break;
            case 'products':
                this.loadProducts();
                this.loadCategories();
                break;
            case 'users':
                this.loadUsers();
                break;
        }
    }

    // Загрузка категорий для формы добавления товара
    async loadCategories() {
        try {
            const response = await fetch(API_BASE + 'products.php?action=categories');
            const data = await response.json();
            
            if (data.success) {
                const select = document.getElementById('productCategory');
                select.innerHTML = '<option value="">Выберите категорию</option>';
                
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    }

    // Показать форму добавления товара
    showAddProductForm() {
        store.showModal('addProductModal');
    }

    // Редактирование статуса заказа
    editOrderStatus(orderId, currentStatus) {
        document.getElementById('orderId').value = orderId;
        document.getElementById('orderStatus').value = currentStatus;
        store.showModal('orderStatusModal');
    }

    // Обновление статуса заказа
    async updateOrderStatus() {
        const orderId = document.getElementById('orderId').value;
        const status = document.getElementById('orderStatus').value;
        
        try {
            const response = await fetch(API_BASE + 'orders.php?action=update_status', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_id: orderId,
                    status: status
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Статус заказа обновлен', 'success');
                store.hideModal('orderStatusModal');
                this.loadOrders();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            this.showAlert('Ошибка при обновлении статуса', 'error');
        }
    }

    // Добавление товара
    async addProduct() {
        const formData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category_id: parseInt(document.getElementById('productCategory').value),
            brand: document.getElementById('productBrand').value,
            country: document.getElementById('productCountry').value,
            stock_quantity: parseInt(document.getElementById('productStock').value),
            specifications: {}
        };
        
        // Парсим характеристики
        const specsText = document.getElementById('productSpecs').value.trim();
        if (specsText) {
            try {
                formData.specifications = JSON.parse(specsText);
            } catch (e) {
                this.showAlert('Неверный формат характеристик (JSON)', 'error');
                return;
            }
        }
        
        try {
            const response = await fetch(API_BASE + 'products.php?action=add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Товар добавлен', 'success');
                store.hideModal('addProductModal');
                this.loadProducts();
                // Очистить форму
                document.getElementById('addProductForm').reset();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления товара:', error);
            this.showAlert('Ошибка при добавлении товара', 'error');
        }
    }

    // Удаление товара
    async deleteProduct(productId) {
        if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}products.php?action=delete&id=${productId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Товар удален', 'success');
                this.loadProducts();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления товара:', error);
            this.showAlert('Ошибка при удалении товара', 'error');
        }
    }

    // Редактирование пользователя
    editUser(userId) {
        // Находим пользователя
        const userCard = event.target.closest('.user-card');
        const userName = userCard.querySelector('h4').textContent;
        const userEmail = userCard.querySelector('p').textContent.replace('Email: ', '');
        const userRoleElement = userCard.querySelector('.user-role');
        let currentRole = 'buyer';
        if (userRoleElement.classList.contains('role-admin')) currentRole = 'admin';
        else if (userRoleElement.classList.contains('role-seller')) currentRole = 'seller';
        
        // Заполняем форму
        document.getElementById('editUserId').value = userId;
        document.getElementById('editUserRole').value = currentRole;
        
        // Показываем модальное окно
        store.showModal('editUserModal');
    }

    // Обновление роли пользователя
    async updateUserRole() {
        const userId = document.getElementById('editUserId').value;
        const role = document.getElementById('editUserRole').value;
        
        try {
            const response = await fetch(API_BASE + 'users.php?action=update_role', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userId,
                    role: role
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Роль пользователя обновлена', 'success');
                store.hideModal('editUserModal');
                this.loadUsers();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления роли:', error);
            this.showAlert('Ошибка при обновлении роли', 'error');
        }
    }

    // Получение текста статуса
    getStatusText(status) {
        const statusTexts = {
            'pending': 'Ожидает подтверждения',
            'confirmed': 'Подтвержден',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statusTexts[status] || status;
    }

    // Получение текста роли
    getRoleText(role) {
        const roleTexts = {
            'admin': 'Администратор',
            'seller': 'Продавец',
            'buyer': 'Покупатель'
        };
        return roleTexts[role] || role;
    }

    // Форматирование даты
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
        // Форма изменения статуса заказа
        document.getElementById('orderStatusForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateOrderStatus();
        });

        // Форма добавления товара
        document.getElementById('addProductForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });

        // Форма редактирования пользователя
        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateUserRole();
            });
        }

        // Закрытие модальных окон
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                store.hideModal(modal.id);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    store.hideModal(modal.id);
                }
            });
        });
    }
}

// Инициализация админ-панели
const admin = new AdminPanel();
