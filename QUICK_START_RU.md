# 🚀 Быстрый старт (на русском)

## Что нужно сделать для запуска проекта

### Шаг 1: Регистрация в MongoDB Atlas (обязательно вручную)

⚠️ **Этот шаг нельзя автоматизировать!** Нужно зарегистрироваться через браузер.

1. Откройте [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Зарегистрируйтесь (через Google/GitHub быстрее)
3. Создайте **бесплатный кластер** (M0 Free Tier - 512 MB)
4. Создайте пользователя базы данных
5. Настройте Network Access: разрешите `0.0.0.0/0`
6. Получите **Connection URI** (строку подключения)

📚 **Подробная инструкция:** [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) (есть раздел на русском в начале!)

**Примерное время:** 10 минут

---

**🔗 Как выглядит ссылка на ваш кластер?**

После создания кластера сохраните ссылку на него в закладки:

```
https://cloud.mongodb.com/v2/{project-id}#/clusters/detail/{cluster-name}
```

**Пример реальной ссылки:**
```
https://cloud.mongodb.com/v2/69a86ffbc1953660e2614267#/clusters/detail/open-lance
```

Эта ссылка ведет в панель управления вашим кластером, где можно:
- Получить Connection URI
- Смотреть метрики
- Управлять пользователями
- Просматривать данные

---

### Шаг 2: Автоматическая настройка базы данных (опционально, но рекомендуется)

После создания кластера запустите скрипт автоматической настройки:

```bash
cd backend
npm install
node ../scripts/setup-mongodb.js
```

Скрипт попросит:
- MongoDB Connection URI (из Шага 1)
- Имя базы данных (по умолчанию: `open-lance`)

**Что делает скрипт:**
- ✅ Проверяет подключение
- ✅ Создает коллекции (`users`, `tasks`, `applications`)
- ✅ Создает индексы для быстрой работы
- ✅ (Опционально) Добавляет тестовые данные

📚 **Подробная инструкция:** [scripts/SETUP_MONGODB_GUIDE.md](./scripts/SETUP_MONGODB_GUIDE.md)

**Примерное время:** 2 минуты

---

### Шаг 3: Регистрация в Cloudflare (бесплатно)

1. Откройте [Cloudflare](https://dash.cloudflare.com/sign-up)
2. Зарегистрируйтесь (email или Google)
3. Подтвердите email

**Примерное время:** 3 минуты

---

### Шаг 4: Установка зависимостей

```bash
# Вернитесь в корневую папку проекта
cd ..

# Установите Wrangler CLI (если еще не установлен)
npm install -g wrangler

# Или через backend/package.json
cd backend
npm install
```

---

### Шаг 5: Деплой проекта

**Linux/Mac:**
```bash
./scripts/deploy.sh
```

**Windows:**
```powershell
.\scripts\deploy.ps1
```

Скрипт попросит:
1. **Аутентификацию Cloudflare** - откроется браузер, войдите в аккаунт
2. **MongoDB Connection URI** - ту же строку из Шага 1
3. **Имя базы данных** - по умолчанию `open-lance`
4. **Frontend URL** - можно оставить `*` (любой домен)

**Что делает скрипт:**
- ✅ Проверяет все зависимости
- ✅ Логинит в Cloudflare
- ✅ Деплоит backend на Cloudflare Workers
- ✅ Настраивает secrets (MongoDB URI, JWT secret)
- ✅ Генерирует конфиг для frontend
- ✅ Тестирует API
- ✅ Показывает URL вашего API

**Примерное время:** 5-7 минут

---

### Шаг 6: Тестирование

После деплоя вы получите Worker URL, например:
```
https://open-lance-backend-dev.your-subdomain.workers.dev
```

**Тест 1: Регистрация пользователя**

**Linux/Mac/Git Bash:**
```bash
curl -X POST https://your-worker-url.workers.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri "https://your-worker-url.workers.dev/auth/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test@example.com","password":"Test123!"}'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "message": "Registration successful. Please login.",
  "user_id": "..."
}
```

**Тест 2: Логин**

```bash
curl -X POST https://your-worker-url.workers.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**Ожидаемый ответ:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "...",
    "email": "test@example.com",
    ...
  }
}
```

---

### Шаг 7: Настройка Frontend

После успешного деплоя backend:

1. Откройте `frontend/js/config.js`
2. Проверьте что там правильный `baseURL` (URL вашего Worker)
3. Откройте `frontend/index.html` в браузере
4. Или запустите локальный сервер:

```bash
cd frontend
python -m http.server 8080
# Откройте http://localhost:8080
```

---

## 🎯 Итого

**Общее время на запуск:** ~20-25 минут

**Что создали:**
- ✅ MongoDB Atlas кластер (бесплатный)
- ✅ Cloudflare Worker (глобально, edge)
- ✅ Рабочий API с аутентификацией
- ✅ Frontend готов к работе

---

## 🆘 Проблемы?

### Ошибка: "authentication failed"

**Проблема:** Неверный username/password в MongoDB URI

**❓ Где взять пароль `<db_password>`?**

`<db_password>` - это пароль который **ВЫ сами придумали** при создании Database User!

Это **НЕ** пароль от MongoDB Atlas аккаунта!

**✅ Решение - сброс пароля:**

1. [MongoDB Atlas](https://cloud.mongodb.com/) → **Database Access**
2. Найдите вашего пользователя
3. Нажмите **Edit** → **Edit Password**
4. Введите **НОВЫЙ пароль** (например: `MyNewPass123!`)
5. **ЗАПИШИТЕ** его!
6. Нажмите **Update User**
7. Подождите 1-2 минуты

**Используйте новый пароль:**

❌ **НЕПРАВИЛЬНО:**
```
mongodb+srv://user:<db_password>@cluster.net/
```

✅ **ПРАВИЛЬНО:**
```
mongodb+srv://user:MyNewPass123!@cluster.net/
```

⚠️ Удалите скобки `<>` и замените на реальный пароль!

---

### Ошибка: "ENOTFOUND" или "ETIMEDOUT"

**Проблема:** MongoDB Atlas блокирует подключение

**Решение:** 
1. MongoDB Atlas → Network Access
2. Добавьте IP `0.0.0.0/0` (разрешить все)
3. Подождите 2 минуты

---

### Ошибка: "Not authenticated with Cloudflare"

**Проблема:** Не залогинились в Cloudflare

**Решение:**
```bash
wrangler login
```
Откроется браузер, войдите в аккаунт

---

### Worker деплоится, но не работает

**Проблема:** Не установлены secrets

**Решение:**
```bash
cd backend

# MongoDB URI
echo "YOUR_MONGODB_URI" | wrangler secret put MONGODB_URI

# JWT Secret
echo "YOUR_JWT_SECRET" | wrangler secret put JWT_SECRET
```

---

## 📚 Дополнительная документация

- [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) - Подробно про MongoDB Atlas
- [scripts/SETUP_MONGODB_GUIDE.md](./scripts/SETUP_MONGODB_GUIDE.md) - Про setup скрипт
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Полная инструкция по деплою
- [README.md](./README.md) - Общая информация о проекте

---

## 💡 Полезные команды

```bash
# Проверить статус Worker
wrangler tail

# Локальная разработка Worker
cd backend
wrangler dev

# Удалить Worker
wrangler delete open-lance-backend-dev

# Полная очистка
./scripts/cleanup.sh  # Linux/Mac
.\scripts\cleanup.ps1  # Windows

# Просмотр логов
wrangler tail open-lance-backend-dev

# Список ваших Workers
wrangler list
```

---

**Удачи! 🚀**

Если что-то не работает - создайте Issue на GitHub или напишите в Discussions.
