import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, RotateCcw, Sparkles, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { chatApi } from '../services/api';

const WELCOME = {
  role: 'assistant',
  message: `Hey! I'm **RentEase AI Assistant** — your interactive rental + neighborhood advisor.

I can help in **English, Hindi, and Marathi** with:
- **Find a home:** *"Pune me 5000 ke andar student room dikhao"* or *"Show 2 BHK family flats in Bangalore under ₹25,000"*
- **Know the area:** *"Tell me about Hinjewadi, Pune — schools, hospitals, markets, transport"*
- **Live environment:** *"What's the weather and air quality in Mumbai right now?"*
- **Renting advice:** *"Security deposit kitna hota hai?"*, agreements, what to check before renting

Tell me a city and what you're looking for. I'll show homes, plot them on the map, and explain the neighborhood around them.`
};

const SAMPLES = [
  'Show houses in Pune under ₹15,000',
  'Pune me 5000 ke andar student room dikhao',
  'Tell me about Hinjewadi, Pune - schools, hospitals, markets',
  'Weather and air quality in Bangalore',
  'Is London good for families? Show flats there',
  'Security deposit kitna hota hai?',
  'PG rooms for students under ₹10,000 in Mumbai',
  'What should I check before renting?'
];

function MarkdownText({ text }) {
  const html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• (.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal mb-1">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/\n/g, '<br />');
  return <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} />;
}

function PropertyCard({ property }) {
  return (
    <Link to={`/properties/${property.id}`} className="block mt-3 p-4 bg-white border border-brand-200 rounded-2xl hover:border-brand-400 hover:shadow-md transition-all group">
      <div className="flex space-x-3">
        {property.primary_image && (
          <img src={property.primary_image} alt={property.title} className="w-24 h-20 object-cover rounded-xl flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">{property.title}</p>
          <p className="text-sm text-slate-500 mt-0.5">{property.locality}, {property.city}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-base font-extrabold text-brand-600">₹{Number(property.monthly_rent).toLocaleString('en-IN')}/mo</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium capitalize">{property.property_type}</span>
            <span className="text-xs text-slate-400">{property.bedrooms} BHK</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AssistantPage() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `assistant-${Date.now()}`);
  const [propertyResults, setPropertyResults] = useState({});
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setMessages(prev => [...prev, { role: 'user', message: msg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatApi.sendMessage(msg, sessionId);
      const data = res.data;
      const idx = messages.length + 1;
      setMessages(prev => [...prev, { role: 'assistant', message: data.reply }]);
      if (data.properties?.length > 0) {
        setPropertyResults(prev => ({ ...prev, [idx]: data.properties }));
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', message: '❌ Unable to process your request. Please ensure the backend server is running on port 5000.' }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setPropertyResults({});
    chatApi.clearHistory(sessionId).catch(() => {});
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
                <span>RentEase AI Assistant</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h1>
              <p className="text-slate-500 text-sm">
                Interactive rental + neighborhood guide • Hindi, Marathi & English • Maps every home + essentials
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center space-x-2 px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition text-sm">
            <RotateCcw className="w-4 h-4" />
            <span>Clear Chat</span>
          </button>
        </div>

        {/* Chat Window */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '520px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center mr-3 mt-1 flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm text-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <MarkdownText text={msg.message} />
                  ) : (
                    <p>{msg.message}</p>
                  )}

                  {msg.role === 'assistant' && propertyResults[idx] && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Matching Properties from Database:</p>
                      {propertyResults[idx].map(p => (
                        <PropertyCard key={p.id} property={p} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

                {loading && (
              <div className="flex justify-start">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center mr-3 flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                    <span>Finding houses, plotting on map, checking schools, hospitals & weather...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Sample Prompts */}
          <div className="px-5 py-3 border-t border-slate-100 bg-white overflow-x-auto">
            <div className="flex space-x-2 pb-1">
              {SAMPLES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="flex-shrink-0 text-xs font-medium px-3 py-2 rounded-full bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 transition disabled:opacity-50 whitespace-nowrap">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask for homes + neighborhood info in any city (English, Hindi, Marathi)..."
                disabled={loading}
                className="flex-1 px-5 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none bg-slate-50 disabled:opacity-60 transition"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="px-5 py-3 bg-brand-600 text-white rounded-2xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-105 active:scale-95 font-semibold flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              Homes shown on map • Schools, hospitals, markets, transport, weather & air quality included
              {' • '}
              <Link to="/properties" className="text-brand-500 hover:text-brand-600">Open full map view</Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

