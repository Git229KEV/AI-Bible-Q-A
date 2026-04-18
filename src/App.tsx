/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Send, 
  History, 
  User as UserIcon, 
  LogOut, 
  MessageSquare, 
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Globe,
  Loader2,
  Trash2
} from 'lucide-react';
import { Message, User, AuthState } from './types';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Components ---

const Navbar = ({ 
  user, 
  onLogout, 
  onToggleHistory 
}: { 
  user: User | null; 
  onLogout: () => void; 
  onToggleHistory: () => void;
}) => (
  <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <div className="bg-stone-900 p-2 rounded-xl">
        <Book className="w-5 h-5 text-stone-50" />
      </div>
      <div>
        <h1 className="font-serif text-xl font-semibold tracking-tight text-stone-900">AI Bible Q&A</h1>
        <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Contextual Engine</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      {user ? (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-stone-900">{user.username}</span>
            <button 
              onClick={onLogout}
              className="text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center border border-stone-200">
            <UserIcon className="w-5 h-5 text-stone-600" />
          </div>
        </div>
      ) : (
        <button 
          onClick={() => window.location.href = '#auth'}
          className="bg-stone-900 text-stone-50 px-4 py-2 rounded-full text-sm font-medium hover:bg-stone-800 transition-all shadow-sm active:scale-95"
        >
          Sign In
        </button>
      )}
      <button 
        onClick={onToggleHistory}
        className="p-2 hover:bg-stone-100 rounded-full transition-colors relative"
      >
        <History className="w-5 h-5 text-stone-600" />
      </button>
    </div>
  </nav>
);

