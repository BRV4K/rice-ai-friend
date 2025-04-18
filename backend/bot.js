const { Telegraf } = require('telegraf');
const axios = require('axios');

function setupBot() {
    const bot = new Telegraf(process.env.BOT_TOKEN, {
        telegram: {
            agent: null,
            apiRoot: 'https://api.telegram.org',
            webhookReply: false,
        },
    });

    // Переопределяем метод для HTTP-запросов
    bot.telegram.makeRequest = async (method, payload) => {
        try {
            console.log(`Sending Telegram API request: ${method}`);
            const response = await axios.post(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/${method}`,
                payload,
                {
                    timeout: 10000, // Тайм-аут 10 секунд
                }
            );
            console.log(`Telegram API response for ${method}:`, response.data);
            return response.data;
        } catch (err) {
            console.error(`Telegram API error for ${method}:`, err.message);
            if (err.response) {
                console.error('Response data:', err.response.data);
            }
            throw err;
        }
    };

    // Команда /start
    bot.start((ctx) => {
        ctx.reply('Welcome to Rice Bot! Click below to open the app.', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Open Rice', web_app: { url: process.env.SERVER_URL } }],
                ],
            },
        });
    });

    // Команда /help
    bot.help((ctx) => {
        ctx.reply('Use /start to open the Rice Mini App.');
    });

    // Обработка ошибок бота
    bot.catch((err, ctx) => {
        console.error(`Bot error: ${err.message}`, err);
    });

    return bot;
}

module.exports = { setupBot };