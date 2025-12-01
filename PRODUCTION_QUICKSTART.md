# Production Quick Start
# Быстрый старт для production сервера

Краткая инструкция по развертыванию на сервере с доменами `back.doclarify.ai` и `pg.doclarify.ai`.

---

## Архитектура

- **Nginx** - bare metal на сервере (порты 80, 443)
- **PHP-FPM** - Docker контейнер (localhost:9000)
- **PostgreSQL** - Docker контейнер (localhost:5432)
- **pgAdmin** - Docker контейнер (localhost:5050)

---

## Быстрая установка

### 1. Установка системных пакетов

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем необходимые пакеты
sudo apt install -y git curl wget nginx certbot python3-certbot-nginx ufw fail2ban

# Устанавливаем Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

### 2. Клонирование проекта

```bash
# Создаем директорию
sudo mkdir -p /opt/electronics_store
sudo chown $USER:$USER /opt/electronics_store

# Клонируем репозиторий
cd /opt/electronics_store
git clone <repository-url> .
```

### 3. Настройка окружения

```bash
# Копируем шаблон .env
cp env.production.template .env.production

# Редактируем файл (ВАЖНО: измените пароли!)
nano .env.production
```

**Минимальные изменения в .env.production:**
```bash
POSTGRES_PASSWORD=<сильный_пароль>
PGADMIN_DEFAULT_PASSWORD=<сильный_пароль>
SESSION_SECRET_KEY=<случайная_hex_строка>
LETSENCRYPT_EMAIL=admin@doclarify.ai
```

Генерация паролей:
```bash
openssl rand -base64 32  # Для POSTGRES_PASSWORD
openssl rand -base64 32  # Для PGADMIN_DEFAULT_PASSWORD
openssl rand -hex 32     # Для SESSION_SECRET_KEY
```

### 4. Настройка DNS

Убедитесь что DNS записи настроены:
```
back.doclarify.ai    A    <IP_сервера>
pg.doclarify.ai      A    <IP_сервера>
```

Проверка:
```bash
dig back.doclarify.ai +short
dig pg.doclarify.ai +short
```

### 5. Запуск Docker контейнеров

```bash
cd /opt/electronics_store

# Создаем директории для логов
mkdir -p logs/nginx logs/nginx_pg logs/pgadmin

# Запускаем PostgreSQL
docker compose -f docker-compose.prod.yml up -d postgres

# Инициализируем базу данных
docker compose -f docker-compose.prod.yml run --rm init-db

# Запускаем все сервисы
docker compose -f docker-compose.prod.yml up -d

# Проверяем статус
docker compose -f docker-compose.prod.yml ps
```

Все контейнеры должны быть в статусе `Up` и `healthy`.

### 6. Настройка Nginx

```bash
# Копируем конфигурации
sudo cp nginx/production/back.doclarify.ai.conf /etc/nginx/sites-available/
sudo cp nginx/production/pg.doclarify.ai.conf /etc/nginx/sites-available/

# Создаем симлинки
sudo ln -s /etc/nginx/sites-available/back.doclarify.ai.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/pg.doclarify.ai.conf /etc/nginx/sites-enabled/

# Удаляем дефолтный конфиг
sudo rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
sudo nginx -t

# Перезагружаем nginx
sudo systemctl reload nginx
```

### 7. Получение SSL сертификатов

```bash
# Получаем сертификаты (автоматическая настройка nginx)
sudo certbot --nginx -d back.doclarify.ai --email admin@doclarify.ai --agree-tos --no-eff-email
sudo certbot --nginx -d pg.doclarify.ai --email admin@doclarify.ai --agree-tos --no-eff-email

# Проверяем автообновление
sudo certbot renew --dry-run

# Настраиваем автообновление
sudo crontab -e
# Добавьте: 0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### 8. Настройка Firewall

```bash
# Включаем UFW
sudo ufw --force enable

# Разрешаем SSH (ВАЖНО!)
sudo ufw allow 22/tcp

# Разрешаем HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверяем
sudo ufw status
```

### 9. Проверка работы

```bash
# Проверяем что все запущено
docker compose -f docker-compose.prod.yml ps
sudo systemctl status nginx

# Проверяем порты
sudo netstat -tlnp | grep -E ':(80|443|9000|5050|5432)'

# Тестируем доступность
curl -I https://back.doclarify.ai
curl -I https://pg.doclarify.ai
```

Откройте в браузере:
- https://back.doclarify.ai - основное приложение
- https://pg.doclarify.ai - pgAdmin

---

## Тестовые пользователи

После инициализации БД доступны пользователи (пароль: `password`):

- **admin@store.com** - администратор
- **seller@store.com** - продавец
- **buyer@store.com** - покупатель

**⚠️ ВАЖНО:** Смените пароли в production!

---

## Настройка автоматических бэкапов

```bash
# Создаем скрипт бэкапа
mkdir -p /opt/electronics_store/scripts
cat > /opt/electronics_store/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/electronics_store"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)

