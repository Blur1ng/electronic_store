# Electronics Store - Интернет-магазин электроники

Простой интернет-магазин электроники на PHP с нативным JavaScript и CSS. Включает в себя систему авторизации, каталог товаров, корзину, заказы и панель администратора.

## Возможности

### Для покупателей:
- Регистрация и авторизация
- Просмотр каталога товаров с фильтрацией
- Поиск по товарам
- Добавление товаров в корзину
- Оформление заказов
- Отслеживание статуса заказов
- Отмена заказов
- Личный кабинет с профилем

### Для продавцов:
- Все возможности покупателей
- Добавление товаров в каталог
- Редактирование своих товаров
- Удаление товаров

### Для администраторов:
- Все возможности продавцов
- Управление всеми заказами
- Изменение статусов заказов
- Управление товарами всех продавцов
- Просмотр статистики
- Управление пользователями

## Установка

### Требования:
- Docker
- Docker Compose

### Быстрый старт с Docker:

1. **Клонируйте проект:**
   ```bash
   git clone <repository-url>
   cd electronics_store
   ```

2. **Скопируйте файл с настройками:**
   ```bash
   cp .env.example .env
   ```

3. **Отредактируйте .env файл (опционально):**
   ```bash
   # Измените порты и пароли при необходимости
   APP_PORT=8080              # Порт для веб-приложения
   PGADMIN_PORT=5050         # Порт для pgAdmin (если нужен отдельно)
   POSTGRES_PASSWORD=store_password
   ```

4. **Запустите Docker контейнеры:**
   ```bash
   # Первый запуск - инициализация базы данных
   docker-compose up -d postgres
   docker-compose run --rm init-db
   
   # Запуск всех сервисов
   docker-compose up -d
   ```

5. **Откройте приложение:**
   - Приложение: `http://localhost:8080` (или порт из .env)
   - pgAdmin: `http://localhost:8080/pgadmin`

### Управление контейнерами:

```bash
# Остановить все контейнеры
docker-compose down

# Перезапустить контейнеры
docker-compose restart

# Посмотреть логи
docker-compose logs -f

# Посмотреть логи конкретного сервиса
docker-compose logs -f php
docker-compose logs -f nginx
docker-compose logs -f postgres

# Полная очистка (включая данные БД)
docker-compose down -v
```

### Переинициализация базы данных:

```bash
# Остановить контейнеры и удалить данные
docker-compose down
docker volume rm electronics_store_postgres_data

# Запустить заново с инициализацией
docker-compose up -d postgres
docker-compose run --rm init-db
docker-compose up -d
```

### Доступ к pgAdmin:

После запуска контейнеров pgAdmin доступен по адресу: `http://localhost:8080/pgadmin`

- Email: `admin@store.com` (из .env)
- Password: `admin` (из .env)

Сервер PostgreSQL уже преднастроен в pgAdmin:
- Host: `postgres`
- Database: `electronics_store`
- Username: `store_user`
- Password: из .env файла

## Структура проекта

```
electronics_store/
├── api/                    # API endpoints
│   ├── auth.php           # Авторизация
│   ├── products.php       # Товары
│   ├── cart.php           # Корзина
│   ├── orders.php         # Заказы
│   └── users.php          # Пользователи (админ)
├── assets/                # Статические файлы
│   ├── css/
│   │   └── style.css      # Основные стили
│   ├── js/
│   │   ├── main.js        # Основной JavaScript
│   │   ├── catalog.js     # Каталог товаров
│   │   ├── cart.js        # Корзина
│   │   ├── orders.js      # Заказы
│   │   ├── profile.js     # Профиль
│   │   └── admin.js       # Админ-панель
│   └── images/            # Изображения товаров
├── classes/               # PHP классы
│   ├── User.php          # Работа с пользователями
│   ├── Product.php       # Работа с товарами
│   ├── Cart.php          # Работа с корзиной
│   └── Order.php         # Работа с заказами
├── config/
│   └── database.php       # Конфигурация БД (PostgreSQL)
├── docker/                # Docker конфигурации
│   ├── init-db.sh        # Скрипт инициализации БД
│   └── pgadmin-servers.json  # Преднастройка pgAdmin
├── nginx/
│   └── nginx.conf        # Конфигурация nginx
├── pages/                # HTML страницы
│   ├── catalog.php       # Каталог товаров
│   ├── cart.php          # Корзина
│   ├── orders.php        # Мои заказы
│   ├── profile.php       # Профиль
│   └── admin.php         # Админ-панель
├── includes/             # Включаемые файлы
├── Dockerfile            # PHP-FPM образ
├── docker-compose.yml    # Docker Compose конфигурация
├── .env.example          # Пример настроек окружения
├── index.php            # Главная страница
├── database.sql         # Структура БД (PostgreSQL)
└── README.md           # Документация
```

