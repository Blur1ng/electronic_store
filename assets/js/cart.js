// JavaScript для страницы корзины

class CartPage {
    constructor() {
        this.cartItems = [];
        this.init();
    }

    async init() {
        // Ждем пока загрузится информация о пользователе
        let attempts = 0;
        while (store.currentUser === null && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        this.loadCart();
        this.setupEventListeners();
    }

    // Загрузка корзины
    async loadCart() {
        if (!store.currentUser) {
            this.showEmptyCart();
            return;
        }

        try {
            const response = await fetch(API_BASE + 'cart.php?action=get');
            const data = await response.json();
            
            if (data.success) {
                this.cartItems = data.items;
                this.renderCart();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка загрузки корзины:', error);
            this.showAlert('Ошибка загрузки корзины', 'error');
        }
    }

    // Отображение корзины
    renderCart() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartSummary = document.getElementById('cartSummary');
        const emptyCart = document.getElementById('emptyCart');
        
        if (this.cartItems.length === 0) {
            this.showEmptyCart();
            return;
        }
        
        cartItemsContainer.innerHTML = '';
        cartSummary.style.display = 'block';
        emptyCart.style.display = 'none';
        
        let totalAmount = 0;
        
        this.cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image_url || '../assets/images/no-image.jpg'}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="price">${this.formatPrice(item.price)} за шт.</div>
                </div>
                <div class="cart-item-controls">
                    <button onclick="cart.updateQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" min="1" 
                           onchange="cart.updateQuantity(${item.product_id}, this.value)">
                    <button onclick="cart.updateQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
                    <button onclick="cart.removeItem(${item.product_id})" class="btn btn-danger">Удалить</button>
                </div>
                <div class="item-total">
                    <strong>${this.formatPrice(itemTotal)}</strong>
                </div>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
        
        // Обновляем итоговую сумму
        document.getElementById('itemsTotal').textContent = this.formatPrice(totalAmount);
        document.getElementById('totalAmount').textContent = this.formatPrice(totalAmount);
    }

    // Показать пустую корзину
    showEmptyCart() {
        document.getElementById('cartItems').innerHTML = '';
        document.getElementById('cartSummary').style.display = 'none';
        document.getElementById('emptyCart').style.display = 'block';
    }

    // Обновление количества товара
    async updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) {
            this.removeItem(productId);
            return;
        }

        try {
            const response = await fetch(API_BASE + 'cart.php?action=update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity: parseInt(newQuantity)
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.loadCart();
                store.updateCartCount();
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления количества:', error);
            this.showAlert('Ошибка при обновлении количества', 'error');
        }
    }

    // Удаление товара из корзины
    async removeItem(productId) {
        if (!confirm('Удалить товар из корзины?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}cart.php?action=remove&product_id=${productId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.loadCart();
                store.updateCartCount();
                this.showAlert('Товар удален из корзины', 'success');
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления товара:', error);
            this.showAlert('Ошибка при удалении товара', 'error');
        }
    }

    // Оформление заказа
    async checkout() {
        if (!store.currentUser) {
            store.showModal('loginModal');
            return;
        }

        if (this.cartItems.length === 0) {
            this.showAlert('Корзина пуста', 'error');
            return;
        }

        store.showModal('checkoutModal');
    }

    // Подтверждение заказа
    async confirmOrder() {
        const shippingAddress = document.getElementById('shippingAddress').value.trim();
        const orderNotes = document.getElementById('orderNotes').value.trim();
        
        if (!shippingAddress) {
            this.showAlert('Укажите адрес доставки', 'error');
            return;
        }

        try {
            const response = await fetch(API_BASE + 'orders.php?action=create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    shipping_address: shippingAddress,
                    notes: orderNotes
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                store.hideModal('checkoutModal');
                this.showAlert('Заказ успешно оформлен!', 'success');
                this.loadCart();
                store.updateCartCount();
                
                // Перенаправляем на страницу заказов через 2 секунды
                setTimeout(() => {
                    window.location.href = 'orders.php';
                }, 2000);
            } else {
                this.showAlert(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка оформления заказа:', error);
            this.showAlert('Ошибка при оформлении заказа', 'error');
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
        // Кнопка оформления заказа
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.checkout();
        });

        // Форма оформления заказа
        document.getElementById('checkoutForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.confirmOrder();
        });

        // Закрытие модального окна оформления заказа
        const checkoutModal = document.getElementById('checkoutModal');
        checkoutModal.querySelector('.close').addEventListener('click', () => {
            store.hideModal('checkoutModal');
        });

        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) {
                store.hideModal('checkoutModal');
            }
        });
    }
}

// Инициализация страницы корзины
const cart = new CartPage();
