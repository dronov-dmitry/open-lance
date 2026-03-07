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
4. **Resend API Key** - Введите ключ API от сервиса Resend (опционально, для отправки реальных писем)
5. **Sender Email** - Введите email отправителя (если указан API ключ)

### 4.1.1. Настройка Resend для отправки писем

> 💡 **Нет домена?** Если вы используете GitHub Pages без собственного домена, см. [Вариант 3](#вариант-3-без-собственного-домена-github-pages) ниже.

#### Вариант 1: Для тестирования (полностью бесплатно, без домена)

✅ **Resend полностью бесплатен** для тестирования без верификации домена!

1. Получите API ключ:
   - Откройте [resend.com/api-keys](https://resend.com/api-keys)
   - Нажмите **"Create API Key"**
   - Выберите **"Full Access"** (или "Sending Access")
   - Скопируйте ключ (начинается с `re_`)

2. Используйте тестовый email отправителя:
   - **Sender Email**: `onboarding@resend.dev`
   - Не требует настройки домена
   - Работает сразу после получения API ключа

3. Куда можно отправлять (бесплатно, без домена):
   - ✅ На **ваш email** (который зарегистрирован в Resend аккаунте)
   - ✅ На **тестовые адреса Resend** для проверки различных сценариев:
     - `delivered@resend.dev` — успешная доставка (для тестирования регистрации)
     - `bounced@resend.dev` — отскок письма
     - `complained@resend.dev` — письмо отмечено как спам
     - `suppressed@resend.dev` — письмо подавлено
   - ✅ Поддержка меток: `delivered+user1@resend.dev`, `delivered+user2@resend.dev` и т.д.
   - 💡 **Совет**: Используйте `delivered@resend.dev` для тестирования регистрации - письма будут доставляться успешно!

4. Пример использования для тестирования:
   - Зарегистрируйте пользователя с email `delivered@resend.dev`
   - Письмо для подтверждения будет успешно доставлено
   - Вы сможете протестировать весь процесс регистрации и подтверждения email

⚠️ **Ограничение**: На реальные email адреса других пользователей (не ваш и не тестовые @resend.dev) отправлять **нельзя** без верификации домена.

💡 **Для production с реальными пользователями**: см. [Вариант 2](#вариант-2-для-production-свой-домен) или [Вариант 3.4](#вариант-34-полностью-бесплатное-решение-без-email-сервиса) ниже.

#### Вариант 2: Для production (свой домен)

1. Получите API ключ (как в варианте 1)

2. Добавьте и верифицируйте домен:
   - Откройте [resend.com/domains](https://resend.com/domains)
   - Нажмите **"Add Domain"**
   - Введите ваш домен (например: `example.com`)
   - Нажмите **"Add"**

3. Добавьте DNS записи:
   - Resend покажет DNS записи (DKIM, SPF)
   - Добавьте их в настройки DNS вашего домена
   - Обычно это:
     - **TXT запись** для DKIM
     - **TXT запись** для SPF
   - Подождите 5-10 минут для верификации

4. Проверьте статус:
   - В Resend Dashboard статус должен быть **"Verified"** (зеленая галочка)
   - Только после этого можно использовать email с вашего домена

5. Используйте ваш email:
   - **Sender Email**: `noreply@yourdomain.com` (или любой другой)
   - Убедитесь, что домен верифицирован перед использованием

#### Вариант 3: Без собственного домена (GitHub Pages)

Если вы публикуете сайт на GitHub Pages и у вас нет собственного домена, у вас есть несколько вариантов:

**Вариант 3.1: Использовать только для тестирования (рекомендуется для начала)**

Это самый простой вариант для начала работы:

1. Используйте `onboarding@resend.dev` (как в Варианте 1)
2. ⚠️ **Ограничение**: письма будут отправляться только на email владельца Resend аккаунта
3. Для тестирования регистрации используйте email, который зарегистрирован в вашем Resend аккаунте
4. Ссылки для подтверждения также будут доступны в логах Cloudflare Workers (даже если email не отправлен)
5. Это позволяет протестировать весь функционал без покупки домена

💡 **Как получить ссылку из логов:**
- Откройте Cloudflare Dashboard → Workers & Pages → ваш worker
- Перейдите на вкладку "Logs"
- Найдите сообщение `=== УВЕДОМЛЕНИЕ (Fallback) ===`
- Скопируйте ссылку для подтверждения из логов

**Вариант 3.2: Получить домен для production**

⚠️ **Важно**: Бесплатные домены часто недоступны или ненадежны. Для production рекомендуется купить дешевый домен.

1. **Купить дешевый домен** (рекомендуется для production):
   - **Namecheap**: часто есть промо-акции от $0.99/год для `.xyz`, `.site`, `.online`
   - **GoDaddy**: промо-акции от $0.99/год
   - **Cloudflare Registrar**: домены по себестоимости (без наценки)
   - После покупки добавьте DNS записи от Resend и верифицируйте домен

2. **Cloudflare Pages** (альтернатива GitHub Pages):
   - Используйте Cloudflare Pages вместо GitHub Pages
   - Cloudflare предоставляет бесплатный домен `*.pages.dev`
   - ⚠️ **Но**: поддомены `*.pages.dev` нельзя верифицировать в Resend (управляются Cloudflare)
   - Решение: подключите купленный домен к Cloudflare Pages и верифицируйте его в Resend

3. **Бесплатные поддомены** (не подходят для email):
   - [No-IP](https://www.noip.com/) - бесплатные поддомены
   - [DuckDNS](https://www.duckdns.org/) - бесплатные поддомены
   - ⚠️ **Проблема**: большинство бесплатных поддоменов не позволяют добавлять DNS записи для верификации email

**Вариант 3.3: Использовать альтернативные сервисы отправки email**

Если Resend не подходит из-за ограничений домена, можно использовать другие сервисы:
- **SendGrid** - бесплатный тариф: 100 писем/день, требует верификации домена
- **Mailgun** - бесплатный тариф: 5000 писем/месяц, требует верификации домена
- **Amazon SES** - очень дешево, но требует верификации домена

⚠️ **Все эти сервисы требуют верификации домена для отправки на реальные адреса.**

**Вариант 3.4: Полностью бесплатное решение без email сервиса** ✅

Если вам принципиально нужен **полностью бесплатный** вариант без покупки домена и без ограничений:

1. **Не настраивайте Resend API ключ** (или оставьте пустым)
2. Приложение автоматически переключится в режим **симуляции отправки email**
3. Все ссылки для подтверждения будут **логироваться в Cloudflare Workers**
4. Пользователи могут получить ссылку для подтверждения из логов

**Как это работает:**
- При регистрации/повторной отправке письма ссылка для подтверждения сохраняется в базе данных
- Ссылка также выводится в логи Cloudflare Workers
- Пользователь видит сообщение: "Письмо отправлено. Проверьте почту."
- Администратор может скопировать ссылку из логов и отправить пользователю вручную (через Telegram, Discord и т.д.)

**Как получить ссылку из логов:**
1. Откройте [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Перейдите в **Workers & Pages** → ваш worker
3. Откройте вкладку **"Logs"**
4. Найдите сообщение `=== УВЕДОМЛЕНИЕ ===` или `=== УВЕДОМЛЕНИЕ (Fallback) ===`
5. Скопируйте ссылку для подтверждения из логов
6. Отправьте ссылку пользователю вручную

**Преимущества:**
- ✅ Полностью бесплатно
- ✅ Нет ограничений на количество писем
- ✅ Работает без домена
- ✅ Работает без настройки email сервиса

**Недостатки:**
- ⚠️ Нужно вручную копировать ссылки из логов
- ⚠️ Не подходит для большого количества пользователей
- ⚠️ Менее удобно для пользователей

💡 **Рекомендация**: Используйте этот вариант для тестирования или для небольших проектов. Для production лучше использовать Resend с тестовыми адресами или купить дешевый домен.

⚠️ **Важно:**
- Если домен не верифицирован, будет ошибка 403
- `onboarding@resend.dev` может отправлять **ТОЛЬКО на email владельца Resend аккаунта**
- Для отправки на любые email адреса **обязательно** нужен верифицированный домен
- GitHub Pages поддомены (`username.github.io`) **нельзя** верифицировать в Resend (управляются GitHub)
- Проверьте права API ключа: должен быть "Full Access" или "Sending Access"

**Рекомендация для GitHub Pages (полностью бесплатно):**

1. **Для тестирования** (рекомендуется):
   - Используйте `onboarding@resend.dev` (см. [Вариант 1](#вариант-1-для-тестирования-полностью-бесплатно-без-домена))
   - Тестируйте на свой email или тестовые адреса `*@resend.dev`
   - Это полностью бесплатно и работает сразу

2. **Для production без домена** (полностью бесплатно):
   - Используйте [Вариант 3.4](#вариант-34-полностью-бесплатное-решение-без-email-сервиса) - ссылки из логов
   - Или используйте тестовые адреса Resend для разработки

3. **Для production с реальными пользователями**:
   - Купите дешевый домен (от $0.99/год) и верифицируйте его в Resend
   - Или перейдите на Cloudflare Pages и подключите купленный домен
- Если видите ошибку "Testing domain restriction", это означает, что вы пытаетесь отправить на email, который не является владельцем аккаунта Resend

Скрипт выполнит:
- ✅ Проверку зависимостей
- ✅ Проверку аутентификации Cloudflare
- ✅ Установку секретов (MONGODB_URI, JWT_SECRET, RESEND_API_KEY, SENDER_EMAIL)
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
echo "re_ваш-ключ" | wrangler secret put RESEND_API_KEY
echo "onboarding@resend.dev" | wrangler secret put SENDER_EMAIL

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

Если вы внесли изменения в файлы бекенда (например, перевели текст ошибок в `src/handlers/auth.js` на русский), вам нужно заново отправить код на сервер:

```bash
cd backend
wrangler deploy
```
*(Секреты вроде MONGODB_URI заново указывать не нужно, они сохраняются на сервере)*

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
