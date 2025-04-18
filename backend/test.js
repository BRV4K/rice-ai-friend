const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
console.log('Added JSON parser middleware');

// Обслуживание статических файлов
const distPath = path.join(__dirname, '../frontend/dist');
console.log('Serving static files from:', distPath);
app.use(express.static(distPath));
console.log('Added static middleware');

// Простой тестовый маршрут
app.get('/test', (req, res) => {
    res.json({ message: 'Test route' });
});
console.log('Added /test route');

// Логирование всех middleware
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

app.listen(port, () => {
    console.log('Test server running on port 3000');
});