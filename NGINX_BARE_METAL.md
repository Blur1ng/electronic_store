# Установка Nginx на Bare Metal для Production

Инструкция по установке и настройке nginx на bare metal сервере для работы с Docker контейнерами.

---

## Архитектура

```
Internet
    ↓
Nginx (bare metal, порты 80/443)
    ↓
    ├─→ PHP-FPM (Docker, localhost:9000) → PostgreSQL (Docker, localhost:5432)
    └─→ pgAdmin (Docker, localhost:5050)
```

**Nginx на хосте** проксирует запросы к сервисам в Docker контейнерах через localhost порты.

---

## Установка Nginx

### Ubuntu/Debian:

```bash
# Обновляем систему
sudo apt update

# Устанавливаем nginx
sudo apt install -y nginx

# Проверяем установку
nginx -v

# Запускаем nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверяем статус
sudo systemctl status nginx
```

### CentOS/RHEL:

```bash
# Устанавливаем nginx
sudo yum install -y epel-release
sudo yum install -y nginx

# Запускаем nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверяем статус
sudo systemctl status nginx
```

---

## Настройка Nginx

### 1. Копирование конфигураций

```bash
# Переходим в директорию проекта
cd /opt/electronics_store

# Копируем конфигурации в nginx
sudo cp nginx/production/back.doclarify.ai.conf /etc/nginx/sites-available/
sudo cp nginx/production/pg.doclarify.ai.conf /etc/nginx/sites-available/

# Создаем симлинки (Ubuntu/Debian)
sudo ln -s /etc/nginx/sites-available/back.doclarify.ai.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/pg.doclarify.ai.conf /etc/nginx/sites-enabled/

# Для CentOS/RHEL (нет sites-available/sites-enabled)
# Копируем напрямую в conf.d
sudo cp nginx/production/back.doclarify.ai.conf /etc/nginx/conf.d/
sudo cp nginx/production/pg.doclarify.ai.conf /etc/nginx/conf.d/
```

### 2. Удаляем дефолтный конфиг (опционально)

```bash
# Ubuntu/Debian
sudo rm /etc/nginx/sites-enabled/default

# CentOS/RHEL
sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak
```

### 3. Создаем директорию для логов

```bash
# Создаем директорию
sudo mkdir -p /var/log/nginx

# Устанавливаем права
sudo chown -R www-data:www-data /var/log/nginx  # Ubuntu/Debian
sudo chown -R nginx:nginx /var/log/nginx        # CentOS/RHEL
```

### 4. Проверяем конфигурацию

```bash
# Проверяем синтаксис
sudo nginx -t

# Если OK, перезагружаем nginx
sudo systemctl reload nginx
```

---

## Получение SSL сертификатов

### Установка Certbot

```bash
# Ubuntu/Debian
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

### Получение сертификатов

**Способ 1: Автоматическая настройка (рекомендуется)**

```bash
# Certbot автоматически настроит nginx конфиги
sudo certbot --nginx -d back.doclarify.ai
sudo certbot --nginx -d pg.doclarify.ai
```

**Способ 2: Только получить сертификаты**

```bash
# Получаем сертификаты
sudo certbot certonly --nginx -d back.doclarify.ai
sudo certbot certonly --nginx -d pg.doclarify.ai

# Затем вручную раскомментируем SSL блоки в конфигах:
sudo nano /etc/nginx/sites-available/back.doclarify.ai.conf
sudo nano /etc/nginx/sites-available/pg.doclarify.ai.conf

# Перезагружаем nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Автоматическое обновление сертификатов

```bash
# Тестируем обновление
sudo certbot renew --dry-run

# Добавляем в crontab (автоматически обновлять)
sudo crontab -e

# Добавьте строку:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## Запуск Docker контейнеров

После настройки nginx на хосте, запускаем Docker контейнеры:

```bash
cd /opt/electronics_store

# Запускаем PostgreSQL и инициализируем БД
docker compose -f docker-compose.prod.yml up -d postgres
docker compose -f docker-compose.prod.yml run --rm init-db

# Запускаем все сервисы
docker compose -f docker-compose.prod.yml up -d

# Проверяем статус
docker compose -f docker-compose.prod.yml ps
```

**Проверка портов:**

```bash
# Проверяем что сервисы слушают на localhost
sudo netstat -tlnp | grep -E ':(9000|5050|5432)'

# Должно показать:
# 127.0.0.1:9000  - PHP-FPM
# 127.0.0.1:5050  - pgAdmin
# 127.0.0.1:5432  - PostgreSQL (опционально)
```

---

## Проверка работы

### 1. Проверка nginx конфигурации

```bash
# Проверяем синтаксис
sudo nginx -t

# Проверяем что nginx запущен
sudo systemctl status nginx
```

### 2. Проверка доступности

```bash
# Проверяем основное приложение
curl -I http://back.doclarify.ai
curl -I https://back.doclarify.ai

# Проверяем pgAdmin
curl -I http://pg.doclarify.ai
curl -I https://pg.doclarify.ai
```

### 3. Проверка логов

```bash
# Nginx логи
sudo tail -f /var/log/nginx/back.doclarify.ai.access.log
sudo tail -f /var/log/nginx/back.doclarify.ai.error.log
sudo tail -f /var/log/nginx/pg.doclarify.ai.access.log

