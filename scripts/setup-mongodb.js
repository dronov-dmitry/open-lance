#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Script
 * Автоматизирует настройку базы данных после создания кластера
 */

const { MongoClient } = require('mongodb');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Цвета для консоли
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function testConnection(uri) {
    log('\n🔌 Проверка подключения к MongoDB Atlas...', 'blue');
    
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000
    });

    try {
        await client.connect();
        log('✅ Подключение успешно!', 'green');
        
        // Получаем информацию о сервере
        const admin = client.db().admin();
        const info = await admin.serverInfo();
        log(`📊 MongoDB версия: ${info.version}`, 'cyan');
        
        await client.close();
        return true;
    } catch (error) {
        log('❌ Ошибка подключения:', 'red');
        log(error.message, 'red');
        
        if (error.message.includes('authentication failed')) {
            log('\n💡 ОШИБКА АУТЕНТИФИКАЦИИ:', 'yellow');
            log('   <db_password> - это пароль который ВЫ создали для Database User!', 'yellow');
            log('   Это НЕ пароль от вашего MongoDB Atlas аккаунта!', 'yellow');
            log('\n   Забыли пароль? Сбросьте его:', 'yellow');
            log('   1. https://cloud.mongodb.com/ → Database Access', 'cyan');
            log('   2. Найдите пользователя → Edit → Edit Password', 'cyan');
            log('   3. Введите НОВЫЙ пароль и ЗАПИШИТЕ его!', 'cyan');
            log('   4. Замените <db_password> на новый пароль (УДАЛИТЕ скобки <>)', 'cyan');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
            log('\n💡 Проверьте Network Access в MongoDB Atlas', 'yellow');
            log('   Должен быть разрешен доступ с 0.0.0.0/0', 'yellow');
        }
        
        await client.close();
        return false;
    }
}

async function setupDatabase(uri, dbName) {
    log('\n🔧 Настройка базы данных...', 'blue');
    
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        
        // Создаем коллекции
        log('\n📚 Создание коллекций...', 'cyan');
        
        const collections = ['users', 'tasks', 'applications'];
        
        for (const collName of collections) {
            try {
                await db.createCollection(collName);
                log(`  ✓ Создана коллекция: ${collName}`, 'green');
            } catch (error) {
                if (error.code === 48) {
                    log(`  ⚠ Коллекция ${collName} уже существует`, 'yellow');
                } else {
                    throw error;
                }
            }
        }
        
        // Создаем индексы
        log('\n🔍 Создание индексов...', 'cyan');
        
        // Users collection
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        log('  ✓ users: email (unique)', 'green');
        
        await db.collection('users').createIndex({ user_id: 1 }, { unique: true });
        log('  ✓ users: user_id (unique)', 'green');
        
        // Tasks collection
        await db.collection('tasks').createIndex({ task_id: 1 }, { unique: true });
        log('  ✓ tasks: task_id (unique)', 'green');
        
        await db.collection('tasks').createIndex({ status: 1 });
        log('  ✓ tasks: status', 'green');
        
        await db.collection('tasks').createIndex({ owner_id: 1 });
        log('  ✓ tasks: owner_id', 'green');
        
        await db.collection('tasks').createIndex({ created_at: -1 });
        log('  ✓ tasks: created_at (desc)', 'green');
        
        await db.collection('tasks').createIndex({ title: 'text', description: 'text' });
        log('  ✓ tasks: text search (title, description)', 'green');
        
        // Applications collection
        await db.collection('applications').createIndex({ application_id: 1 }, { unique: true });
        log('  ✓ applications: application_id (unique)', 'green');
        
        await db.collection('applications').createIndex({ task_id: 1 });
        log('  ✓ applications: task_id', 'green');
        
        await db.collection('applications').createIndex({ worker_id: 1 });
        log('  ✓ applications: worker_id', 'green');
        
        // Проверяем созданные коллекции
        log('\n📋 Список коллекций:', 'cyan');
        const collectionList = await db.listCollections().toArray();
        collectionList.forEach(coll => {
            log(`  • ${coll.name}`, 'green');
        });
        
        await client.close();
        return true;
    } catch (error) {
        log('\n❌ Ошибка при настройке базы данных:', 'red');
        log(error.message, 'red');
        await client.close();
        return false;
    }
}

