import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ChatMentor.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function ChatMentor({ userData }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Initial greeting
    useEffect(() => {
        if (userData) {
            fetchInitialAdvice();
        } else {
            setMessages([{
                text: "Hello! I'm your AI Career Mentor. How can I help you today?",
                sender: 'ai',
                timestamp: new Date()
            }]);
        }
    }, [userData]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchInitialAdvice = async () => {
        try {
            const response = await axios.post(`${API_URL}/mentor-advice`, userData);
            if (response.data.success) {
                setMessages([{
                    text: response.data.advice,
                    sender: 'ai',
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Error fetching mentor advice:', error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = {
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${API_URL}/chat`, {
                message: input,
                context: userData?.career_recommendation || {}
            });

            if (response.data.success) {
                setMessages(prev => [...prev, {
                    text: response.data.response,
                    sender: 'ai',
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                text: "I'm having a bit of trouble connecting to my brain right now. Please try again in a moment!",
                sender: 'ai',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderText = (text) => {
        if (!text) return null;
        // Basic markdown for bold: **text**
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className={`chat-mentor-wrapper ${isOpen ? 'open' : ''}`}>
            {/* Floating Button */}
            <button
                className="chat-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Talk to AI Mentor"
            >
                {isOpen ? '✕' : '🤖'}
                <span className="pulse-ring"></span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window shadow-lg">
                    <div className="chat-header">
                        <div className="mentor-avatar">🤖</div>
                        <div className="mentor-info">
                            <h3>AI Career Mentor</h3>
                            <span>Online & Ready to Help</span>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-row ${msg.sender}`}>
                                <div className="message-bubble">
                                    {renderText(msg.text)}
                                    <span className="msg-time">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message-row ai">
                                <div className="message-bubble loading">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSend}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={!input.trim() || isLoading}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default ChatMentor;
