import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, RotateCcw, ChevronDown, Sparkles, MapPin, School, Hospital, CloudSun, Navigation } from 'lucide-react';
import { chatApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const WELCOME_MSG = {
  role: 'assistant',
  message: `Hey! I'm **RentEase AI Assistant** — your rental + neighborhood guide dYO?.

I can do things like:
- **Find homes:** *"Show 2 BHK family flats in Bangalore under ₹25,000"*
- **Explore an area:** *"Is Pune good for students? What are schools and hospitals nearby?"*
- **Live city intel:** *"Tell me about Hinjewadi, Pune — weather, air quality, markets, transport"*
- **Renting help:** *"Deposit kitna hota hai?"* or *"What should I check before renting?"*

Just say a city name and I'll show houses + nearby essentials on the map.`
};

const QUICK_PROMPTS = [
  'Show houses in Pune under ₹15,000',
  'Tell me about Whitefield, Bangalore',
  'Schools and hospitals near Hinjewadi',
  'Weather and air quality in Mumbai',
  'PG rooms for students under ₹10,000',
  'Is London good for families?'
];

function MarkdownText({ text }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br />');
  return <div className="leading-relaxed text-sm" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
}

function PropertyResultCard({ property }) {
  const formatRent = (n) => new Intl.NumberFormat('en-IN').format(n);
  return (
    <Link to={`/properties/${property.id}`} className="block mt-2 p-3 bg-white border border-brand-200 rounded-xl hover:border-brand-400 hover:shadow-md transition-all group">
      <div className="flex space-x-3">
        {property.primary_image && (
          <img
            src={property.primary_image}
            alt={property.title}
            className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-brand-600 transition-colors">{property.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{property.locality}, {property.city}</p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-sm font-bold text-brand-600">₹{formatRent(property.monthly_rent)}/mo</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium capitalize">{property.property_type}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [propertyResults, setPropertyResults] = useState({});
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, messages]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg = { role: 'user', message: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatApi.sendMessage(messageText, sessionId);
      const data = res.data;

      const msgIndex = messages.length + 1;
      const assistantMsg = { role: 'assistant', message: data.reply };
      setMessages(prev => [...prev, assistantMsg]);

      if (data.properties && data.properties.length > 0) {
        setPropertyResults(prev => ({
          ...prev,
          [msgIndex]: data.properties
        }));
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: 'I\'m having trouble connecting right now. Please check that the backend server is running and try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MSG]);
    setPropertyResults({});
    chatApi.clearHistory(sessionId).catch(() => {});
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 group flex items-center space-x-2 transition-all duration-300 ${open ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}`}>
        <div className="absolute -inset-1 bg-brand-500 rounded-full blur opacity-40 group-hover:opacity-60 animate-pulse" />
        <div className="relative bg-gradient-to-tr from-brand-700 to-brand-500 text-white rounded-full p-4 shadow-xl hover:scale-110 transition-transform">
          <Bot className="w-6 h-6" />
        </div>
        <div className="hidden sm:block bg-slate-900 text-white text-sm font-semibold px-3 py-2 rounded-full shadow-lg whitespace-nowrap">
          AI Assistant
          <Sparkles className="inline w-3.5 h-3.5 ml-1 text-amber-400" />
        </div>
      </button>

      {/* Chat Panel */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}>
        <div className="w-[380px] sm:w-[420px] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-700 to-brand-600 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">RentEase AI</p>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-blue-100">Houses + Neighborhood Guide</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                title="Clear chat history"
                className="p-1.5 rounded-lg hover:bg-white/20 transition text-blue-100 hover:text-white">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition text-blue-100 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-0">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Bot className="w-4 h-4 text-brand-600" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <MarkdownText text={msg.message} />
                  ) : (
                    <p className="text-sm">{msg.message}</p>
                  )}
                  {/* Property Results */}
                  {msg.role === 'assistant' && propertyResults[idx] && (
                    <div className="mt-3 space-y-2">
                      {propertyResults[idx].map(p => (
                        <PropertyResultCard key={p.id} property={p} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Bot className="w-4 h-4 text-brand-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                    <span className="text-sm text-slate-500">
                      Scanning homes, map, schools, hospitals & environment...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto">
            <div className="flex space-x-2 pb-1">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  disabled={loading}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition font-medium disabled:opacity-50">
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about rooms, rent, deposits..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none disabled:bg-slate-50 transition"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105 active:scale-95">
                <Send className="w-4 h-4" />
              </button>
            </div>
              <p className="text-center text-[10px] text-slate-400 mt-2">
                Houses from verified DB + live city inventory · Schools, hospitals, markets & transport shown
              </p>
          </div>
        </div>
      </div>
    </>
  );
}