async function addTestData(uri, dbName) {
    log('\n🧪 Добавление тестовых данных...', 'blue');
    
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        
        // Проверяем, есть ли уже данные
        const userCount = await db.collection('users').countDocuments();
        if (userCount > 0) {
            log('⚠ В базе уже есть данные, пропускаем...', 'yellow');
            await client.close();
            return true;
        }
        
        // Добавляем тестового пользователя
        const testUser = {
            user_id: 'test-user-1',
            email: 'test@example.com',
            password_hash: 'hashed_password', // В продакшене должен быть bcrypt hash
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            rating_as_client: 0,
            rating_as_worker: 0,
            completed_tasks_client: 0,
            completed_tasks_worker: 0,
            contact_links: []
        };
        
        await db.collection('users').insertOne(testUser);
        log('  ✓ Добавлен тестовый пользователь: test@example.com', 'green');
        
        // Добавляем тестовую задачу
        const testTask = {
            task_id: 'test-task-1',
            title: 'Тестовая задача',
            description: 'Это тестовая задача для проверки системы',
            category: 'test',
            budget: 1000,
            currency: 'USD',
            status: 'open',
            owner_id: 'test-user-1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        await db.collection('tasks').insertOne(testTask);
        log('  ✓ Добавлена тестовая задача', 'green');
        
        await client.close();
        return true;
    } catch (error) {
        log('\n❌ Ошибка при добавлении тестовых данных:', 'red');
        log(error.message, 'red');
        await client.close();
        return false;
    }
}

async function displaySummary(uri, dbName) {
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 ИТОГОВАЯ ИНФОРМАЦИЯ', 'cyan');
    log('='.repeat(60), 'cyan');
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        
        log(`\n📁 База данных: ${dbName}`, 'blue');
        
        const collections = await db.listCollections().toArray();
        log(`\n📚 Коллекции (${collections.length}):`, 'blue');
        
        for (const coll of collections) {
            const count = await db.collection(coll.name).countDocuments();
            const indexes = await db.collection(coll.name).indexes();
            log(`  • ${coll.name}: ${count} документов, ${indexes.length} индексов`, 'green');
        }
        
        log('\n✅ База данных готова к использованию!', 'green');
        
        log('\n🔍 Проверить результат в MongoDB Atlas:', 'yellow');
        log('  1. Откройте: https://cloud.mongodb.com/', 'reset');
        log('  2. Перейдите в Database → Browse Collections', 'reset');
        log('  3. Выберите базу данных: ' + dbName, 'cyan');
        log('\n  Ссылка на ваш кластер выглядит так:', 'reset');
        log('  https://cloud.mongodb.com/v2/{project-id}#/clusters/detail/{cluster-name}', 'cyan');
        log('  Пример: https://cloud.mongodb.com/v2/69a86ffbc...#/clusters/detail/open-lance', 'cyan');
        
        log('\n💡 Следующие шаги:', 'yellow');
        log('  1. Запустите скрипт деплоя:', 'reset');
        log('     ./scripts/deploy.sh  (Linux/Mac)', 'cyan');
        log('     .\\scripts\\deploy.ps1  (Windows)', 'cyan');
        log('  2. Используйте эту же connection string при запросе', 'reset');
        
        await client.close();
    } catch (error) {
        log('Ошибка при получении информации:', 'red');
        log(error.message, 'red');
        await client.close();
    }
}

async function main() {
    log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
    log('║    MongoDB Atlas Setup Script v1.0                        ║', 'cyan');
    log('║    Автоматическая настройка базы данных                   ║', 'cyan');
    log('╚═══════════════════════════════════════════════════════════╝', 'cyan');
    
    log('\n📋 Этот скрипт поможет настроить MongoDB Atlas после создания кластера.', 'blue');
    log('   Он создаст необходимые коллекции, индексы и проверит подключение.\n', 'blue');
    
    // Запрашиваем connection string
    log('🔗 Введите MongoDB Connection URI:', 'yellow');
    log('   Пример: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/', 'reset');
    const uri = await question('   URI: ');
    
    if (!uri || !uri.startsWith('mongodb')) {
        log('\n❌ Неверный формат URI', 'red');
        rl.close();
        process.exit(1);
    }
    
    // Запрашиваем имя базы данных
    const dbName = await question('\n📁 Имя базы данных [open-lance]: ') || 'open-lance';
    
    // Тестируем подключение
    const connected = await testConnection(uri);
    if (!connected) {
        log('\n❌ Не удалось подключиться к MongoDB Atlas', 'red');
        log('   Проверьте connection string и настройки Network Access', 'yellow');
        rl.close();
        process.exit(1);
    }
    
    // Настраиваем базу данных
    const setupSuccess = await setupDatabase(uri, dbName);
    if (!setupSuccess) {
        log('\n❌ Не удалось настроить базу данных', 'red');
        rl.close();
        process.exit(1);
    }
    
    // Спрашиваем про тестовые данные
    const addTest = await question('\n❓ Добавить тестовые данные? (y/n) [n]: ');
    if (addTest.toLowerCase() === 'y') {
        await addTestData(uri, dbName);
    }
    
    // Показываем итоговую информацию
    await displaySummary(uri, dbName);
    
    log('\n✨ Настройка завершена!', 'green');
    
    rl.close();
}

// Запускаем
main().catch(error => {
    log('\n💥 Критическая ошибка:', 'red');
    log(error.message, 'red');
    rl.close();
    process.exit(1);
});
