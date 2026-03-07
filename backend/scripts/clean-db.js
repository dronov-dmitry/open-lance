const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('❌ ОШИБКА: MONGODB_URI не найден в переменных окружения.');
    process.exit(1);
}

async function clean() {
    console.log('Подключение к MongoDB Atlas...');
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('open-lance');
        const collections = ['users', 'tasks', 'applications', 'reviews'];
        for (const colName of collections) {
            process.stdout.write('Очистка коллекции ' + colName + '... ');
            const collection = db.collection(colName);
            const result = await collection.deleteMany({});
            console.log('Удалено документов: ' + result.deletedCount);
        }
        console.log('\n✅ База данных успешно очищена! Индексы сохранены.');
    } catch (e) {
        console.error('❌ Ошибка при очистке БД:', e);
    } finally {
        await client.close();
        console.log('Соединение с MongoDB закрыто.');
    }
}

clean();
