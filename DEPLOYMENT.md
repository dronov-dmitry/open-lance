# 📦 Инструкция по развертыванию Open-Lance

Полное руководство по развертыванию платформы от А до Я.

## 📋 Содержание

1. [Требования](#-требования)
2. [Шаг 1: MongoDB Atlas](#-шаг-1-mongodb-atlas)
3. [Шаг 2: Cloudflare](#-шаг-2-cloudflare)
4. [Шаг 3: Установка зависимостей](#-шаг-3-установка-зависимостей)
5. [Шаг 4: Деплой backend](#-шаг-4-деплой-backend)
6. [Шаг 5: Настройка frontend](#-шаг-5-настройка-frontend)
7. [Шаг 6: GitHub Pages](#-шаг-6-github-pages)
8. [Решение проблем](#-решение-проблем)

---

## ⚙️ Требования

- **Node.js** >= 18.x ([скачать](https://nodejs.org/))
- **Git** ([скачать](https://git-scm.com/))
- **MongoDB Atlas** аккаунт (бесплатный)
- **Cloudflare** аккаунт (бесплатный)
- **GitHub** аккаунт (для frontend хостинга)

**Общее время: ~20-30 минут**

---

## 🗄️ Шаг 1: MongoDB Atlas

### 1.1. Регистрация

1. Откройте [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Зарегистрируйтесь через Google/GitHub (быстрее) или email
3. Подтвердите email

### 1.2. Создание кластера

1. Нажмите **"Create"** (Создать)
2. Выберите **"Shared"** (бесплатный M0)
3. Провайдер: **AWS** (рекомендуется)
4. Регион: ближайший к вам (например, Frankfurt для Европы)
5. Кластер Name: `open-lance` (или любое имя)
6. Нажмите **"Create Cluster"**
7. Подождите 3-5 минут

### 1.3. Создание пользователя БД

1. Слева: **"Database Access"**
2. **"Add New Database User"**
3. **Username**: `open-lance-admin` (или другое)
4. **Password**: Придумайте надежный пароль
   - ⚠️ **ЗАПИШИТЕ ПАРОЛЬ!** MongoDB не покажет его снова
   - Пример: `MySecure123!@#`
5. **Privileges**: "Read and write to any database"
6. **"Add User"**

💡 **Забыли пароль?**
1. Database Access → найдите пользователя
2. **Edit** → **Edit Password**
3. Введите новый пароль → **Update User**

### 1.4. Настройка сети

1. Слева: **"Network Access"**
2. **"Add IP Address"**
3. **"Allow Access from Anywhere"** (`0.0.0.0/0`)
4. **"Confirm"**

⚠️ Это нужно для Cloudflare Workers (разные IP адреса)

### 1.5. Получение Connection URI

1. Слева: **"Database"**
2. Найдите кластер → **"Connect"**
3. **"Connect your application"**
4. **Driver**: Node.js, **Version**: 6.0 or later
5. Скопируйте строку:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**ЗАМЕНИТЕ:**
- `<username>` → ваш username (например: `open-lance-admin`)
- `<password>` → ваш пароль (из шага 1.3)
- **Удалите** скобки `<` и `>`

**Пример правильной строки:**
```
mongodb+srv://open-lance-admin:MySecure123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

💾 **Сохраните эту строку** - она понадобится для деплоя!

### 1.6. Автоматическая настройка БД (опционально)

Создайте коллекции и индексы автоматически:

```bash
cd backend
npm install
node ../scripts/setup-mongodb.js
```

Введите ваш MongoDB Connection URI и имя БД (`open-lance`)

Скрипт создаст:
- ✅ Коллекции: `users`, `tasks`, `applications`
- ✅ Индексы для быстрого поиска
- ✅ (Опционально) Тестовые данные

---

## ☁️ Шаг 2: Cloudflare

### 2.1. Регистрация

1. Откройте [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Введите email и пароль (или через Google)
3. Подтвердите email

### 2.2. Регистрация Workers.dev Subdomain

⚠️ **ОБЯЗАТЕЛЬНЫЙ ШАГ** перед деплоем!

1. Войдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Откройте **Workers & Pages**
3. Если это ваш первый Worker, вас попросят зарегистрировать subdomain
4. Придумайте уникальное имя (например: `myapp`)
5. Нажмите **"Register"**

Ваши Workers будут доступны по адресу:
```
worker-name.myapp.workers.dev
```

### 2.3. Установка Wrangler CLI

```bash
npm install -g wrangler
```

Проверка:
```bash
wrangler --version
```

### 2.4. Аутентификация

```bash
wrangler login
```

Откроется браузер → нажмите **"Allow"**

Проверка:
```bash
wrangler whoami
```

Должен показать ваш email и Account ID.

---

## 📦 Шаг 3: Установка зависимостей

Перейдите в папку проекта:

```bash
cd d:\MEGAsync\06_All\14_JS\App_13_open-lance
```

Установите backend зависимости:

```bash
cd backend
npm install
cd ..
```

---

## 🚀 Шаг 4: Деплой backend

### 4.1. Автоматический деплой (рекомендуется)

**Windows (PowerShell):**
```powershell
.\scripts\deploy.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Скрипт спросит:
1. **MongoDB Connection URI** - вставьте строку из Шага 1.5
2. **MongoDB Database Name** - введите `open-lance` (или другое)
3. **Frontend URL** - введите `*` (для разработки) или URL GitHub Pages

Скрипт выполнит:
- ✅ Проверку зависимостей
- ✅ Проверку аутентификации Cloudflare
- ✅ Установку секретов (MONGODB_URI, JWT_SECRET, ALLOWED_ORIGIN)
- ✅ Деплой Worker на Cloudflare
- ✅ Обновление `docs/js/config.js` с URL Worker
- ✅ Тестирование API

**Примерное время:** 5-7 минут

### 4.2. Ручной деплой

Если автоматический скрипт не работает:

```bash
cd backend

# Установите секреты
echo "ваш-mongodb-uri" | wrangler secret put MONGODB_URI
echo "ваш-jwt-secret" | wrangler secret put JWT_SECRET
echo "*" | wrangler secret put ALLOWED_ORIGIN

# Деплой
wrangler deploy
```

Генерация JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4.3. Проверка деплоя

После деплоя вы получите URL Worker:
```
https://open-lance-backend.your-subdomain.workers.dev
```

Тест health endpoint:
```bash
curl https://open-lance-backend.your-subdomain.workers.dev/health
```

Ожидаемый ответ:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-05T..."
}
```

---

## 🎨 Шаг 5: Настройка frontend

### 5.1. Обновление конфигурации

Откройте `docs/js/config.js` и проверьте URL:

```javascript
const config = {
    baseURL: 'https://open-lance-backend.your-subdomain.workers.dev'
};
```

Замените на ваш реальный Worker URL.

### 5.2. Локальное тестирование

Запустите локальный веб-сервер:

```bash
cd docs
python -m http.server 8000
```

Откройте в браузере:
```
http://localhost:8000
```

Проверьте:
- ✅ Регистрация работает
- ✅ Логин работает
- ✅ Создание задач работает
- ✅ Просмотр задач работает

---

## 🌐 Шаг 6: GitHub Pages

### 6.1. Загрузка на GitHub

Если еще не загрузили проект на GitHub:

```bash
# Инициализация Git (если еще не сделали)
git init

# Добавление файлов
git add .

# Первый коммит
git commit -m "Initial commit: Open-Lance v3.2.3"

# Привязка к GitHub (создайте репозиторий на github.com)
git remote add origin https://github.com/ваш-username/open-lance.git

# Загрузка
git branch -M main
git push -u origin main
```

### 6.2. Включение GitHub Pages

1. Откройте репозиторий на GitHub
2. **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main` → папка `/docs`
5. **Save**

Подождите 1-2 минуты.

### 6.3. Получение URL

Ваш frontend будет доступен по адресу:
```
https://ваш-username.github.io/open-lance/
```

### 6.4. Обновление CORS

Вернитесь к backend и обновите ALLOWED_ORIGIN:

```bash
cd backend
echo "https://ваш-username.github.io" | wrangler secret put ALLOWED_ORIGIN
```

Или укажите точный URL в скрипте деплоя и запустите его снова.

---

## 🧪 Тестирование

### Тест 1: Регистрация

1. Откройте ваш frontend (`https://ваш-username.github.io/open-lance/`)
2. Нажмите **"Войти"**
3. Перейдите на вкладку **"Регистрация"**
4. Введите email и пароль
5. Нажмите **"Зарегистрироваться"**

Должно появиться уведомление об успешной регистрации.

### Тест 2: Логин

1. Введите email и пароль
2. Нажмите **"Войти"**

После входа должна появиться панель навигации с кнопками:
- Все задачи
- Мои задачи
- Создать задачу

### Тест 3: Создание задачи

1. Нажмите **"Создать задачу"**
2. Заполните форму
3. Нажмите **"Создать"**

Задача должна появиться в списке.

### Тест 4: Просмотр задач

1. Нажмите **"Мои задачи"**
2. Должны увидеть созданную задачу

---

## 🆘 Решение проблем

### Проблема: "Not authenticated with Cloudflare"

**Решение:**
```bash
wrangler login
```

Если не работает:
```bash
wrangler logout
wrangler login
```

### Проблема: "authentication failed" (MongoDB)

**Причина:** Неверный пароль в MongoDB URI

**Решение:**
1. MongoDB Atlas → **Database Access**
2. Найдите пользователя → **Edit** → **Edit Password**
3. Введите новый пароль → **Update User**
4. Обновите MongoDB URI с новым паролем
5. Перезапустите деплой

### Проблема: "IP not whitelisted" (MongoDB)

**Решение:**
1. MongoDB Atlas → **Network Access**
2. **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
3. Подождите 2 минуты

### Проблема: "workers.dev subdomain not registered"

**Решение:**
1. Откройте Cloudflare Dashboard
2. **Workers & Pages**
3. Зарегистрируйте subdomain
4. Повторите деплой

### Проблема: Worker деплоится, но 500 Internal Server Error

**Причина:** Секреты не установлены или MongoDB недоступна

**Проверка секретов:**
```bash
cd backend
wrangler secret list
```

Должно быть:
- `MONGODB_URI`
- `JWT_SECRET`
- `ALLOWED_ORIGIN`

**Проверка логов:**
```bash
wrangler tail
```

### Проблема: Frontend не может подключиться к backend

**Причины:**
1. Неверный URL в `docs/js/config.js`
2. CORS блокирует запросы

**Решение:**
1. Проверьте URL Worker в `config.js`
2. Обновите `ALLOWED_ORIGIN`:
```bash
echo "https://ваш-username.github.io" | wrangler secret put ALLOWED_ORIGIN
```

### Проблема: "Мои задачи" загружаются 10 секунд

**Причина:** Cold start (первый запрос после простоя)

**Нормально!** Это особенность serverless free tier.

**Оптимизации уже внедрены:**
- ✅ Frontend кэширование (мгновенная загрузка при повторном визите)
- ✅ Loading indicator (пользователь видит что идёт загрузка)
- ✅ Background refresh (данные обновляются в фоне)

Второй и последующие визиты: ~1 секунда или мгновенно (из кэша)

### Проблема: Toast уведомления не видны

**Решение:** Обновлено в последней версии.

Если проблема осталась:
```bash
git pull origin main
```

### Проблема: "Failed to publish" при деплое

**Причины:**
1. Нет интернета
2. Cloudflare временно недоступен
3. Превышен лимит Workers (100 на free tier)

**Решение:**
```bash
# Проверка подключения
curl https://api.cloudflare.com/

# Попробуйте снова
cd backend
wrangler deploy
```

---

## 📊 Мониторинг

### Cloudflare Dashboard

1. [dash.cloudflare.com](https://dash.cloudflare.com/)
2. **Workers & Pages** → ваш Worker
3. Вкладки:
   - **Metrics**: Графики запросов, ошибок, CPU
   - **Logs**: Логи в реальном времени
   - **Settings**: Переменные, домены

### Real-time логи

```bash
cd backend
wrangler tail --format pretty
```

### MongoDB Atlas метрики

1. [cloud.mongodb.com](https://cloud.mongodb.com/)
2. **Database** → ваш кластер → **Metrics**
3. Смотрите:
   - Operations per second
   - Connections
   - Storage usage

---

## 🔧 Обновление после изменений

### Обновление backend

```bash
cd backend
wrangler deploy
```

### Обновление frontend

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

GitHub Pages обновится автоматически через 1-2 минуты.

---

## 💰 Лимиты Free Tier

### Cloudflare Workers

| Ресурс | Free | Достаточно для |
|--------|------|----------------|
| Запросы | 100,000/день | ~3M/месяц |
| CPU Time | 10ms/запрос | Большинства задач |
| Workers | 100 | Много проектов |

### MongoDB Atlas M0

| Ресурс | Free | Достаточно для |
|--------|------|----------------|
| Storage | 512 MB | ~10,000 пользователей |
| RAM | Shared | Легкая нагрузка |
| Backups | Нет | Ручной mongodump |

**Для production рекомендуется:**
- MongoDB Atlas M2/M5 (~$9-25/месяц) - автоматические бэкапы
- Cloudflare Workers Unbound (~$5/10M запросов) - больше CPU time

Но **free tier достаточен** для MVP и малых проектов!

---

## ✅ Чеклист успешного деплоя

- [ ] MongoDB Atlas кластер создан
- [ ] Database User создан, пароль сохранен
- [ ] Network Access настроен (0.0.0.0/0)
- [ ] Cloudflare аккаунт создан
- [ ] Workers.dev subdomain зарегистрирован
- [ ] Wrangler CLI установлен и авторизован
- [ ] Backend задеплоен успешно
- [ ] Секреты установлены (MONGODB_URI, JWT_SECRET, ALLOWED_ORIGIN)
- [ ] Worker отвечает на `/health`
- [ ] Frontend `config.js` обновлен с Worker URL
- [ ] Проект загружен на GitHub
- [ ] GitHub Pages включен (/docs)
- [ ] Frontend доступен по https://username.github.io/open-lance/
- [ ] Регистрация работает
- [ ] Логин работает
- [ ] Создание задач работает
- [ ] Просмотр задач работает

**Если все пункты выполнены - поздравляем! 🎉**

**Ваша платформа работает глобально на edge-сети Cloudflare!** 🚀

---

## 📞 Поддержка

- **Issues**: [GitHub Issues](https://github.com/your-username/open-lance/issues)
- **Cloudflare Docs**: [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers/)
- **MongoDB Docs**: [docs.mongodb.com](https://docs.mongodb.com/)

---

**Успешного деплоя! 🚀**
