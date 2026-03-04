# ❓ Где взять пароль для MongoDB Atlas?

## 🔑 Что такое `<db_password>`?

В Connection URI из MongoDB Atlas вы видите:

```
mongodb+srv://username:<db_password>@cluster0.xxxxx.mongodb.net/
                        ↑
                  Это НЕ ваш пароль от MongoDB Atlas аккаунта!
```

`<db_password>` - это **пароль Database User**, который **ВЫ сами придумали** при создании пользователя базы данных (Database Access).

## 🚫 Частая ошибка

❌ **НЕПРАВИЛЬНО** - оставить как есть:
```
mongodb+srv://user:<db_password>@cluster.net/
```

✅ **ПРАВИЛЬНО** - заменить на ваш реальный пароль:
```
mongodb+srv://user:MySecurePass123@cluster.net/
```

⚠️ **Удалите скобки `<>` и замените на ваш пароль!**

## 📝 Когда вы создали этот пароль?

При создании Database User (шаг 3 инструкции):

1. MongoDB Atlas → **Database Access**
2. **Add New Database User**
3. Username: `your-username`
4. Password: **Вы придумали пароль** ← Это и есть `<db_password>`!
5. Add User

**MongoDB Atlas НЕ покажет этот пароль снова!**

## 🔄 Забыли пароль? Сбросьте!

Не проблема! Можно создать новый пароль:

### Шаг 1: Откройте MongoDB Atlas

Перейдите на [https://cloud.mongodb.com/](https://cloud.mongodb.com/)

### Шаг 2: Сброс пароля

1. Слева выберите **"Database Access"**
2. Найдите вашего пользователя
3. Нажмите кнопку **"Edit"** (значок карандаша справа)
4. Нажмите **"Edit Password"**
5. Введите **НОВЫЙ пароль** (например: `MyNewPass123!`)
6. **ЗАПИШИТЕ ЕГО НЕМЕДЛЕННО!** 📝
7. Нажмите **"Update User"**
8. Подождите 1-2 минуты пока изменения применятся

### Шаг 3: Используйте новый пароль

**Пример вашего Connection URI:**
```
mongodb+srv://dronovdmitrybim_db_user:<db_password>@open-lance.jnk3ck8.mongodb.net/
```

**Замените `<db_password>` на новый пароль:**
```
mongodb+srv://dronovdmitrybim_db_user:MyNewPass123!@open-lance.jnk3ck8.mongodb.net/
```

✅ **Готово!** Используйте эту строку в скриптах деплоя.

## 💡 Советы по паролю

✅ **Хороший пароль:**
- Минимум 8 символов
- Буквы + цифры + символы
- Пример: `MySecure123!@#`

❌ **Плохой пароль:**
- `123456`
- `password`
- Ваше имя или дата рождения

⚠️ **Специальные символы:**
Если пароль содержит специальные символы, их нужно закодировать в URL:
- `@` → `%40`
- `#` → `%23`
- `/` → `%2F`
- `:` → `%3A`

**Пример:**
```
Пароль: MyPass@123#
В URI:  MyPass%40123%23
```

**Или используйте только буквы и цифры для простоты!**

## 🔍 Проверка

Чтобы проверить что Connection URI правильный, запустите:

```bash
cd backend
npm install
node ../scripts/setup-mongodb.js
```

Скрипт проверит подключение и покажет понятное сообщение если пароль неверный.

## 📚 Дополнительная информация

- [Полная инструкция MongoDB Atlas](./MONGODB_ATLAS_SETUP.md) - есть раздел на русском
- [Быстрый старт](./QUICK_START_RU.md) - полный гайд от начала до конца
- [Настройка базы данных](./scripts/SETUP_MONGODB_GUIDE.md) - про скрипт setup-mongodb.js

---

**💡 Сохраните пароль в надежном месте!**
- Менеджер паролей (LastPass, 1Password, Bitwarden)
- Зашифрованный файл
- Блокнот (если дома)

**НЕ сохраняйте пароль:**
- ❌ В коде в GitHub
- ❌ В публичных файлах
- ❌ В чате или email незащищенно
