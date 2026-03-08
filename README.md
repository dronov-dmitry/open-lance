# Open-Lance - Облачная Фриланс Платформа

> Serverless платформа для фриланса на Cloudflare Workers и MongoDB Atlas

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020)](https://workers.cloudflare.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)](https://www.mongodb.com/atlas)

## 🌐 Тестовая страница

**Живая демо-версия доступна по адресу:**  
👉 **[https://dronov-dmitry.github.io/open-lance](https://dronov-dmitry.github.io/open-lance)**
**Видео описание**
👉 **[https://youtu.be/lEO2ZJ0XY9Y](https://youtu.be/lEO2ZJ0XY9Y)**

Вы можете протестировать все функции платформы прямо сейчас!
Все облачные сервисы, которые использует приложение бесплатны!

## 🎯 О проекте

Open-Lance - это современная облачная платформа для фриланса, где каждый пользователь может быть одновременно заказчиком и исполнителем.

### Основные возможности

- 👤 **Единый профиль**: Работайте как заказчик и исполнитель одновременно
- 📝 **Управление задачами**: Создавайте, просматривайте и откликайтесь на задачи
- 🤝 **Система откликов**: Заказчики выбирают исполнителей из откликов
- ⭐ **Рейтинги**: Взаимные отзывы для построения репутации
- 🔒 **Безопасность**: JWT аутентификация, защищенный API
- ⚡ **Edge Computing**: Глобальное развертывание на Cloudflare (200+ локаций)

## 🏗️ Архитектура

```
Frontend (GitHub Pages)
        ↓ HTTPS
   Cloudflare Workers (Edge)
   (JWT Auth + API Routes)
      ↙   ↘
EmailJS     MongoDB Atlas
(Emails)    (Cloud Database)
```

**Компоненты:**
- **Frontend**: Статический SPA на GitHub Pages
- **Backend**: Cloudflare Workers (serverless, глобальный)
- **Database**: MongoDB Atlas (управляемая облачная БД)
- **Auth**: JWT токены
- **Deployment**: Автоматические скрипты

## 🛠️ Технологии

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- SPA роутер, JWT аутентификация
- GitHub Pages хостинг

### Backend
- Node.js (V8 engine)
- Cloudflare Workers (Edge)
- MongoDB Atlas
- JWT токены
- RESTful API

### Infrastructure
- Cloudflare Edge Network (200+ локаций)
- MongoDB Atlas (managed service)
- Wrangler CLI для деплоя

## 🚀 Быстрый старт

### Требования

- Node.js >= 18.x
- MongoDB Atlas аккаунт (бесплатный tier)
- Cloudflare аккаунт (бесплатный tier)
- Wrangler CLI: `npm install -g wrangler`

### Автоматический деплой

**Windows:**
```powershell
.\scripts\deploy.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Скрипт выполнит:
- ✅ Проверку зависимостей
- ✅ Аутентификацию Cloudflare
- ✅ Деплой backend на Cloudflare Workers
- ✅ Настройку секретов
- ✅ Тестирование API

**Время развертывания: ~10 минут**

### Полная инструкция

См. [DEPLOYMENT.md](./DEPLOYMENT.md) для подробной инструкции по развертыванию.

## 📁 Структура проекта

```
open-lance/
├── docs/                     # Frontend (GitHub Pages)
│   ├── index.html           # Главная страница
│   ├── css/style.css        # Стили
│   └── js/
│       ├── config.js        # Конфигурация API
│       ├── api.js           # API клиент
│       ├── auth.js          # Аутентификация
│       ├── router.js        # SPA роутер
│       ├── app.js           # Основная логика
│       └── createTask.js    # Создание задач
│
├── backend/                  # Cloudflare Workers
│   ├── src/
│   │   ├── index.js         # Главный Worker
│   │   ├── handlers/        # API обработчики
│   │   └── utils/           # Утилиты
│   ├── wrangler.toml        # Конфигурация Worker
│   └── package.json
│
├── scripts/
│   ├── deploy.ps1           # Деплой (Windows)
│   ├── deploy.sh            # Деплой (Linux/Mac)
│   └── setup-mongodb.js     # Настройка MongoDB
│
├── README.md                # Описание проекта
└── DEPLOYMENT.md            # Инструкция по развертыванию
```

## 🔒 Безопасность

- ✅ JWT аутентификация
- ✅ Валидация всех входных данных
- ✅ CORS политики
- ✅ MongoDB Atlas шифрование
- ✅ HTTPS для всех запросов
- ✅ Rate limiting через Cloudflare
- ✅ Edge security и DDoS защита

## 💰 Стоимость

**Free tier достаточно для большинства проектов:**

| Сервис | Free Plan | Хватит на |
|--------|-----------|-----------|
| **Cloudflare Workers** | 100,000 запросов/день | ~3M запросов/месяц |
| **MongoDB Atlas** | 512 MB | ~10,000 пользователей |
| **GitHub Pages** | Неограниченно | Любой трафик |

**Итого: $0/месяц** для малых и средних проектов

## ⚡ Производительность

- **Cold start** (первый запрос): ~10 секунд
- **Warm request** (повторный): 0.5-1 секунда
- **Frontend кэш**: Мгновенная загрузка (0ms)
- **Global edge**: Низкая задержка по всему миру

**Оптимизации:**
- ✅ Optimistic loading (кэш на клиенте)
- ✅ Connection pooling (MongoDB)
- ✅ Smart caching (5 минут TTL)
- ✅ Background refresh

## 📚 Документация

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Полная инструкция по развертыванию (пошаговая инструкция на русском)

## 🤝 Вклад в проект

Contributions приветствуются! Форкните репозиторий, создайте ветку с фичей, отправьте pull request.

## 📝 Лицензия

MIT License - см. [LICENSE](./LICENSE)

## 📞 Поддержка

- **Issues**: [GitHub Issues](https://github.com/your-username/open-lance/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/open-lance/discussions)

## 📊 Статус

- **Версия**: 3.2.3
- **Статус**: Production Ready
- **Дата**: Март 2026
- **Архитектура**: Cloudflare Workers + MongoDB Atlas

---

**Сделано с ❤️ на Cloudflare Workers и MongoDB Atlas**
