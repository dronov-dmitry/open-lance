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

### 1.3. Настройка MongoDB Data API (опционально)

> [!WARNING]  
> **MongoDB Data API официально устарел (deprecated)** и постепенно отключается. В новых аккаунтах (созданных в 2024-2025 году) этот раздел **полностью скрыт и недоступен** (по ссылке выдает ошибку 404). 
> 
> Если вы не можете найти раздел "Data API" — **это нормально! Просто пропустите этот шаг целиком и переходите сразу к Шагу 1.4 (создание пользователя) и Шагу 1.6 (получение обычной строки подключения).** В скрипте развертывания `deploy.ps1` вам нужно будет просто выбрать **Вариант 1 (Direct Connection)**.

⚠️ **ВАЖНО**: MongoDB Data API позволял Cloudflare Worker работать с базой данных без прямого подключения через TCP (работает только для старых аккаунтов).

**Пошаговая инструкция (только если у вас старый аккаунт и раздел доступен):**

1. В MongoDB Atlas зайдите в раздел **"Data API"** (в разделе **Services** в левом меню). Прямая ссылка: [cloud.mongodb.com](https://cloud.mongodb.com/) (после входа выберите свой проект и найдите "Data API").
2. Нажмите **"Enable Data API"** (Включить Data API)
3. Создайте **API Key**:
   - Перейдите на вкладку управления ключами. Прямая ссылка: 👉 **[cloud.mongodb.com/v2#/data-api/keys](https://cloud.mongodb.com/v2#/data-api/keys)** (если попросит, выберите ваш проект `Project 0` или `open-lance`).
   - На этой странице нажмите зеленую кнопку **"Create API Key"** (обычно находится справа вверху над списком ключей).
   - Всплывет окно. Введите имя ключа (любое, например: `open-lance-api-key`).
   - В выпадающем списке ниже выберите права доступа: **Read and Write**.
   - Нажмите зеленую кнопку **"Create"** внизу окна.
   - **Копирование ключа**: На экране появится длинный пароль (Data API Key). **ОБЯЗАТЕЛЬНО СКОПИРУЙТЕ ЕГО СРАЗУ**, нажав на иконку копирования рядом с ним (он больше не будет показан полностью!). Это и есть ваш `MONGODB_API_KEY`.
4. Скопируйте **URL Endpoint**:
   - После включения Data API вы увидите **URL Endpoint**
   - Он выглядит примерно так: `https://data.mongodb-api.com/app/xxxxx/endpoint/data/v1`
   - Скопируйте этот URL полностью

**Эти данные понадобятся в скрипте развертывания:**
- **Где взять `MONGO_API_KEY` (MongoDB Data API Key)**: Этот ключ (например, длинная строка `XyZ123...`) вы получаете **только один раз**, сразу после нажатия кнопки "Create" при создании ключа в пункте 3 выше. Обязательно сохраните его в надежном месте. Если не сохранили — удалите старый ключ в панели и создайте новый.
- **Где взять `MONGO_URL` (URL Endpoint)**: Этот URL находится в том же разделе **Data API** на карточке сверху. Выглядит как `https://data.mongodb-api.com/app/.../endpoint/data/v1`.

💡 **Забыли или потеряли API Key?**
Ключ нельзя посмотреть повторно из соображений безопасности. Если вы его потеряли, нужно создать новый:
2. Перейдите на вкладку **"API Keys"** (найдите ее рядом с "App Services" или внутри настроек Data API).
1. В MongoDB Atlas зайдите в раздел **"Data API"**. Прямая ссылка: [cloud.mongodb.com](https://cloud.mongodb.com/) (после входа выберите свой проект и найдите "Data API").
3. Найдите в списке ваш старый ключ и нажмите кнопку **Delete** (удалить) рядом с ним.
4. Нажмите **"Create API Key"**, чтобы создать новый ключ.
5. Задайте имя, права (Read and Write) и нажмите **"Create"**.
6. **ОБЯЗАТЕЛЬНО СКОПИРУЙТЕ НОВЫЙ КЛЮЧ!**

### 1.4. Создание пользователя БД

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

### 1.5. Настройка сети

1. Слева: **"Network Access"**
2. **"Add IP Address"**
3. **"Allow Access from Anywhere"** (`0.0.0.0/0`)
4. **"Confirm"**

⚠️ Это нужно для Cloudflare Workers (разные IP адреса)

### 1.6. Получение Connection URI

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

### 1.7. Автоматическая настройка БД (опционально)

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
1. **Метод подключения к MongoDB:**
   - **Вариант 1**: Прямое подключение (TCP) - вставьте Connection URI из Шага 1.6
   - **Вариант 2**: MongoDB Data API (рекомендуется для Cloudflare Workers) - вставьте URL Endpoint и API Key из Шага 1.3
2. **MongoDB Database Name** - введите `open-lance` (или другое)
3. **Frontend URL** - введите `*` (для разработки) или URL GitHub Pages

### 4.1.1. Настройка EmailJS для отправки email

Приложение использует **EmailJS** для отправки писем подтверждения email. EmailJS — это бесплатный сервис для отправки email без необходимости настройки SMTP сервера.

#### Шаг 1: Регистрация в EmailJS

1. Перейдите на [https://www.emailjs.com/](https://www.emailjs.com/)
2. Нажмите **"Sign Up"** и создайте бесплатный аккаунт
3. Подтвердите email адрес

#### Шаг 2: Настройка Email Service

1. В панели EmailJS перейдите в **"Email Services"**
2. Нажмите **"Add New Service"**
3. Выберите ваш email провайдер:
   - **Gmail** (рекомендуется для тестирования)
   - **Outlook**
   - **Yahoo**
   - Или другой поддерживаемый провайдер
4. Следуйте инструкциям для подключения вашего email аккаунта
5. После подключения найдите **Service ID**

**Service ID** — это идентификатор почтового ящика, который вы подключили к EmailJS (например, ваш Gmail или Яндекс). Он указывает сервису, через какой именно аккаунт нужно отправить письмо.

**Пошаговая инструкция по получению Service ID:**

1. Зайдите в свой аккаунт на [emailjs.com](https://www.emailjs.com/)
2. В левом боковом меню выберите самый первый пункт — **Email Services**
3. Там вы увидите карточку вашего подключенного почтового сервиса (например, с логотипом Gmail)
4. В этой карточке, прямо под названием (например, "Gmail"), будет строка **Service ID**. Она обычно выглядит как `service_xxxxxxx`
5. Нажмите на иконку **копирования** рядом с этим ID

#### Шаг 3: Создание Email Template

1. Перейдите в **"Email Templates"**
2. Нажмите **"Create New Template"**
3. Заполните форму:
   - **Template Name**: `Open-Lance Verification`
   - **Subject**: `Подтвердите email на Open-Lance`
   - **Content**: Используйте HTML шаблон из файла `emailjs_template.html` в корне проекта
4. В шаблоне используйте переменные:
   - `{{user_email}}` — email пользователя
   - `{{verification_link}}` — ссылка для подтверждения
   - `{{time}}` — время отправки
	 Либо используй шаблон `emailjs_template.html` из этой папки
5. Сохраните шаблон и найдите **Template ID**

**Template ID** — это уникальный идентификатор конкретного письма (шаблона), который вы создали. Он говорит сервису, какой именно дизайн и какие переменные (вроде `{{verification_link}}`) нужно использовать при отправке.

**Пошаговая инструкция по получению Template ID:**

1. Зайдите в свой аккаунт на [emailjs.com](https://www.emailjs.com/)
2. В левом боковом меню выберите раздел **Email Templates** (иконка с листом бумаги)
3. Там вы увидите список ваших шаблонов. Найдите тот, который мы создали для подтверждения почты
4. Прямо под названием шаблона (например, "My Default Template") вы увидите строку **ID**. Она обычно выглядит как `template_xxxxxxx`
5. Нажмите на иконку **копирования** рядом с этим ID

#### Шаг 4: Получение Public Key

Пошаговая инструкция:

1. Зайдите в свой личный кабинет на [emailjs.com](https://www.emailjs.com/)
2. В левом боковом меню нажмите на пункт **Account** (самая нижняя иконка или вкладка)
3. На открывшейся странице вы сразу увидите раздел **API Keys**
4. В поле **Public Key** будет строка из случайных символов (обычно начинается на `user_` или просто набор букв)
5. Нажмите на иконку **"Копировать"** рядом с ключом

#### Шаг 5: Настройка в приложении

Во время выполнения скрипта `deploy.ps1` вам будет предложено ввести:
- **EmailJS Public Key** — ваш Public Key из EmailJS
- **EmailJS Service ID** — ID вашего Email Service
- **EmailJS Template ID** — ID вашего Email Template

Эти значения будут сохранены как секреты в Cloudflare Workers.

#### Пример шаблона email

```html
<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2c3e50; line-height: 1.5; max-width: 500px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 25px;">
    <h2 style="margin: 0; color: #1a1a1a;">Подтвердите email на Open-Lance</h2>
  </div>
  
  <div style="background-color: #f8fbff; border: 2px dashed #d1e3ff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
    <p style="margin: 0 0 15px 0;">Нажмите на кнопку ниже для подтверждения:</p>
    <a href="{{verification_link}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
      Подтвердить Email
    </a>
    <p style="margin-top: 15px; font-size: 12px; color: #7f8c8d;">Или скопируйте ссылку:</p>
    <p style="font-size: 11px; color: #95a5a6; word-break: break-all;">{{verification_link}}</p>
  </div>
  
  <div style="font-size: 13px; color: #95a5a6; text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
    <div>Письмо отправлено для <strong>{{user_email}}</strong></div>
    <div style="margin-top: 5px;">Если вы не запрашивали это письмо, просто удалите его.</div>
    <div style="margin-top: 15px; font-size: 11px; color: #bdc3c7;">{{time}}</div>
  </div>
</div>
```

#### Лимиты EmailJS (Free Tier)

- ✅ **200 писем/месяц** — бесплатно
- ✅ **Не требует домена**
- ✅ **Работает сразу после настройки**
- ⚠️ Для production с большим количеством пользователей рассмотрите платный план

#### Fallback режим

Если EmailJS не настроен или произошла ошибка при отправке:
- Ссылка для подтверждения будет логироваться в Cloudflare Workers
- Администратор может скопировать ссылку из логов и отправить пользователю вручную

#### Проверка настройки EmailJS

Если письма не приходят, проверьте:

1. **Проверьте секреты в Cloudflare Workers:**
   ```bash
   wrangler secret list
   ```
   
   Должны быть установлены:
   - `EMAILJS_PUBLIC_KEY`
   - `EMAILJS_SERVICE_ID`
   - `EMAILJS_TEMPLATE_ID`

2. **Проверьте логи Cloudflare Workers:**
   - Откройте [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Перейдите в **Workers & Pages** → ваш worker
   - Откройте вкладку **"Logs"**
   - Найдите сообщения с префиксом `[Email]`
   - Проверьте, какие секреты отсутствуют (будут показаны как `❌ Missing`)

3. **Установите отсутствующие секреты:**
   ```bash
   cd backend
   echo "ваш-public-key" | wrangler secret put EMAILJS_PUBLIC_KEY
   echo "ваш-service-id" | wrangler secret put EMAILJS_SERVICE_ID
   echo "ваш-template-id" | wrangler secret put EMAILJS_TEMPLATE_ID
   ```

4. **Перезапустите Worker:**
   ```bash
   wrangler deploy
   ```

5. **Проверьте снова:**
   - Попробуйте зарегистрироваться или запросить повторную отправку
   - Проверьте логи Cloudflare Workers
   - Если все секреты установлены, должно быть сообщение `✅ All EmailJS secrets are configured`

### 4.1.2. Настройка Cloudflare Turnstile (капча при входе)

Приложение может показывать капчу Cloudflare Turnstile на странице входа, чтобы защититься от ботов. Для этого нужны **Site Key** (для фронтенда) и **Secret Key** (для бэкенда). Ниже — как получить **TURNSTILE_SECRET_KEY**.

#### Шаг 1: Вход в Cloudflare

1. Откройте [dash.cloudflare.com](https://dash.cloudflare.com/) и войдите в аккаунт.
2. В левом меню выберите **Turnstile** (или перейдите по [dash.cloudflare.com/?to=/:account/turnstile](https://dash.cloudflare.com/) и найдите Turnstile в меню).

#### Шаг 2: Создание виджета

1. На странице Turnstile нажмите **"Add site"** (или **"Create"**).
2. Заполните:
   - **Site name**: например, `Open-Lance` или `open-lance-login`.
   - **Domain**: укажите домен, где будет открываться сайт:
     - для разработки: `localhost`;
     - для GitHub Pages: `ваш-username.github.io`;
     - для своего домена: ваш домен (например, `example.com`).
   - Можно добавить несколько доменов по одному.
3. **Widget Mode**: оставьте **Managed** (рекомендуется) или выберите **Non-interactive** при необходимости.
4. Нажмите **"Create"**.

#### Шаг 3: Получение ключей

После создания виджета откроется страница с двумя ключами:

| Ключ | Где использовать | Описание |
|------|------------------|----------|
| **Site Key** | Фронтенд (`docs/js/config.js` → `TURNSTILE_SITE_KEY`) | Публичный, показывается в коде страницы. |
| **Secret Key** | Бэкенд (секрет `TURNSTILE_SECRET_KEY` в скрипте деплоя / Cloudflare) | Секретный, только на сервере. |

**Как скопировать Secret Key (это и есть TURNSTILE_SECRET_KEY):**

1. На странице виджета Turnstile найдите блок **"Secret Key"**.
2. Нажмите **"Reveal"** или иконку копирования рядом с ключом.
3. Скопируйте значение целиком (длинная строка символов).

#### Шаг 4: Куда подставить TURNSTILE_SECRET_KEY

- **При автоматическом деплое:** скрипт `deploy.ps1` спросит `TURNSTILE_SECRET_KEY`. Вставьте скопированный **Secret Key** (оставьте пустым, если капчу пока не используете).
- **При ручном деплое:** сохраните ключ в секретах Worker (см. раздел [4.2. Ручной деплой](#42-ручной-деплой)).

**Site Key** нужно прописать в конфиге фронтенда: откройте `docs/js/config.js` и задайте `TURNSTILE_SITE_KEY` (если в проекте используется отдельный конфиг для Turnstile) или укажите его в том месте, откуда фронтенд читает настройки виджета.

#### Отключение капчи

Если при запросе `TURNSTILE_SECRET_KEY` в скрипте деплоя оставить поле **пустым**, капча будет отключена и вход будет без Turnstile.

#### Где посмотреть ключи позже

1. [dash.cloudflare.com](https://dash.cloudflare.com/) → **Turnstile**.
2. Выберите нужный виджет (сайт).
3. **Site Key** и **Secret Key** отображаются на странице виджета (Secret Key может требовать нажатия **"Reveal"**).

Скрипт выполнит:
- ✅ Проверку зависимостей
- ✅ Проверку аутентификации Cloudflare
- ✅ Установку секретов (MONGODB_URI, JWT_SECRET, EMAILJS_*, TURNSTILE_SECRET_KEY при необходимости)
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
echo "ваш-mongodb-api-key" | wrangler secret put MONGODB_API_KEY  # Если используете Data API
echo "ваш-jwt-secret" | wrangler secret put JWT_SECRET
echo "ваш-emailjs-public-key" | wrangler secret put EMAILJS_PUBLIC_KEY
echo "ваш-emailjs-service-id" | wrangler secret put EMAILJS_SERVICE_ID
echo "ваш-emailjs-template-id" | wrangler secret put EMAILJS_TEMPLATE_ID
# Капча при входе (необязательно; пусто = капча отключена):
echo "ваш-turnstile-secret-key" | wrangler secret put TURNSTILE_SECRET_KEY

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
- (по желанию) `TURNSTILE_SECRET_KEY` — если включена капча при входе (см. [4.1.2](#412-настройка-cloudflare-turnstile-капча-при-входе))

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
- [ ] Секреты установлены (MONGODB_URI, JWT_SECRET, ALLOWED_ORIGIN; при необходимости TURNSTILE_SECRET_KEY)
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
