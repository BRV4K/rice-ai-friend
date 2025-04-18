import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage, setMessages } from '../store/slices/chatSlice.js';
import WebApp from '@twa-dev/sdk';

export default function ChatPage() {
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const messages = useSelector((state) => state.chat.messages);
    const settings = useSelector((state) => state.settings);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatMessagesRef = useRef(null);

    const userId = WebApp.initDataUnsafe?.user?.id?.toString() || 'default';
    console.log('User ID:', userId);

    useEffect(() => {
        console.log('Fetching chat history for userId:', userId);
        fetch(`/api/chat/${userId}`)
            .then((res) => {
                console.log('Fetch response status:', res.status);
                return res.json();
            })
            .then((data) => {
                console.log('Chat history data:', data);
                const normalizedData = data.map((msg) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp).toISOString(),
                }));
                dispatch(setMessages(normalizedData));
                // Прокрутка к последнему сообщению после загрузки
                if (messagesEndRef.current) {
                    setTimeout(() => {
                        console.log('Initial scroll to bottom, messages count:', normalizedData.length);
                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            })
            .catch((err) => {
                console.error('Error fetching chat history:', err);
            });
    }, [dispatch, userId]);

    useEffect(() => {
        // Прокрутка к последнему сообщению при изменении messages
        if (messagesEndRef.current) {
            setTimeout(() => {
                console.log('Scrolling to bottom, messages count:', messages.length);
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages]);

    useEffect(() => {
        // Обработчик изменения размера для устранения отступов
        const handleResize = () => {
            console.log('Resize event, window.scrollY:', window.scrollY, 'window.innerHeight:', window.innerHeight);
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Обработчик touchend для сенсорных событий
        const handleTouchEnd = () => {
            setTimeout(() => {
                console.log('Touchend event, window.scrollY:', window.scrollY);
                window.scrollTo(0, 0);
            }, 300);
        };
        document.addEventListener('touchend', handleTouchEnd);
        return () => document.removeEventListener('touchend', handleTouchEnd);
    }, []);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
        dispatch(addMessage(userMessage));

        setInput('');
        setIsTyping(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    message: input,
                    settings,
                    history: messages,
                }),
            });
            const data = await res.json();
            if (data.reply) {
                const botMessage = { role: 'assistant', content: data.reply, timestamp: new Date().toISOString() };
                dispatch(addMessage(botMessage));
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setIsTyping(false);
            // Закрываем клавиатуру с задержкой
            setTimeout(() => {
                if (inputRef.current) {
                    console.log('Blurring inputRef (click)');
                    inputRef.current.blur();
                } else {
                    console.log('Blurring activeElement (click)');
                    document.activeElement.blur();
                }
            }, );
            // Прокручиваем страницу к верху
            setTimeout(() => {
                console.log('Before scroll (click), window.scrollY:', window.scrollY);
                window.scrollTo(0, 0);
                console.log('After scroll (click), window.scrollY:', window.scrollY);
            }, 100);
            setTimeout(() => {
                console.log('Second scroll (click), window.scrollY:', window.scrollY);
                window.scrollTo(0, 0);
            }, 100);
            // Прокрутка к последнему сообщению
            if (messagesEndRef.current) {
                setTimeout(() => {
                    console.log('Scroll to bottom after send, messages count:', messages.length + 1);
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-cont">
            <div className="settings-btn-cont" onClick={() => navigate('/settings')}>
                <img src="/img/settings.svg" alt="Settings" />
            </div>
            <div className="chat-messages" ref={chatMessagesRef}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${
                            msg.role === 'user' ? 'message-user' : 'message-bot'
                        }`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="message-avatar">
                                <img
                                    src="/img/avatar.png"
                                    width={32}
                                    height={32}
                                    alt="Rice"
                                />
                            </div>
                        )}
                        <div className="message-cont">
                            {msg.role === 'assistant' && <span className='message-name'>Rice</span>}
                            <p className="message-content">{msg.content}</p>
                            <span className="message-time">{formatTime(msg.timestamp)}</span>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="message message-bot typing-indicator">
                        <div className="message-avatar">
                            <img
                                src="/img/avatar.png"
                                width={32}
                                height={32}
                                alt="Rice"
                            />
                        </div>
                        <div className="message-cont">
                            <div className="typing-dots">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-cont">
                <input
                    type="text"
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleSendMessage();
                            setTimeout(() => {
                                if (inputRef.current) {
                                    console.log('Blurring inputRef (Enter)');
                                    inputRef.current.blur();
                                } else {
                                    console.log('Blurring activeElement (Enter)');
                                    document.activeElement.blur();
                                }
                            }, );
                            setTimeout(() => {
                                console.log('Before scroll (Enter), window.scrollY:', window.scrollY);
                                window.scrollTo(0, 0);
                                console.log('After scroll (Enter), window.scrollY:', window.scrollY);
                            }, );
                        }
                    }}
                    placeholder="написать..."
                    className="chat-input"
                />
                <div onClick={handleSendMessage} className="chat-send-btn">
                    <img src="/img/send.svg" />
                </div>
            </div>
        </div>
    );
}