# Docker логи
docker compose -f docker-compose.prod.yml logs -f php
docker compose -f docker-compose.prod.yml logs -f pgadmin
```

---

## Оптимизация Nginx

### Общие настройки производительности

Создайте/отредактируйте `/etc/nginx/nginx.conf`:

```nginx
user www-data;  # или nginx для CentOS/RHEL
worker_processes auto;  # Автоматически по количеству CPU
pid /run/nginx.pid;

events {
    worker_connections 2048;  # Увеличиваем от дефолтных 768
    use epoll;  # Эффективный метод для Linux
    multi_accept on;  # Принимать несколько соединений за раз
}

http {
    # Основные настройки
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;  # Не показывать версию nginx
    
    # Размеры буферов
    client_body_buffer_size 128k;
    client_max_body_size 20m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;
    
    # Таймауты
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
    
    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "msie6";
    
    # Логирование
    access_log /var/log/nginx/access.log combined buffer=32k flush=5s;
    error_log /var/log/nginx/error.log warn;
    
    # Подключаем конфигурации сайтов
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;  # Ubuntu/Debian
}
```

После изменений:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Мониторинг Nginx

### Базовый мониторинг

```bash
# Статус nginx
sudo systemctl status nginx

# Проверка процессов
ps aux | grep nginx

# Активные соединения
ss -s
```

### Настройка stub_status (опционально)

Добавьте в `/etc/nginx/conf.d/status.conf`:

```nginx
server {
    listen 127.0.0.1:8080;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

Проверка:

```bash
curl http://127.0.0.1:8080/nginx_status
```

---

## Ротация логов

Nginx автоматически использует logrotate. Проверьте конфигурацию:

```bash
# Проверяем конфигурацию logrotate
cat /etc/logrotate.d/nginx

# Вручную запустить ротацию (тестирование)
sudo logrotate -f /etc/logrotate.d/nginx
```

Пример конфигурации `/etc/logrotate.d/nginx`:

```
/var/log/nginx/*.log {
    daily                    # Ежедневная ротация
    missingok               # Не ошибка если лог отсутствует
    rotate 14               # Хранить 14 дней
    compress                # Сжимать старые логи
    delaycompress          # Не сжимать последний лог
    notifempty             # Не ротировать пустые логи
    create 0640 www-data adm  # Права на новые файлы
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
```

---

## Firewall настройки

### UFW (Ubuntu/Debian)

```bash
# Разрешаем nginx
sudo ufw allow 'Nginx Full'

# Или вручную
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверяем
sudo ufw status
```

### Firewalld (CentOS/RHEL)

```bash
# Разрешаем HTTP и HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Применяем
sudo firewall-cmd --reload

# Проверяем
sudo firewall-cmd --list-all
```

---

## Решение проблем

### Nginx не стартует

```bash
# Проверяем конфигурацию
sudo nginx -t

# Смотрим логи ошибок
sudo tail -f /var/log/nginx/error.log

# Проверяем что порты свободны
sudo netstat -tlnp | grep -E ':(80|443)'
```

### 502 Bad Gateway

```bash
# Проверяем что PHP-FPM работает
docker compose -f docker-compose.prod.yml ps php

# Проверяем что порт 9000 открыт
curl -v telnet://127.0.0.1:9000

# Смотрим логи PHP
docker compose -f docker-compose.prod.yml logs php

# Проверяем SELinux (CentOS/RHEL)
sudo getenforce
# Если Enforcing - настройте политики
sudo setsebool -P httpd_can_network_connect 1
```

### pgAdmin не отвечает

```bash
# Проверяем контейнер
docker compose -f docker-compose.prod.yml ps pgadmin

# Проверяем порт
curl -v http://127.0.0.1:5050

# Смотрим логи
docker compose -f docker-compose.prod.yml logs pgadmin
```

### Permission denied

```bash
# Проверяем SELinux
sudo getenforce

# Временно отключить (для тестирования)
sudo setenforce 0

# Постоянно отключить (не рекомендуется)
sudo nano /etc/selinux/config
# SELINUX=permissive

# Или настройте правильные политики SELinux
```

---

## Обновление конфигураций

Когда вы обновляете конфигурации nginx:

```bash
cd /opt/electronics_store

# Обновляем проект
git pull

# Копируем новые конфиги
sudo cp nginx/production/back.doclarify.ai.conf /etc/nginx/sites-available/
sudo cp nginx/production/pg.doclarify.ai.conf /etc/nginx/sites-available/

# Проверяем синтаксис
sudo nginx -t

# Применяем изменения (без downtime)
sudo systemctl reload nginx
```

---

## Checklist установки

- [ ] Nginx установлен и запущен
- [ ] Конфигурации скопированы в /etc/nginx/
- [ ] Симлинки созданы (Ubuntu/Debian)
- [ ] Дефолтный конфиг удален
- [ ] nginx -t проходит без ошибок
- [ ] SSL сертификаты получены
- [ ] HTTPS настроен и работает
- [ ] Автообновление сертификатов настроено
- [ ] Firewall настроен (порты 80, 443 открыты)
- [ ] Docker контейнеры запущены
- [ ] PHP-FPM доступен на localhost:9000
- [ ] pgAdmin доступен на localhost:5050
- [ ] Приложение работает через https://back.doclarify.ai
- [ ] pgAdmin работает через https://pg.doclarify.ai
- [ ] Логи проверены, ошибок нет

---

**Готово! Nginx настроен и работает с Docker контейнерами. 🚀**

