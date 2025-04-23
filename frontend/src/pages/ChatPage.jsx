import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addMessage, setMessages } from '../store/slices/chatSlice.js';
import WebApp from '@twa-dev/sdk';

export default function ChatPage() {
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const messages = useSelector((state) => state.chat.messages);
    const settings = useSelector((state) => state.settings);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const chatMessagesRef = useRef(null);

    // Отключаем вертикальные свайпы и разворачиваем Mini App
    useEffect(() => {
        if (WebApp) {
            WebApp.disableVerticalSwipes();
            WebApp.expand();
            console.log('Vertical swipes disabled, Mini App expanded');
        }
    }, []);

    // Отслеживание высоты клавиатуры через window.visualViewport
    useEffect(() => {
        const handleVisualViewport = () => {
            if (window.visualViewport) {
                const newKeyboardHeight = window.innerHeight - window.visualViewport.height;
                setKeyboardHeight(newKeyboardHeight > 0 ? newKeyboardHeight : 0);
                // Предотвращаем смещение вьюпорта
                if (window.scrollY !== 0 || window.visualViewport.offsetTop !== 0) {
                    window.scrollTo(0, 0);
                }
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleVisualViewport);
            window.visualViewport.addEventListener('scroll', handleVisualViewport);
        }

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleVisualViewport);
                window.visualViewport.removeEventListener('scroll', handleVisualViewport);
            }
        };
    }, []);

    // Отслеживание window.scrollY
    useEffect(() => {
        const handleScroll = () => {
            // Принудительно возвращаем scrollY к 0
            if (window.scrollY !== 0) {
                window.scrollTo(0, 0);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        if (messagesEndRef.current) {
            setTimeout(() => {
                console.log('Scrolling to bottom, messages count:', messages.length);
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages]);

    useEffect(() => {
        const handleResize = () => {
            console.log('Resize event:', {
                windowScrollY: window.scrollY,
                windowInnerHeight: window.innerHeight,
                visualViewportHeight: window.visualViewport?.height,
            });
            window.scrollTo(0, 0);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleTouchEnd = () => {
            console.log('Touchend event:', {
                windowScrollY: window.scrollY,
            });
            window.scrollTo(0, 0);
        };
        document.addEventListener('touchend', handleTouchEnd);
        return () => document.removeEventListener('touchend', handleTouchEnd);
    }, []);

    // Динамическая высота textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            // Сбрасываем высоту, чтобы вычислить реальную высоту содержимого
            textarea.style.height = 'auto';
            // Устанавливаем высоту на основе scrollHeight, но не больше 120px
            const newHeight = Math.min(textarea.scrollHeight, 120);
            textarea.style.height = `${newHeight}px`;
            // Прокручиваем к низу textarea
            textarea.scrollTop = textarea.scrollHeight;
        }
    }, [input]);

    // Прокрутка при изменении keyboardHeight
    useEffect(() => {
        if (isInputFocused && chatMessagesRef.current && messagesEndRef.current) {
            setTimeout(() => {
                console.log('Adjusting scroll due to keyboard height:', keyboardHeight);
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }, 300); // Задержка для ожидания завершения анимации клавиатуры
        }
    }, [keyboardHeight, isInputFocused]);

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
            window.scrollTo(0, 0);
            // Возвращаем фокус на textarea после отправки
            if (textareaRef.current) {
                setTimeout(() => {
                    textareaRef.current.focus();
                }, 300);
            }
            if (messagesEndRef.current) {
                setTimeout(() => {
                    console.log('Scroll to bottom after send, messages count:', messages.length + 1);
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        }
    };

    const handleInputFocus = (e) => {
        console.log('Textarea focused:', {
            event: e.type,
            activeElement: document.activeElement === textareaRef.current,
        });
        setIsInputFocused(true);
        // Прокрутка к самому низу при фокусе
        if (chatMessagesRef.current && messagesEndRef.current) {
            setTimeout(() => {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
            }, 100);
        }
    };

    const handleInputBlur = (e) => {
        console.log('Textarea blurred:', {
            event: e.type,
            activeElement: document.activeElement,
        });
        setIsInputFocused(false);
        setKeyboardHeight(0);
    };

    const handleTouchStart = (e) => {
        console.log('Textarea touchstart:', {
            clientY: e.touches[0].clientY,
            scrollY: window.scrollY,
        });
        e.preventDefault();
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleTouchMove = (e) => {
        console.log('Textarea touchmove:', {
            clientY: e.touches[0].clientY,
            scrollY: window.scrollY,
        });
    };

    const handleTouchEnd = (e) => {
        console.log('Textarea touchend:', {
            clientY: e.changedTouches[0].clientY,
            scrollY: window.scrollY,
        });
        // Принудительный фокус с задержкой
        if (textareaRef.current && !isInputFocused) {
            setTimeout(() => {
                textareaRef.current.focus();
            }, 100);
        }
    };

    const handleSendButtonMouseDown = (e) => {
        e.preventDefault(); // Предотвращаем потерю фокуса
        handleSendMessage();
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-cont">
            <div className="settings-btn-cont" onClick={() => navigate('/settings')}>
                <img src="/img/settings.svg" alt="Settings" />
            </div>
            <div
                className="chat-messages"
                ref={chatMessagesRef}
                style={{
                    paddingBottom: `${keyboardHeight > 0 ? 60 + keyboardHeight : 120}px`,
                }}
            >
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
                            {msg.role === 'assistant' && <span className="message-name">Rice</span>}
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
            <div
                className="chat-input-cont"
                style={{
                    bottom: `${keyboardHeight > 0 ? 5 + keyboardHeight : 50}px`,
                }}
            >
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="написать..."
                    className="chat-input"
                />
                <div
                    onClick={handleSendMessage}
                    onMouseDown={handleSendButtonMouseDown}
                    className="chat-send-btn"
                >
                    <img src="/img/send.svg" alt="Send" />
                </div>
            </div>
        </div>
    );
}