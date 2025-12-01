#!/bin/sh

# Скрипт инициализации базы данных PostgreSQL для electronics_store
# Этот скрипт запускается в отдельном контейнере для первоначальной настройки БД

echo "===================================="
echo "Инициализация базы данных"
echo "===================================="

# Ожидание готовности PostgreSQL
echo "Ожидание готовности PostgreSQL..."
# Подключаемся проверкой готовности от имени суперпользователя postgres
until pg_isready -h postgres -U postgres -d postgres; do
  echo "PostgreSQL еще не готов - ожидание..."
  sleep 2
done

echo "PostgreSQL готов!"
echo ""

# Проверка существования базы данных
echo "Проверка базы данных..."
# Для инициализации всегда используем суперпользователя postgres,
# пароль берётся из POSTGRES_PASSWORD, как в официальном образе
DB_EXISTS=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h postgres -U postgres -d "${POSTGRES_DB:-electronics_store}" -tAc "SELECT 1 FROM pg_tables WHERE tablename='users' LIMIT 1;" 2>/dev/null)

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️  База данных уже инициализирована!"
    echo "Таблица 'users' существует."
    echo ""
    echo "Если вы хотите пересоздать базу данных:"
    echo "1. Остановите все контейнеры: docker-compose down"
    echo "2. Удалите volume: docker volume rm electronics_store_postgres_data"
    echo "3. Запустите заново: docker-compose up -d"
    echo ""
    exit 0
fi

# Выполнение SQL скрипта
echo "Выполнение SQL скрипта..."
if PGPASSWORD="${POSTGRES_PASSWORD}" psql -h postgres -U postgres -d "${POSTGRES_DB:-electronics_store}" -f /database.sql; then
    echo ""
    echo "✅ База данных успешно инициализирована!"
    echo ""
    echo "Тестовые пользователи (пароль для всех: password):"
    echo "  - admin@store.com   (роль: admin)"
    echo "  - seller@store.com  (роль: seller)"
    echo "  - buyer@store.com   (роль: buyer)"
    echo ""
    echo "Для доступа к pgAdmin:"
    echo "  URL: http://localhost:\${APP_PORT}/pgadmin"
    echo "  Email: \${PGADMIN_DEFAULT_EMAIL}"
    echo "  Password: \${PGADMIN_DEFAULT_PASSWORD}"
    echo ""
else
    echo ""
    echo "❌ Ошибка при инициализации базы данных!"
    echo "Проверьте логи для получения дополнительной информации."
    echo ""
    exit 1
fi

