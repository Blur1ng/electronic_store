// JavaScript для страницы заказов

class OrdersPage {
    constructor() {
        this.orders = [];
        this.init();
    }

    async init() {
        // Ждем пока загрузится информация о пользователе
        let attempts = 0;
        while (store.currentUser === null && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        this.loadOrders();
        this.setupEventListeners();
    }

    // Загрузка заказов
    async loadOrders() {
        if (!store.currentUser) {
            this.showNoOrders();
            return;
        }

        try {
            const response = await fetch(API_BASE + 'orders.php?action=list');
            const data = await response.json();
            
            if (data.success) {
                this.orders = data.orders;
                this.renderOrders();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            this.showAlert('Ошибка загрузки заказов', 'error');
        }
    }

    // Отображение заказов
    renderOrders() {
        const ordersList = document.getElementById('ordersList');
        const noOrders = document.getElementById('noOrders');
        
        if (this.orders.length === 0) {
            this.showNoOrders();
            return;
        }
        
        ordersList.innerHTML = '';
        noOrders.style.display = 'none';
        
        this.orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            orderCard.innerHTML = `
                <div class="order-header">
                    <div>
                        <h4>Заказ #${order.id}</h4>
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
                    <button class="btn btn-secondary" onclick="orders.showOrderDetails(${order.id})">
                        Подробнее
                    </button>
                    ${this.canCancelOrder(order.status) ? 
                        `<button class="btn btn-danger" onclick="orders.cancelOrder(${order.id})">
                            Отменить заказ
                        </button>` : ''
                    }
                </div>
            `;
            ordersList.appendChild(orderCard);
        });
    }

    // Показать отсутствие заказов
    showNoOrders() {
        document.getElementById('ordersList').innerHTML = '';
        document.getElementById('noOrders').style.display = 'block';
    }

    // Показать детали заказа
    async showOrderDetails(orderId) {
        try {
            const response = await fetch(`${API_BASE}orders.php?action=get&id=${orderId}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderOrderDetails(data.order, data.items);
                store.showModal('orderDetailsModal');
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка загрузки деталей заказа:', error);
            this.showAlert('Ошибка загрузки деталей заказа', 'error');
        }
    }

    // Отображение деталей заказа
    renderOrderDetails(order, items) {
        document.getElementById('orderNumber').textContent = order.id;
        
        const content = document.getElementById('orderDetailsContent');
        content.innerHTML = `
            <div class="order-details">
                <div class="order-info-section">
                    <h4>Информация о заказе</h4>
                    <p><strong>Статус:</strong> <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span></p>
                    <p><strong>Дата создания:</strong> ${this.formatDate(order.created_at)}</p>
                    <p><strong>Дата обновления:</strong> ${this.formatDate(order.updated_at)}</p>
                    <p><strong>Общая сумма:</strong> ${this.formatPrice(order.total_amount)}</p>
                </div>
                
                <div class="order-address-section">
                    <h4>Адрес доставки</h4>
                    <p>${order.shipping_address}</p>
                </div>
                
                ${order.notes ? `
                <div class="order-notes-section">
                    <h4>Комментарии к заказу</h4>
                    <p>${order.notes}</p>
                </div>
                ` : ''}
                
                <div class="order-items-section">
                    <h4>Товары в заказе</h4>
                    <div class="order-items-list">
                        ${items.map(item => `
                            <div class="order-item">
                                <img src="${item.image_url || '../assets/images/no-image.jpg'}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover;">
                                <div class="item-info">
                                    <h5>${item.name}</h5>
                                    <p>Количество: ${item.quantity}</p>
                                    <p>Цена: ${this.formatPrice(item.price)}</p>
                                </div>
                                <div class="item-total">
                                    ${this.formatPrice(item.price * item.quantity)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // Отмена заказа
    async cancelOrder(orderId) {
        if (!confirm('Вы уверены, что хотите отменить этот заказ?')) {
            return;
        }

        try {
            const response = await fetch(API_BASE + 'orders.php?action=cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_id: orderId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showAlert('Заказ отменен', 'success');
                this.loadOrders();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка отмены заказа:', error);
            this.showAlert('Ошибка при отмене заказа', 'error');
        }
    }

    // Проверка возможности отмены заказа
    canCancelOrder(status) {
        return ['pending', 'confirmed'].includes(status);
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
        // Закрытие модального окна деталей заказа
        const orderDetailsModal = document.getElementById('orderDetailsModal');
        orderDetailsModal.querySelector('.close').addEventListener('click', () => {
            store.hideModal('orderDetailsModal');
        });

        orderDetailsModal.addEventListener('click', (e) => {
            if (e.target === orderDetailsModal) {
                store.hideModal('orderDetailsModal');
            }
        });
    }
}

// Инициализация страницы заказов
const orders = new OrdersPage();
