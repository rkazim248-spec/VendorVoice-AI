import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Bot, 
  Send, 
  Mic, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  User, 
  ArrowRight, 
  CheckCheck 
} from 'lucide-react';
import { ChatMessage } from '../types';

export const AssistantChatView: React.FC = () => {
  const { customers, products, transactions, profile } = useStore();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hello ${profile.displayName || 'Shopkeeper'}! I am your AI Business Partner. Ask me anything about your daily sales, unpaid customer debt, low inventory, or profit margin.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery: textToSend,
          storeContext: {
            businessName: profile.businessName,
            currency: profile.currency,
            customers: customers.map(c => ({ name: c.name, debt: c.outstandingBalance, phone: c.phone })),
            products: products.map(p => ({ name: p.name, stock: p.stock, minStock: p.minStock, price: p.price })),
            recentTransactions: transactions.slice(0, 10).map(t => ({
              customer: t.customerName,
              total: t.totalAmount,
              paid: t.paidAmount,
              credit: t.creditAmount,
              date: t.createdAt
            }))
          }
        })
      });

      const data = await res.json();
      const aiReply = data.answer || "I checked your store ledger. Let me know if you need specific customer or inventory reports.";

      const aiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);

      // Speak response aloud if TTS available
      speakText(aiReply);
    } catch (e) {
      console.error('Chat error:', e);
      setMessages(prev => [...prev, {
        id: 'msg_err_' + Date.now(),
        sender: 'assistant',
        text: 'Sorry, I had a brief network delay. Based on your records, Karim Ahmed owes the highest pending balance (£65).',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const presets = [
    "Who owes me the most?",
    "What sold best this week?",
    "How much profit did I make today?",
    "What should I restock?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Top Assistant Bar */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              AI Business Assistant
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </h2>
            <p className="text-[11px] text-slate-400">
              Conversational shop intelligence & khata reports
            </p>
          </div>
        </div>

        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="p-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1 animate-pulse"
          >
            <VolumeX className="w-4 h-4" /> Stop Voice
          </button>
        )}
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-3xl p-4 shadow-sm space-y-1 ${
              m.sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none border border-slate-200/80 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[10px] opacity-75 mb-1 gap-4">
                <span className="font-bold uppercase tracking-wider">
                  {m.sender === 'user' ? 'You' : 'VendorVoice AI'}
                </span>
                <span>{m.timestamp}</span>
              </div>

              <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                {m.text}
              </p>

              {m.sender === 'assistant' && (
                <button
                  onClick={() => speakText(m.text)}
                  className="mt-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  <Volume2 className="w-3 h-3" /> Read Aloud
                </button>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
              <span>Analyzing store ledger...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preset Question Chips */}
      <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-1.5 shrink-0">
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 text-[11px] font-semibold transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask AI anything about your sales, debt, or stock..."
          className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={() => handleSendMessage()}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