## Использование

### Тестовые аккаунты:
После импорта базы данных будут созданы тестовые пользователи:

- **Администратор:** admin@store.com / password
- **Продавец:** seller@store.com / password  
- **Покупатель:** buyer@store.com / password

### Основные функции:

1. **Регистрация и вход:**
   - Перейдите на главную страницу
   - Нажмите "Регистрация" или "Войти"
   - Заполните форму

2. **Просмотр каталога:**
   - Перейдите в "Каталог"
   - Используйте фильтры для поиска товаров
   - Нажмите "Подробнее" для детальной информации

3. **Добавление в корзину:**
   - Нажмите "В корзину" на любом товаре
   - Перейдите в корзину для оформления заказа

4. **Оформление заказа:**
   - В корзине нажмите "Оформить заказ"
   - Заполните адрес доставки
   - Подтвердите заказ

5. **Админ-панель:**
   - Войдите как администратор
   - Перейдите в "Админ-панель"
   - Управляйте заказами, товарами и пользователями

## API Endpoints

### Авторизация (`api/auth.php`):
- `GET ?action=profile` - Получить профиль
- `POST ?action=login` - Вход
- `POST ?action=register` - Регистрация
- `POST ?action=logout` - Выход
- `PUT ?action=profile` - Обновить профиль

### Товары (`api/products.php`):
- `GET ?action=list` - Список товаров
- `GET ?action=get&id=X` - Получить товар
- `GET ?action=categories` - Список категорий
- `GET ?action=brands` - Список брендов
- `GET ?action=countries` - Список стран
- `POST ?action=add` - Добавить товар (продавец)
- `PUT ?action=update` - Обновить товар (продавец)
- `DELETE ?action=delete&id=X` - Удалить товар (продавец)

### Корзина (`api/cart.php`):
- `GET ?action=get` - Получить корзину
- `POST ?action=add` - Добавить в корзину
- `PUT ?action=update` - Обновить количество
- `DELETE ?action=remove&product_id=X` - Удалить из корзины
- `DELETE ?action=clear` - Очистить корзину
- `GET ?action=count` - Количество товаров

### Заказы (`api/orders.php`):
- `POST ?action=create` - Создать заказ
- `GET ?action=list` - Мои заказы
- `GET ?action=get&id=X` - Детали заказа
- `POST ?action=cancel` - Отменить заказ
- `GET ?action=all` - Все заказы (админ)
- `PUT ?action=update_status` - Обновить статус (админ)
- `GET ?action=stats` - Статистика (админ)

### Пользователи (`api/users.php`):
- `GET ?action=list` - Список пользователей (админ)
- `PUT ?action=update_role` - Изменить роль (админ)

## Безопасность

- Все пароли хешируются с помощью `password_hash()`
- Используются подготовленные запросы для защиты от SQL-инъекций
- Проверка ролей пользователей для доступа к функциям
- Валидация входных данных

## Расширение функциональности

### Добавление новых полей товара:
1. Обновите структуру таблицы `products` в БД
2. Добавьте поля в форму добавления товара (`pages/admin.php`)
3. Обновите класс `Product` (`classes/Product.php`)
4. Обновите API endpoint (`api/products.php`)

### Добавление новых ролей:
1. Обновите CHECK constraint в таблице `users` в файле `database.sql`
2. Добавьте проверки ролей в соответствующие API endpoints
3. Обновите интерфейс для отображения новых ролей

### Добавление новых статусов заказа:
1. Обновите CHECK constraint в таблице `orders` в файле `database.sql`
2. Добавьте новые статусы в JavaScript файлы
3. Обновите CSS для новых статусов

## Архитектура Docker

Проект использует следующие сервисы:

1. **nginx** - Веб-сервер для обработки HTTP запросов и проксирования к PHP-FPM и pgAdmin
2. **php** - PHP-FPM 8.2 с расширением pdo_pgsql для работы с PostgreSQL
3. **postgres** - PostgreSQL 15 база данных
4. **pgadmin** - Веб-интерфейс для управления базой данных
5. **init-db** - Вспомогательный контейнер для инициализации базы данных

Все сервисы связаны через Docker network `electronics_network`.

## Техническая поддержка

При возникновении проблем:
1. Проверьте логи контейнеров: `docker-compose logs`
2. Убедитесь, что все контейнеры запущены: `docker-compose ps`
3. Проверьте .env файл на корректность настроек
4. Убедитесь, что порты не заняты другими приложениями
5. Для полной переустановки: `docker-compose down -v && docker-compose up -d`

## Лицензия

Проект создан в образовательных целях. Используйте свободно для изучения и разработки.
