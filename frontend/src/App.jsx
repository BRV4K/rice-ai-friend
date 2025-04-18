import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HelloPage from './pages/HelloPage.jsx';
import SettingPage from './pages/SettingPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import WebApp from '@twa-dev/sdk';
import { useEffect } from 'react';

export default function App() {
    useEffect(() => {
        // Инициализируем Telegram Web App
        WebApp.ready();
        //Убираем закрытие скроллом
        WebApp.disableVerticalSwipes();
        //Открываем на полную высоту экрана
        WebApp.expand();
        //Открываем в режиме фулскрин
        WebApp.requestFullscreen();
        // Получаем данные пользователя
        console.log('User:', WebApp.initDataUnsafe.user);
    }, []);

    return (
        <div className="app-container">
            <div className='app-header'></div>
            <Router>
                <Routes>
                    <Route path="/" element={<HelloPage />} />
                    <Route path="/settings" element={<SettingPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                </Routes>
            </Router>
        </div>
    );
}