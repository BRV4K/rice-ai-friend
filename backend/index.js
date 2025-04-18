const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { setupBot } = require('./bot');
const { connectToMongo } = require('./db');
const apiRoutes = require('./routes/api');

const app = express();
const port = 3000;

// Проверка SERVER_URL
if (!process.env.SERVER_URL || !process.env.SERVER_URL.startsWith('https://')) {
    console.error('Error: SERVER_URL is missing or invalid in .env');
    process.exit(1);
}

// Настройка CORS
app.use(cors({
    origin: process.env.SERVER_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));
console.log('Added CORS middleware');

// JSON парсер
app.use(express.json());
console.log('Added JSON parser middleware');

// Обслуживание статических файлов фронтенда из папки dist
const distPath = path.join(__dirname, '../frontend/dist');
console.log('Serving static files from:', distPath);
app.use(express.static(distPath));
console.log('Added static middleware');

// Подключение маршрутов API
console.log('Mounting API routes on: /api');
app.use('/api', apiRoutes);
console.log('Added API routes middleware');

// Обработка корневого маршрута — отдаём index.html
app.get('/', (req, res) => {
    console.log('Serving index.html for path:', req.path);
    res.sendFile(path.join(distPath, 'index.html'));
});
console.log('Added root route');

// Запуск бота
const bot = setupBot();
bot.launch().then(() => {
    console.log('Bot is running...');
}).catch((err) => {
    console.error('Failed to launch bot:', err);
});

// Запуск сервера
app.listen(port, async () => {
    console.log(`Server running at ${process.env.SERVER_URL}`);
    await connectToMongo();

    // Логирование всех middleware с задержкой для инициализации роутера
    setTimeout(() => {
        console.log('Final middleware stack:');
        if (app._router && app._router.stack) {
            app._router.stack.forEach((middleware, index) => {
                console.log(`Middleware ${index}:`, {
                    name: middleware.name || 'anonymous',
                    path: middleware.route?.path || middleware.regexp?.source || 'N/A',
                    handle: middleware.handle?.toString().slice(0, 50) + '...'
                });
            });
        } else {
            console.log('Router stack not initialized');
        }
    }, 100); // Задержка 100 мс для полной инициализации
});

// Остановка бота и MongoDB при завершении процесса
process.once('SIGINT', () => {
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
});