import { Routes, Route, useNavigate } from 'react-router-dom';
import HelloPage from './pages/HelloPage.jsx';
import SettingPage from './pages/SettingPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import WebApp from '@twa-dev/sdk';
import { useEffect, useState } from 'react';

export default function App() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

    useEffect(() => {
        // Инициализируем Telegram Web App
        WebApp.ready();
        WebApp.disableVerticalSwipes();
        WebApp.expand();
        WebApp.requestFullscreen();
        console.log('User:', WebApp.initDataUnsafe.user);

        const userId = WebApp.initDataUnsafe?.user?.id?.toString() || 'default';

        // Проверяем настройки и историю чата только один раз
        const checkOnboarding = async () => {
            try {
                // Проверяем настройки
                const settingsRes = await fetch(`/api/rice/${userId}`);
                const settings = await settingsRes.json();
                console.log('Settings:', settings);

                // Проверяем историю чата
                const chatRes = await fetch(`/api/chat/${userId}`);
                const chatHistory = await chatRes.json();
                console.log('Chat history:', chatHistory);

                // Если онбординг завершён и есть сообщения (больше одного), перенаправляем на /chat
                if (settings.onboardingCompleted && chatHistory.length > 1) {
                    console.log('Onboarding completed, redirecting to /chat');
                    navigate('/chat', { replace: true });
                }
            } catch (err) {
                console.error('Error checking onboarding:', err);
            } finally {
                setIsLoading(false);
                setHasCheckedOnboarding(true); // Устанавливаем флаг, чтобы не проверять повторно
            }
        };

        if (!hasCheckedOnboarding) {
            checkOnboarding();
        }
    }, [navigate, hasCheckedOnboarding]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="app-container">
            <div className="app-header"></div>
            <Routes>
                <Route path="/" element={<HelloPage />} />
                <Route path="/settings" element={<SettingPage />} />
                <Route path="/chat" element={<ChatPage />} />
            </Routes>
        </div>
    );
}