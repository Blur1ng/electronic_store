// JavaScript для страницы профиля

class ProfilePage {
    constructor() {
        this.userStats = null;
        this.init();
    }

    async init() {
        // Ждем пока загрузится информация о пользователе
        let attempts = 0;
        while (store.currentUser === null && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        this.loadProfile();
        this.loadStats();
        this.setupEventListeners();
    }

    // Загрузка профиля
    async loadProfile() {
        if (!store.currentUser) {
            this.showAlert('Необходима авторизация', 'error');
            setTimeout(() => {
                window.location.href = '../index.php';
            }, 2000);
            return;
        }

        // Заполняем форму данными пользователя
        document.getElementById('profileName').value = store.currentUser.name;
        document.getElementById('profileEmail').value = store.currentUser.email;
        document.getElementById('profilePhone').value = store.currentUser.phone || '';
        document.getElementById('profileAddress').value = store.currentUser.address || '';
        document.getElementById('profileRole').value = this.getRoleText(store.currentUser.role);
    }

    // Загрузка статистики
    async loadStats() {
        try {
            // Загружаем заказы пользователя
            const ordersResponse = await fetch(API_BASE + 'orders.php?action=list');
            const ordersData = await ordersResponse.json();
            
            if (ordersData.success) {
                const orders = ordersData.orders;
                const totalOrders = orders.length;
                const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
                
                document.getElementById('totalOrders').textContent = totalOrders;
                document.getElementById('totalSpent').textContent = this.formatPrice(totalSpent);
            }

            // Загружаем количество товаров в корзине
            const cartResponse = await fetch(API_BASE + 'cart.php?action=count');
            const cartData = await cartResponse.json();
            
            if (cartData.success) {
                document.getElementById('cartItems').textContent = cartData.count;
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }

    // Обновление профиля
    async updateProfile() {
        const formData = {
            name: document.getElementById('profileName').value,
            phone: document.getElementById('profilePhone').value,
            address: document.getElementById('profileAddress').value
        };

        try {
            const response = await fetch(API_BASE + 'auth.php?action=profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('Профиль обновлен', 'success');
                // Обновляем данные пользователя в store
                store.currentUser.name = formData.name;
                store.currentUser.phone = formData.phone;
                store.currentUser.address = formData.address;
                document.getElementById('userName').textContent = formData.name;
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления профиля:', error);
            this.showAlert('Ошибка при обновлении профиля', 'error');
        }
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
        // Форма профиля
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });
    }
}

// Инициализация страницы профиля
const profile = new ProfilePage();
