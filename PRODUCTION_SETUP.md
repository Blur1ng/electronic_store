# Production Deployment Guide
# Руководство по развертыванию в production

Это руководство описывает процесс развертывания приложения Electronics Store на production сервере с доменами `back.doclarify.ai` и `pg.doclarify.ai`.

---

## 📋 Содержание

1. [Требования](#требования)
2. [Подготовка сервера](#подготовка-сервера)
3. [Настройка DNS](#настройка-dns)
4. [Установка Docker](#установка-docker)
5. [Настройка приложения](#настройка-приложения)
6. [Получение SSL сертификатов](#получение-ssl-сертификатов)
7. [Запуск приложения](#запуск-приложения)
8. [Настройка Firewall](#настройка-firewall)
9. [Мониторинг и логи](#мониторинг-и-логи)
10. [Резервное копирование](#резервное-копирование)
11. [Обновление приложения](#обновление-приложения)
12. [Решение проблем](#решение-проблем)

---

## 🔧 Требования

### Минимальные системные требования:

- **OS**: Ubuntu 22.04 LTS / Debian 11+ / CentOS 8+
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Disk**: 20 GB свободного места
- **Network**: Статический IP адрес

### Рекомендуемые требования:

- **CPU**: 4+ ядра
- **RAM**: 8+ GB
- **Disk**: 50+ GB SSD
- **Network**: 100+ Mbps

### Программное обеспечение:

- Docker 24.0+
- Docker Compose 2.20+
- Git
- certbot (для SSL)

---

## 🖥️ Подготовка сервера

### 1. Обновление системы

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. Установка необходимых пакетов

```bash
# Ubuntu/Debian
sudo apt install -y git curl wget nano ufw fail2ban

# CentOS/RHEL
sudo yum install -y git curl wget nano firewalld fail2ban
```

### 3. Создание пользователя для приложения (опционально)

```bash
# Создаем пользователя без root привилегий
sudo useradd -m -s /bin/bash electronics

# Добавляем в группу docker (после установки Docker)
sudo usermod -aG docker electronics

# Переключаемся на нового пользователя
sudo su - electronics
```

---

## 🌐 Настройка DNS

Настройте DNS записи у вашего провайдера:

### A записи (IPv4):

```
back.doclarify.ai    A    123.45.67.89
pg.doclarify.ai      A    123.45.67.89
```

Где `123.45.67.89` - это IP адрес вашего сервера.

### AAAA записи (IPv6, опционально):

```
back.doclarify.ai    AAAA    2001:db8::1
pg.doclarify.ai      AAAA    2001:db8::1
```

### Проверка DNS:

```bash
# Проверяем, что DNS записи работают
dig back.doclarify.ai +short
dig pg.doclarify.ai +short

# Или с помощью nslookup
nslookup back.doclarify.ai
nslookup pg.doclarify.ai
```

⏱️ **Важно**: DNS изменения могут занять от нескольких минут до 48 часов для полной propagation.

---

## 🐋 Установка Docker

### Ubuntu/Debian:

```bash
# Удаляем старые версии (если есть)
sudo apt remove docker docker-engine docker.io containerd runc

# Устанавливаем зависимости
sudo apt install -y ca-certificates curl gnupg lsb-release

# Добавляем официальный GPG ключ Docker
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавляем репозиторий Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Проверяем установку
docker --version
docker compose version
```

### CentOS/RHEL:

```bash
# Устанавливаем Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Запускаем Docker
sudo systemctl start docker
sudo systemctl enable docker

# Проверяем
docker --version
docker compose version
```

### Настройка Docker:

```bash
# Добавляем текущего пользователя в группу docker
sudo usermod -aG docker $USER

# Перезаходим в систему для применения изменений
exit
# Затем снова залогиньтесь по SSH

# Проверяем права
docker ps
```

---

## ⚙️ Настройка приложения

### 1. Клонирование репозитория

```bash
# Создаем директорию для приложения
sudo mkdir -p /opt/electronics_store
sudo chown $USER:$USER /opt/electronics_store
cd /opt/electronics_store

# Клонируем репозиторий
git clone <repository-url> .
```

### 2. Создание .env файла

```bash
# Копируем шаблон
cp env.production.template .env.production

# Редактируем файл
nano .env.production
```

**Обязательно измените следующие параметры:**

```bash
# СИЛЬНЫЕ ПАРОЛИ!
POSTGRES_PASSWORD=<сгенерируйте случайный пароль>
PGADMIN_DEFAULT_PASSWORD=<сгенерируйте случайный пароль>
SESSION_SECRET_KEY=<сгенерируйте hex строку>

# Email для Let's Encrypt и pgAdmin
LETSENCRYPT_EMAIL=admin@doclarify.ai
PGADMIN_DEFAULT_EMAIL=admin@doclarify.ai
```

**Генерация безопасных паролей:**

```bash
# PostgreSQL пароль (32 символа)
openssl rand -base64 32

# Session secret (64 символа hex)
openssl rand -hex 32
```

### 3. Создание директорий

```bash
# Директория для логов
mkdir -p logs/nginx logs/nginx_pg logs/pgadmin

# Директория для бэкапов
sudo mkdir -p /opt/backups/electronics_store
sudo chown $USER:$USER /opt/backups/electronics_store

# Права доступа
chmod 755 logs
chmod 755 /opt/backups/electronics_store
```

---

## 🔒 Получение SSL сертификатов

### Установка Certbot

```bash
# Ubuntu/Debian
sudo apt install -y certbot

# CentOS/RHEL
sudo yum install -y certbot
```

### Способ 1: Получение сертификатов перед запуском Docker

```bash
# Останавливаем все, что слушает 80 порт
sudo systemctl stop nginx apache2 2>/dev/null || true

# Получаем сертификат для back.doclarify.ai
sudo certbot certonly --standalone \
  -d back.doclarify.ai \
  --email admin@doclarify.ai \
  --agree-tos \
  --no-eff-email

# Получаем сертификат для pg.doclarify.ai
sudo certbot certonly --standalone \
  -d pg.doclarify.ai \
  --email admin@doclarify.ai \
  --agree-tos \
  --no-eff-email
```

### Способ 2: Использование Certbot в Docker (рекомендуется)

Добавьте в `docker-compose.prod.yml` сервис certbot:

```yaml
  certbot:
    image: certbot/certbot
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/lib/letsencrypt:/var/lib/letsencrypt
      - ./logs/letsencrypt:/var/log/letsencrypt
    command: certonly --webroot -w /var/www/certbot 
             -d back.doclarify.ai -d pg.doclarify.ai 
             --email admin@doclarify.ai --agree-tos --no-eff-email
```

### Проверка сертификатов

```bash
# Проверяем, что сертификаты созданы
sudo ls -la /etc/letsencrypt/live/back.doclarify.ai/
sudo ls -la /etc/letsencrypt/live/pg.doclarify.ai/

# Должны быть файлы:
# - fullchain.pem
# - privkey.pem
# - cert.pem
# - chain.pem
```

### Настройка автоматического обновления

```bash
# Добавляем cron задачу для автообновления (каждые 12 часов)
sudo crontab -e

# Добавьте строку:
0 */12 * * * certbot renew --quiet --post-hook "docker-compose -f /opt/electronics_store/docker-compose.prod.yml restart nginx_back nginx_pg"
```

### Активация HTTPS в nginx конфигурации

После получения сертификатов:

1. Откройте `nginx/production/back.doclarify.ai.conf`
2. Раскомментируйте блоки с SSL настройками
3. Раскомментируйте редирект с HTTP на HTTPS
4. То же самое для `nginx/production/pg.doclarify.ai.conf`

---

## 🚀 Запуск приложения

### 1. Сборка образов

```bash
cd /opt/electronics_store

# Сборка PHP образа
docker compose -f docker-compose.prod.yml build php
```

### 2. Запуск PostgreSQL и инициализация БД

```bash
# Запускаем только PostgreSQL
docker compose -f docker-compose.prod.yml up -d postgres

# Ждем запуска (смотрим логи)
docker compose -f docker-compose.prod.yml logs -f postgres

# Инициализируем базу данных
docker compose -f docker-compose.prod.yml run --rm init-db
```

### 3. Запуск всех сервисов

```bash
# Запускаем все сервисы
docker compose -f docker-compose.prod.yml up -d

# Проверяем статус
docker compose -f docker-compose.prod.yml ps

# Все контейнеры должны быть в статусе "healthy" или "running"
```

### 4. Проверка логов

```bash
# Просмотр логов всех сервисов
docker compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker compose -f docker-compose.prod.yml logs -f nginx_back
docker compose -f docker-compose.prod.yml logs -f php
docker compose -f docker-compose.prod.yml logs -f postgres
```

### 5. Проверка доступности

```bash
# Проверяем приложение
curl -I http://back.doclarify.ai
curl -I https://back.doclarify.ai

# Проверяем pgAdmin
curl -I http://pg.doclarify.ai
curl -I https://pg.doclarify.ai
```

Откройте в браузере:
- https://back.doclarify.ai
- https://pg.doclarify.ai

---

## 🔥 Настройка Firewall

### UFW (Ubuntu/Debian):

```bash
# Включаем UFW
sudo ufw enable

# Разрешаем SSH (ВАЖНО! Сделайте это первым!)
sudo ufw allow 22/tcp

# Разрешаем HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Опционально: разрешаем порты для pgAdmin если используете отдельный порт
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp

# Проверяем статус
sudo ufw status verbose

# Запрещаем прямой доступ к PostgreSQL извне (безопасность!)
# По умолчанию уже запрещен, но явно убедитесь:
sudo ufw deny 5432/tcp
```

### Firewalld (CentOS/RHEL):

```bash
# Запускаем firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Разрешаем HTTP и HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Применяем изменения
sudo firewall-cmd --reload

# Проверяем
sudo firewall-cmd --list-all
```

### Настройка Fail2ban (защита от брутфорса)

```bash
# Устанавливаем fail2ban
sudo apt install -y fail2ban  # Ubuntu/Debian
sudo yum install -y fail2ban  # CentOS/RHEL

# Создаем конфигурацию для nginx
sudo nano /etc/fail2ban/jail.local
```

Добавьте:

```ini
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /opt/electronics_store/logs/nginx/*.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /opt/electronics_store/logs/nginx/*.log

[nginx-badbots]
enabled = true
port = http,https
logpath = /opt/electronics_store/logs/nginx/*.log

[nginx-noproxy]
enabled = true
port = http,https
logpath = /opt/electronics_store/logs/nginx/*.log
```

```bash
# Перезапускаем fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban

# Проверяем статус
sudo fail2ban-client status
```

---

## 📊 Мониторинг и логи

### Просмотр логов

```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Только ошибки
docker compose -f docker-compose.prod.yml logs -f | grep -i error

# Nginx логи
tail -f /opt/electronics_store/logs/nginx/back.doclarify.ai.access.log
tail -f /opt/electronics_store/logs/nginx/back.doclarify.ai.error.log
tail -f /opt/electronics_store/logs/nginx_pg/pg.doclarify.ai.access.log
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Детальная информация о контейнере
docker compose -f docker-compose.prod.yml ps
docker inspect electronics_postgres_prod
```

### Health checks

```bash
# Проверка здоровья всех сервисов
docker compose -f docker-compose.prod.yml ps

# Все контейнеры должны показывать "healthy" в колонке Status
```

### Настройка мониторинга (опционально)

Рекомендуется установить:

1. **Prometheus + Grafana** - метрики и графики
2. **ELK Stack** (Elasticsearch, Logstash, Kibana) - анализ логов
3. **Uptime Kuma** - мониторинг доступности
4. **Netdata** - мониторинг в реальном времени

---

## 💾 Резервное копирование

### Автоматический бэкап PostgreSQL

Создайте скрипт `/opt/electronics_store/scripts/backup.sh`:

```bash
#!/bin/bash

# Настройки
BACKUP_DIR="/opt/backups/electronics_store"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Создаем бэкап
docker compose -f /opt/electronics_store/docker-compose.prod.yml exec -T postgres \
  pg_dump -U store_user_prod electronics_store | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Удаляем старые бэкапы
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Логируем
echo "$(date): Backup created: db_backup_$DATE.sql.gz" >> "$BACKUP_DIR/backup.log"
```

Сделайте скрипт исполняемым:

```bash
chmod +x /opt/electronics_store/scripts/backup.sh
```

Добавьте в crontab для ежедневного запуска в 2 часа ночи:

```bash
crontab -e

# Добавьте:
0 2 * * * /opt/electronics_store/scripts/backup.sh
```

### Ручной бэкап

```bash
# Бэкап базы данных
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U store_user_prod electronics_store > backup_$(date +%Y%m%d).sql

# Бэкап с сжатием
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U store_user_prod electronics_store | gzip > backup_$(date +%Y%m%d).sql.gz

# Бэкап всех данных (volumes)
docker compose -f docker-compose.prod.yml down
sudo tar -czf volumes_backup_$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/electronics_store_postgres_data \
  /var/lib/docker/volumes/electronics_store_pgadmin_data
docker compose -f docker-compose.prod.yml up -d
```

### Восстановление из бэкапа

```bash
# Восстановление БД из SQL файла
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U store_user_prod electronics_store

# Восстановление из сжатого файла
gunzip -c backup.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U store_user_prod electronics_store
```

---

## 🔄 Обновление приложения

### Обновление кода

```bash
cd /opt/electronics_store

# Получаем последние изменения
git pull origin main

# Пересобираем образы если изменился Dockerfile
docker compose -f docker-compose.prod.yml build php

# Перезапускаем сервисы (с минимальным downtime)
docker compose -f docker-compose.prod.yml up -d --no-deps php nginx_back nginx_pg
```

### Обновление Docker образов

```bash
# Получаем новые версии образов
docker compose -f docker-compose.prod.yml pull

# Перезапускаем с новыми образами
docker compose -f docker-compose.prod.yml up -d
```

### Миграция базы данных (если есть изменения)

```bash
# 1. Создайте бэкап!
./scripts/backup.sh

# 2. Примените SQL миграцию
cat migrations/001_new_feature.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U store_user_prod electronics_store
```

### Zero-downtime deployment (продвинутый вариант)

1. Запустите новую версию на другом порту
2. Проверьте работоспособность
3. Переключите nginx на новую версию
4. Остановите старую версию

---

## 🔧 Решение проблем

### Контейнер не запускается

```bash
# Смотрим логи
docker compose -f docker-compose.prod.yml logs <service_name>

# Проверяем конфигурацию
docker compose -f docker-compose.prod.yml config

# Пересоздаем контейнер
docker compose -f docker-compose.prod.yml up -d --force-recreate <service_name>
```

### Проблемы с подключением к БД

```bash
# Проверяем, что PostgreSQL запущен
docker compose -f docker-compose.prod.yml ps postgres

# Проверяем логи PostgreSQL
docker compose -f docker-compose.prod.yml logs postgres

# Подключаемся к БД вручную
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U store_user_prod -d electronics_store
```

### Nginx возвращает 502 Bad Gateway

```bash
# Проверяем, что PHP-FPM работает
docker compose -f docker-compose.prod.yml ps php
docker compose -f docker-compose.prod.yml logs php

# Проверяем nginx логи
tail -f logs/nginx/back.doclarify.ai.error.log

# Перезапускаем PHP
docker compose -f docker-compose.prod.yml restart php
```

### SSL сертификаты не работают

```bash
# Проверяем срок действия
sudo certbot certificates

# Обновляем вручную
sudo certbot renew

# Перезапускаем nginx
docker compose -f docker-compose.prod.yml restart nginx_back nginx_pg
```

### Проблемы с производительностью

```bash
# Смотрим использование ресурсов
docker stats

# Увеличьте ресурсы в .env.production
# Например:
PHP_MEMORY_LIMIT=1024M
POSTGRES_SHARED_BUFFERS=512MB

# Перезапустите сервисы
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Очистка старых данных Docker

```bash
# Удаление неиспользуемых образов
docker image prune -a

# Удаление старых логов (будьте осторожны!)
docker system prune --volumes

# Очистка логов nginx (оставляем последние 30 дней)
find logs/nginx -name "*.log" -mtime +30 -delete
```

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker compose -f docker-compose.prod.yml logs`
2. Проверьте health checks: `docker compose -f docker-compose.prod.yml ps`
3. Проверьте конфигурацию: `docker compose -f docker-compose.prod.yml config`
4. Проверьте firewall и DNS
5. Создайте issue в репозитории проекта

---

## 🔐 Checklist безопасности

- [ ] Используются сильные уникальные пароли
- [ ] SSL сертификаты настроены и работают
- [ ] Firewall настроен и активен
- [ ] Fail2ban установлен и настроен
- [ ] PostgreSQL порт не открыт наружу
- [ ] pgAdmin доступен только через HTTPS
- [ ] Настроено автоматическое резервное копирование
- [ ] Логи регулярно проверяются
- [ ] Docker образы регулярно обновляются
- [ ] Настроен мониторинг доступности

---

**Удачного deployment! 🚀**

