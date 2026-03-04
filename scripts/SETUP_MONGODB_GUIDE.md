# 🚀 Автоматическая настройка MongoDB Atlas

## Что делает этот скрипт?

После того как вы **вручную создали кластер** в MongoDB Atlas, этот скрипт автоматически:

✅ Проверяет подключение к MongoDB Atlas  
✅ Создает необходимые коллекции (`users`, `tasks`, `applications`)  
✅ Создает все индексы для оптимальной производительности  
✅ (Опционально) Добавляет тестовые данные  
✅ Показывает итоговую информацию о базе данных  

## ⚠️ Что нужно сделать ВРУЧНУЮ

**Перед запуском скрипта** вы ДОЛЖНЫ:

1. ✋ Зарегистрироваться в MongoDB Atlas ([инструкция на русском](../MONGODB_ATLAS_SETUP.md#-быстрая-инструкция-на-русском))
2. ✋ Создать бесплатный кластер (M0 Free Tier)
3. ✋ Создать пользователя базы данных
4. ✋ Настроить Network Access (разрешить `0.0.0.0/0`)
5. ✋ Получить Connection URI

**Почему нельзя автоматизировать создание кластера?**
- MongoDB Atlas требует регистрацию через браузер
- API доступ требует кредитную карту (даже для free tier)
- Первый кластер должен быть создан интерактивно

## 🏃 Как использовать

### Шаг 1: Установите зависимости

```bash
cd backend
npm install
```

### Шаг 2: Запустите скрипт

**Linux/Mac:**
```bash
node ../scripts/setup-mongodb.js
```

**Windows:**
```powershell
node ..\scripts\setup-mongodb.js
```

### Шаг 3: Следуйте инструкциям

Скрипт попросит вас ввести:

1. **MongoDB Connection URI** - строка подключения из MongoDB Atlas
   ```
   Пример: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/
   ```

2. **Имя базы данных** - по умолчанию `open-lance`

3. **Добавить тестовые данные?** - можно пропустить (`n`)

## 📊 Что будет создано

### Коллекции:

- **users** - пользователи платформы
- **tasks** - задачи/проекты
- **applications** - заявки воркеров на задачи

### Индексы:

**users:**
- `email` (unique) - для быстрого поиска по email
- `user_id` (unique) - первичный ключ

**tasks:**
- `task_id` (unique) - первичный ключ
- `status` - для фильтрации по статусу
- `owner_id` - для поиска задач пользователя
- `created_at` (desc) - для сортировки по дате
- `title, description` (text) - полнотекстовый поиск

**applications:**
- `application_id` (unique) - первичный ключ
- `task_id` - для поиска заявок на задачу
- `worker_id` - для поиска заявок воркера

## 🎯 Пример работы скрипта

```
╔═══════════════════════════════════════════════════════════╗
║    MongoDB Atlas Setup Script v1.0                        ║
║    Автоматическая настройка базы данных                   ║
╚═══════════════════════════════════════════════════════════╝

📋 Этот скрипт поможет настроить MongoDB Atlas после создания кластера.

🔗 Введите MongoDB Connection URI:
   URI: mongodb+srv://admin:pass@cluster0.xxxxx.mongodb.net/

📁 Имя базы данных [open-lance]: open-lance

🔌 Проверка подключения к MongoDB Atlas...
✅ Подключение успешно!
📊 MongoDB версия: 7.0.5

🔧 Настройка базы данных...

📚 Создание коллекций...
  ✓ Создана коллекция: users
  ✓ Создана коллекция: tasks
  ✓ Создана коллекция: applications

🔍 Создание индексов...
  ✓ users: email (unique)
  ✓ users: user_id (unique)
  ✓ tasks: task_id (unique)
  ✓ tasks: status
  ✓ tasks: owner_id
  ✓ tasks: created_at (desc)
  ✓ tasks: text search (title, description)
  ✓ applications: application_id (unique)
  ✓ applications: task_id
  ✓ applications: worker_id

📋 Список коллекций:
  • users
  • tasks
  • applications

❓ Добавить тестовые данные? (y/n) [n]: n

============================================================
📊 ИТОГОВАЯ ИНФОРМАЦИЯ
============================================================

📁 База данных: open-lance

📚 Коллекции (3):
  • users: 0 документов, 3 индексов
  • tasks: 0 документов, 6 индексов
  • applications: 0 документов, 4 индексов

✅ База данных готова к использованию!

💡 Следующие шаги:
  1. Запустите скрипт деплоя:
     ./scripts/deploy.sh  (Linux/Mac)
     .\scripts\deploy.ps1  (Windows)
  2. Используйте эту же connection string при запросе

✨ Настройка завершена!
```

## 🔍 Проверка результата

После запуска скрипта вы можете проверить результат:

### Вариант 1: MongoDB Compass

1. Установите [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Подключитесь используя ваш Connection URI
3. Вы увидите базу данных `open-lance` с 3 коллекциями

### Вариант 2: MongoDB Atlas Web UI

1. Откройте [MongoDB Atlas](https://cloud.mongodb.com/)
2. Перейдите в **Database** → **Browse Collections**
3. Выберите базу данных `open-lance`
4. Вы увидите коллекции и можете просмотреть индексы

**💡 Прямая ссылка на ваш кластер:**

Ссылка на кластер в MongoDB Atlas имеет такой формат:
```
https://cloud.mongodb.com/v2/{project-id}#/clusters/detail/{cluster-name}
```

**Пример:**
```
https://cloud.mongodb.com/v2/69a86ffbc1953660e2614267#/clusters/detail/open-lance
```

Где:
- `69a86ffbc1953660e2614267` - уникальный ID вашего проекта
- `open-lance` - название вашего кластера

**Как найти эту ссылку:**
1. Откройте MongoDB Atlas
2. Кликните на название кластера в разделе Database
3. Скопируйте URL из адресной строки браузера
4. Сохраните в закладки для быстрого доступа!

## 🆘 Решение проблем

### Ошибка: "authentication failed"

**Причина:** Неверный username или password в Connection URI

**Решение:**
1. Проверьте правильность username и password
2. Убедитесь что вы удалили скобки `<>` из строки подключения
3. Пример правильного URI:
   ```
   mongodb+srv://admin:MyPass123@cluster0.xxx.mongodb.net/
   ```

### Ошибка: "ENOTFOUND" или "ETIMEDOUT"

**Причина:** Ограничен доступ по IP в Network Access

**Решение:**
1. Откройте MongoDB Atlas → **Network Access**
2. Добавьте IP `0.0.0.0/0` (разрешить доступ отовсюду)
3. Подождите 1-2 минуты пока изменения применятся

### Ошибка: "MongoServerError: collection already exists"

**Причина:** Коллекции уже созданы

**Решение:** Это нормально! Скрипт просто пропустит создание существующих коллекций.

## 🔄 Повторный запуск

Скрипт безопасно запускать повторно:
- Существующие коллекции не будут пересозданы
- Индексы будут созданы, если их нет
- Данные не будут удалены

## 🚀 Следующий шаг

После успешной настройки MongoDB Atlas, запустите deployment скрипт:

```bash
# Linux/Mac
./scripts/deploy.sh

# Windows
.\scripts\deploy.ps1
```

Скрипт деплоя попросит ту же Connection URI для настройки Cloudflare Workers.

---

**💡 Совет:** Сохраните ваш Connection URI в надежном месте (менеджер паролей), он понадобится для деплоя!
