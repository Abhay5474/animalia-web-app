import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot, User, Send } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState([
    { text: 'Hello! I am your AI Animalia Assistant powered by Gemini. Ask me anything about animal care, first aid, or our services!', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/chat', { message: userMsg }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => [...prev, { text: res.data.reply, sender: 'bot' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Sorry, I am having trouble connecting to Gemini API right now.', sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h1 className="heading-gradient" style={{ marginBottom: '1rem', textAlign: 'center' }}>Gemini AI Assistant</h1>
      
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '1rem', 
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{ 
                minWidth: '40px', height: '40px', borderRadius: '50%', 
                background: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--surface-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'
              }}>
                {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} color="var(--text-light)" />}
              </div>
              <div style={{ 
                background: msg.sender === 'user' ? 'rgba(102, 252, 241, 0.1)' : 'rgba(31, 40, 51, 0.6)',
                border: `1px solid ${msg.sender === 'user' ? 'rgba(102, 252, 241, 0.3)' : 'var(--surface-light)'}`,
                padding: '1rem',
                borderRadius: '12px',
                borderTopRightRadius: msg.sender === 'user' ? '0' : '12px',
                borderTopLeftRadius: msg.sender === 'user' ? '12px' : '0',
                color: 'var(--text-light)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
             <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start' }}>
                <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={20} />
                </div>
                <div style={{ padding: '1rem', background: 'rgba(31, 40, 51, 0.6)', borderRadius: '12px', borderTopLeftRadius: '0' }}>
                  Thinking...
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <input 
            type="text" 
            className="input-control" 
            placeholder="Type your message..." 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            style={{ marginBottom: 0, flex: 1 }}
          />
          <button type="submit" className="btn" disabled={loading} style={{ padding: '0 1.5rem' }}>
            <Send size={20} />
          </button>
        </form>

      </div>
    </div>
  );
}