const AuthForm = ({ onAuthSuccess }: { onAuthSuccess: (user: User, token: string) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/login' : '/api/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.user || { id: data.id, username }, data.token);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth" className="fixed inset-0 bg-stone-50/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[32px] shadow-2xl shadow-stone-200/50 border border-stone-200 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-medium text-stone-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-stone-500">
            {isLogin ? 'Access your personal chat history' : 'Start your Bible Q&A journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-1 block ml-4">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-5 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all font-sans"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-1 block ml-4">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-5 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all font-sans"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-xs py-2 px-4 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-stone-50 py-4 rounded-2xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-stone-100">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
        <button 
           onClick={() => window.location.hash = ''}
           className="mt-4 w-full text-stone-400 text-xs uppercase tracking-widest font-bold hover:text-stone-600 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`max-w-[85%] ${isUser ? 'bg-stone-900 text-stone-50' : 'bg-white text-stone-900 shadow-sm border border-stone-100'} rounded-[24px] px-5 py-4`}>
        <div className="flex items-center gap-2 mb-2 opacity-60">
          {isUser ? (
             <UserIcon className="w-3 h-3" />
          ) : (
             <Sparkles className="w-3 h-3" />
          )}
          <span className="text-[10px] uppercase tracking-widest font-bold">
            {isUser ? 'You' : 'Assistant'}
          </span>
          {!isUser && message.source && (
            <>
              <span className="text-[10px]">•</span>
              <span className={`text-[10px] flex items-center gap-0.5 ${message.source === 'local' ? 'text-emerald-500' : 'text-blue-500'}`}>
                {message.source === 'local' ? <ShieldCheck className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                {message.source}
              </span>
              {message.confidence && (
                <span className="text-[10px] opacity-60">({(message.confidence * 100).toFixed(0)}%)</span>
              )}
            </>
          )}
        </div>
        <div className={`text-base leading-relaxed ${!isUser ? 'font-serif' : 'font-sans'}`}>
          {message.text}
        </div>
        {message.timestamp && (
          <div className="mt-2 text-[9px] opacity-40 uppercase tracking-tighter">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem('bible_auth');
    return saved ? JSON.parse(saved) : { user: null, token: null, sessionId: `guest_${Math.random().toString(36).substr(2, 9)}` };
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('bible_auth', JSON.stringify(authState));
    fetchHistory();
    
    const handleHashChange = () => {
      setShowAuth(window.location.hash === '#auth');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [authState.token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchHistory = async () => {
    const headers: any = { 'Content-Type': 'application/json' };
    if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;
    
    try {
      const res = await fetch(`/api/history?session_id=${authState.sessionId}`, { headers });
      const data = await res.json();
      if (data.history) setMessages(data.history);
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (authState.token) headers['Authorization'] = `Bearer ${authState.token}`;

      // 1. Get Context and History from Server
      const contextRes = await fetch(`/api/chat-context?question=${encodeURIComponent(currentInput)}&session_id=${authState.sessionId}`, {
        headers
      });
      const contextData = await contextRes.json();
      
      if (!contextRes.ok) throw new Error(contextData.error || 'Failed to retrieve context');

      const { context, history, conversation_id } = contextData;

      // 2. Call Gemini on Frontend
      const prompt = `
        You are a Bible Q&A assistant. 
        Answer ONLY Bible related questions.
        
        CONTEXT FROM BIBLE DATASET:
        ${context}

        CONVERSATION HISTORY:
        ${JSON.stringify(history)}

        USER QUESTION:
        ${currentInput}

        If the context above is sufficient, answer based on it. 
        If not, use your general Bible knowledge but specify the source as "online".
        Return a JSON object: { "answer": "...", "source": "local" | "online", "confidence": 0.0-1.0 }
      `;

      const aiResult = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const aiResponse = JSON.parse(aiResult.text || "{}");
      const { answer, source, confidence } = aiResponse;

      if (!answer) throw new Error("AI could not formulate a response.");

      // 3. Save Answer to Server
      await fetch('/api/save-chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversation_id,
          question: currentInput,
          answer,
          source,
          confidence
        })
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: answer,
        source,
        confidence,
        timestamp: new Date().toISOString()
      }]);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "Forgive me, I encountered an error: " + (err.message || "Unknown processing error") 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const onAuthSuccess = (user: User, token: string) => {
    setAuthState(prev => ({ ...prev, user, token }));
    window.location.hash = '';
  };

  const handleLogout = () => {
    setAuthState(prev => ({ ...prev, user: null, token: null }));
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
      <Navbar 
        user={authState.user} 
        onLogout={handleLogout} 
        onToggleHistory={() => setShowHistory(!showHistory)} 
      />

      <main className="max-w-3xl mx-auto pt-8 pb-32 px-4 min-h-[calc(100vh-80px)] relative">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-20 text-center"
          >
            <div className="w-16 h-16 bg-white rounded-[24px] shadow-sm flex items-center justify-center mb-6 border border-stone-100">
              <Sparkles className="w-8 h-8 text-stone-400" />
            </div>
            <h2 className="font-serif text-4xl mb-3 font-medium">How can I assist your study?</h2>
            <p className="text-stone-500 max-w-sm mx-auto mb-10 text-sm leading-relaxed">
              Ask about any verse, character, or theme. I combine local dataset retrieval with AI reasoning.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              {[
                "Explain Psalm 23",
                "What does Genesis 1:1 mean?",
                "Tell me about Paul's journeys",
                "Verses about fear and peace"
              ].map(q => (
                <button 
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="bg-white border border-stone-200 p-4 rounded-2xl text-left text-sm hover:border-stone-400 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                >
                  <span className="text-stone-700 font-medium">{q}</span>
                  <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="pb-4">
            {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start mb-6"
              >
                <div className="bg-white rounded-[24px] px-6 py-4 shadow-sm border border-stone-100 italic font-serif text-stone-400 flex items-center gap-3">
                  <div className="flex gap-1">
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>.</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
                    <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
                  </div>
                  Retrieving context...
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-stone-50/80 backdrop-blur-lg border-t border-stone-200 p-4 z-40">
        <form 
          onSubmit={handleSend}
          className="max-w-3xl mx-auto flex items-center gap-3 bg-white border border-stone-200 rounded-[32px] p-2 shadow-lg shadow-stone-200/50"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the Bible..."
            className="flex-1 bg-transparent px-6 py-3 text-stone-900 focus:outline-none placeholder:text-stone-300 font-medium"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-stone-900 text-stone-50 p-3 rounded-full hover:bg-stone-800 transition-all disabled:opacity-20 active:scale-90"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-[10px] text-center mt-2 text-stone-400 font-bold uppercase tracking-[0.2em]">
          Hybrid RAG Protocol • KJV Lite Dataset
        </p>
      </div>

      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowHistory(false)}
               className="fixed inset-0 bg-stone-900/10 backdrop-blur-sm z-[60]" 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[70] border-l border-stone-200"
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif text-2xl font-medium">Session History</h3>
                  <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4 text-stone-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {messages.length === 0 ? (
                    <div className="text-center py-20 text-stone-300 italic">No messages found</div>
                  ) : (
                    messages.filter(m => m.role === 'user').map((m, i) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                          <MessageSquare className="w-4 h-4 mt-1 text-stone-300 group-hover:text-stone-900 transition-colors" />
                          <div>
                            <p className="text-sm font-medium text-stone-700 line-clamp-2">{m.text}</p>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-stone-300 mt-1 block">
                              {m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'Active Session'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && <AuthForm onAuthSuccess={onAuthSuccess} />}
      </AnimatePresence>
    </div>
  );
}

