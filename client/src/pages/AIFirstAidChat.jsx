import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, UploadCloud, Volume2, User, Bot, AlertTriangle, Activity } from 'lucide-react';

const NeuronAnimation = ({ active }) => {
  return (
    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', height: '20px' }}>
      <div className={`neuron-dot ${active ? 'active' : ''}`} style={{ animationDelay: '0.1s' }}></div>
      <div className={`neuron-dot ${active ? 'active' : ''}`} style={{ animationDelay: '0.2s' }}></div>
      <div className={`neuron-dot ${active ? 'active' : ''}`} style={{ animationDelay: '0.3s' }}></div>
      <style>{`
        .neuron-dot {
          width: 6px;
          height: 6px;
          background-color: var(--primary-color);
          border-radius: 50%;
          opacity: 0.3;
          transition: all 0.2s ease;
        }
        .neuron-dot.active {
          animation: pulse-neuron 0.8s infinite alternate;
          background-color: var(--accent-color);
        }
        @keyframes pulse-neuron {
          0% { transform: scale(1); opacity: 0.3; box-shadow: 0 0 0 transparent; }
          100% { transform: scale(1.5); opacity: 1; box-shadow: 0 0 8px var(--accent-color); }
        }
      `}</style>
    </div>
  );
};

export default function AIFirstAidChat() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your AI First Aid Assistant. You can upload an image of an injured animal, and I will analyze it using computer vision to provide immediate voice-guided first-aid instructions. What do you need help with?' }
  ]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop previous speeches
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    const userMessage = { 
      sender: 'user', 
      text: input || 'Uploaded an image for analysis.', 
      image: preview 
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    const currentInput = input;
    const currentFile = file;
    
    setInput('');
    setFile(null);
    setPreview(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      let botResponseText = '';

      if (currentFile) {
        // Image Pipeline
        const formData = new FormData();
        formData.append('image', currentFile);
        
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/injuries/analyze`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        
        const { severity, analysis } = res.data;
        
        if (analysis?.error) {
           botResponseText = `Error Analyzing Image: ${analysis.error}`;
        } else {
           botResponseText = `I detected a ${severity} severity situation.\n\n`;
           if (analysis?.assessment) botResponseText += `Assessment: ${analysis.assessment}\n\n`;
           if (analysis?.first_aid_steps?.length > 0) botResponseText += `First Aid: ${analysis.first_aid_steps.join('. ')}\n\n`;
           if (analysis?.precautions?.length > 0) botResponseText += `Precautions: ${analysis.precautions.join('. ')}`;
        }

      } else {
        // Text Only Chat Pipeline
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat`, { message: currentInput }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        botResponseText = res.data.reply;
      }

      setMessages(prev => [...prev, { sender: 'bot', text: botResponseText }]);
      speakText(botResponseText); // Trigger audio immediately
      
    } catch (err) {
      const errMsg = "I encountered an error trying to process your request. Please try again.";
      setMessages(prev => [...prev, { sender: 'bot', text: errMsg }]);
      speakText(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade" style={{ maxWidth: '800px', margin: '0 auto', height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 className="heading-gradient" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertTriangle color="var(--danger)" /> AI First Aid Assistance
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Upload an image for automated vision analysis and voice-guided first aid.</p>
        </div>
        <NeuronAnimation active={isSpeaking} />
      </div>
      
      <div className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start', gap: '1rem' }}>
              
              {m.sender === 'bot' && (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot color="#fff" />
                </div>
              )}
              
              <div style={{ maxWidth: '75%', background: m.sender === 'user' ? 'var(--secondary-color)' : 'var(--bg-panel)', color: m.sender === 'user' ? '#fff' : 'var(--text-main)', padding: '1rem', borderRadius: '16px', borderBottomRightRadius: m.sender === 'user' ? '4px' : '16px', borderBottomLeftRadius: m.sender === 'bot' ? '4px' : '16px', border: m.sender === 'bot' ? '1px solid var(--border-color)' : 'none', position: 'relative' }}>
                {m.image && <img src={m.image} alt="Upload" style={{ width: '100%', borderRadius: '8px', marginBottom: '0.8rem' }} />}
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{m.text}</p>
                
                {m.sender === 'bot' && (
                  <button type="button" onClick={() => speakText(m.text)} style={{ position: 'absolute', right: '-40px', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Volume2 size={20} />
                  </button>
                )}
              </div>
              
              {m.sender === 'user' && (
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User color="#fff" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '1rem' }}>
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot color="#fff" />
               </div>
               <div style={{ background: 'var(--bg-panel)', padding: '1rem', borderRadius: '16px', borderBottomLeftRadius: '4px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                 <Activity size={18} color="var(--primary-color)" className="spin-animation" /> Processing visual telemetry...
                 <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin-animation { animation: spin 2s linear infinite; }`}</style>
               </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '1rem', background: 'var(--bg-panel)', borderTop: '1px solid var(--border-color)' }}>
          {preview && (
            <div style={{ marginBottom: '1rem', position: 'relative', display: 'inline-block' }}>
              <img src={preview} alt="Preview" style={{ height: '80px', borderRadius: '8px', border: '2px solid var(--secondary-color)' }} />
              <button type="button" onClick={() => {setFile(null); setPreview(null);}} style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger)', color: 'white', borderRadius: '50%', border: 'none', width: '24px', height: '24px', cursor: 'pointer' }}>×</button>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button type="button" onClick={() => document.getElementById('chat-image').click()} className="btn-outline" style={{ padding: '0.8rem', border: 'none', borderRadius: '50%', background: 'var(--bg-color)', flexShrink: 0 }}>
              <UploadCloud size={24} color="var(--primary-color)" />
            </button>
            <input id="chat-image" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            
            <input 
              type="text" 
              className="input-control" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask for help or upload an image..."
              style={{ flexGrow: 1, borderRadius: '24px' }}
            />
            
            <button type="submit" className="btn" disabled={loading || (!input.trim() && !file)} style={{ padding: '0.8rem', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={24} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