docker compose -f /opt/electronics_store/docker-compose.prod.yml exec -T postgres \
  pg_dump -U store_user_prod electronics_store | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Удаляем бэкапы старше 30 дней
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "$(date): Backup created: db_backup_$DATE.sql.gz"
EOF

chmod +x /opt/electronics_store/scripts/backup.sh

# Добавляем в crontab (ежедневно в 2 часа ночи)
crontab -e
# Добавьте: 0 2 * * * /opt/electronics_store/scripts/backup.sh >> /opt/backups/electronics_store/backup.log 2>&1
```

---

## Полезные команды

### Управление Docker

```bash
# Логи всех сервисов
docker compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker compose -f docker-compose.prod.yml logs -f php
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml logs -f pgadmin

# Перезапуск сервиса
docker compose -f docker-compose.prod.yml restart php

# Остановка всех сервисов
docker compose -f docker-compose.prod.yml down

# Запуск всех сервисов
docker compose -f docker-compose.prod.yml up -d
```

### Управление Nginx

```bash
# Проверка конфигурации
sudo nginx -t

# Перезагрузка (без downtime)
sudo systemctl reload nginx

# Рестарт
sudo systemctl restart nginx

# Логи
sudo tail -f /var/log/nginx/back.doclarify.ai.error.log
sudo tail -f /var/log/nginx/pg.doclarify.ai.error.log
```

### Бэкап и восстановление

```bash
# Ручной бэкап БД
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U store_user_prod electronics_store > backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U store_user_prod electronics_store
```

---

## Обновление приложения

```bash
cd /opt/electronics_store

# Создаем бэкап перед обновлением
./scripts/backup.sh

# Получаем последние изменения
git pull origin main

# Пересобираем PHP образ если нужно
docker compose -f docker-compose.prod.yml build php

# Перезапускаем сервисы
docker compose -f docker-compose.prod.yml up -d

# Обновляем конфигурации nginx если изменились
sudo cp nginx/production/*.conf /etc/nginx/sites-available/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Мониторинг

### Базовый мониторинг

```bash
# Использование ресурсов Docker контейнерами
docker stats

# Статус всех сервисов
docker compose -f docker-compose.prod.yml ps

# Проверка health checks
docker inspect electronics_postgres_prod | grep -A 10 Health
docker inspect electronics_php_prod | grep -A 10 Health
```

### Проверка доступности

```bash
# Создаем скрипт проверки
cat > /opt/electronics_store/scripts/healthcheck.sh << 'EOF'
#!/bin/bash
curl -f https://back.doclarify.ai > /dev/null 2>&1 || echo "$(date): back.doclarify.ai DOWN!"
curl -f https://pg.doclarify.ai > /dev/null 2>&1 || echo "$(date): pg.doclarify.ai DOWN!"
EOF

chmod +x /opt/electronics_store/scripts/healthcheck.sh

# Добавляем в crontab (каждые 5 минут)
crontab -e
# Добавьте: */5 * * * * /opt/electronics_store/scripts/healthcheck.sh >> /var/log/healthcheck.log
```

---

## Решение проблем

### Контейнер не запускается
```bash
docker compose -f docker-compose.prod.yml logs <service_name>
docker compose -f docker-compose.prod.yml up -d --force-recreate <service_name>
```

### 502 Bad Gateway
```bash
# Проверяем PHP
docker compose -f docker-compose.prod.yml ps php
docker compose -f docker-compose.prod.yml logs php
docker compose -f docker-compose.prod.yml restart php
```

### SSL проблемы
```bash
sudo certbot certificates
sudo certbot renew
sudo systemctl reload nginx
```

---

## Security Checklist

- [ ] Сильные уникальные пароли установлены
- [ ] SSL сертификаты получены и работают
- [ ] Firewall настроен (только 22, 80, 443 открыты)
- [ ] Fail2ban установлен и настроен
- [ ] Автоматические бэкапы настроены
- [ ] Дефолтные пароли тестовых пользователей изменены
- [ ] PostgreSQL не доступен извне (только localhost)
- [ ] Логи регулярно проверяются
- [ ] Мониторинг настроен

---

## Поддержка

Подробная документация:
- **PRODUCTION_SETUP.md** - полное руководство по deployment
- **NGINX_BARE_METAL.md** - детальная настройка nginx
- **README.md** - общая информация о проекте

---

**Production готов к работе! 🚀**

