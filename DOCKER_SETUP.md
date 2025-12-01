# Быстрый старт с Docker

## Первоначальная настройка

```bash
# 1. Скопировать файл с настройками
cp .env.example .env

# 2. Запустить PostgreSQL
docker-compose up -d postgres

# 3. Инициализировать базу данных
docker-compose run --rm init-db

# 4. Запустить все сервисы
docker-compose up -d
```

## Доступ к приложению

- **Приложение**: http://localhost:8080
- **pgAdmin**: http://localhost:8080/pgadmin

## Тестовые пользователи

Пароль для всех: `password`

- admin@store.com (администратор)
- seller@store.com (продавец)
- buyer@store.com (покупатель)

## pgAdmin доступ

- Email: admin@store.com
- Password: admin

## Полезные команды

```bash
# Посмотреть логи
docker-compose logs -f

# Остановить все
docker-compose down

# Полная переустановка (с удалением данных)
docker-compose down -v
docker-compose up -d postgres
docker-compose run --rm init-db
docker-compose up -d
```

## Архитектура

- **nginx** (порт 8080) - веб-сервер
- **php-fpm** - PHP 8.2 с pdo_pgsql
- **postgres** - PostgreSQL 15
- **pgadmin** - управление БД

Все сервисы соединены через сеть `electronics_network`.

