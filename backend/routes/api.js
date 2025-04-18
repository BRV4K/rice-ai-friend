const express = require('express');
const { getDb } = require('../db');
const axios = require('axios');
const { encoding_for_model } = require('tiktoken');

const router = express.Router();

// Функция для подсчёта токенов
const countTokens = (text) => {
    const encoder = encoding_for_model('gpt-3.5-turbo');
    const tokens = encoder.encode(text).length;
    return tokens;
};

// Эндпоинт для получения настроек
router.get('/rice/:userId', async (req, res) => {
    try {
        const userId = req.params.userId || 'default';
        console.log(`Fetching settings for userId: ${userId}`);
        const db = getDb();
        const settings = await db.collection('settings').findOne({ userId });
        console.log(`Settings found:`, settings);
        res.json(settings || {});
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Эндпоинт для сохранения настроек
router.post('/rice', async (req, res) => {
    try {
        console.log('Received settings:', req.body);
        const settings = req.body;
        const db = getDb();
        await db.collection('settings').updateOne(
            { userId: settings.userId || 'default' },
            { $set: settings },
            { upsert: true }
        );
        res.json({ message: 'Settings saved' });
    } catch (err) {
        console.error('Error saving settings:', err);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// Эндпоинт для получения истории переписки
router.get('/chat/:userId', async (req, res) => {
    try {
        const userId = req.params.userId || 'default';
        console.log(`Fetching chat history for userId: ${userId}`);
        const db = getDb();
        let chatHistory = await db.collection('chat').findOne({ userId });

        if (!chatHistory) {
            console.log(`No chat history found for userId: ${userId}, creating initial message`);
            const initialMessage = {
                role: 'assistant',
                content: 'привет, друг!',
                timestamp: new Date().toISOString(),
            };
            await db.collection('chat').insertOne({
                userId,
                messages: [initialMessage],
            });
            chatHistory = { messages: [initialMessage] };
        } else {
            console.log(`Chat history found:`, chatHistory.messages);
        }

        res.json(chatHistory.messages);
    } catch (err) {
        console.error('Error fetching chat history:', err);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// Эндпоинт для отправки сообщения и получения ответа от DeepSeek
router.post('/chat', async (req, res) => {
    try {
        console.log('Received chat request:', req.body);
        const { userId = 'default', message, settings, history } = req.body;

        // Сохраняем сообщение пользователя
        console.log('Saving user message to MongoDB...');
        const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
        const db = getDb();
        await db.collection('chat').updateOne(
            { userId },
            { $push: { messages: userMessage } },
            { upsert: true }
        );
        console.log('User message saved:', userMessage);

        // Формируем промпт для DeepSeek на основе настроек
        console.log('Generating system prompt for DeepSeek...');
        const systemPrompt = `
            Ты виртуальный ${settings.gender} по имени Rice. Твои характеристики:
            - Болтливость: ${settings.talkativeness} (0 - молчаливый, 10 - болтливый)
            - Чуткость: ${settings.sensitivity} (0 - рациональный, 10 - чуткий)
            - Энтузиазм: ${settings.enthusiasm} (0 - скептик, 10 - энтузиаст)
            - Дерзость: ${settings.boldness} (0 - вежливый, 10 - дерзкий)
            - Юмор: ${settings.humor} (0 - серьёзный, 10 - шутник)
            - Спорливость: ${settings.argumentativeness} (0 - соглашается, 10 - спорит)
            Интересы: ${settings.interests.join(', ')}.
            Отвечай кратко, как человек, не используй длинные ответы. Твой максимум - 150 токенов, учитывай это при генерации ответов.
            Не выделяй слова * или другими символами, форматирование работать не будет.
        `;
        console.log('System prompt:', systemPrompt);

        // Берём последние 15 сообщений (пользователя и бота)
        console.log('Preparing message history for DeepSeek...');
        const recentMessages = history.slice(-15);
        const messages = [
            { role: 'system', content: systemPrompt },
            ...recentMessages.map((msg) => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: message },
        ];
        console.log('Messages for DeepSeek:', messages);

        // Подсчитываем токены в запросе
        let totalTokens = 0;
        messages.forEach((msg) => {
            totalTokens += countTokens(msg.content);
        });
        console.log(`Tokens in request: ${totalTokens}`);

        // Запрос к DeepSeek API
        console.log('Sending request to DeepSeek API...');
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages,
                max_tokens: 150,
                temperature: 0.7,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('DeepSeek API response:', response.data);

        const reply = response.data.choices[0].message.content;
        console.log('Extracted reply:', reply);

        // Подсчитываем токены в ответе
        const responseTokens = countTokens(reply);
        totalTokens += responseTokens;
        console.log(`Tokens in response: ${responseTokens}`);
        console.log(`Total tokens for request: ${totalTokens}`);

        // Сохраняем ответ бота
        console.log('Saving bot message to MongoDB...');
        const botMessage = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
        await db.collection('chat').updateOne(
            { userId },
            { $push: { messages: botMessage } },
            { upsert: true }
        );
        console.log('Bot message saved:', botMessage);

        res.json({ reply });
    } catch (err) {
        console.error('Error in /api/chat:', err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Логирование всех маршрутов
console.log('Registered API routes:', router.stack.map(layer => layer.route?.path || layer.regexp?.source).filter(Boolean));

module.exports = router;