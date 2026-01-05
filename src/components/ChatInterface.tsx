import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { PV_LOGO_URL } from '../constants';

interface ChatInterfaceProps {
  contextData: string;
}

// Exported for use in App.tsx to maintain visual consistency
export const AIAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      {/* Outer spinning ring */}
      <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
      
      {/* Pulsing glow layer */}
      <div className="absolute inset-1 bg-white/20 rounded-full animate-pulse"></div>
      
      {/* Inner Gradient Core */}
      <div className="absolute inset-2 bg-gradient-to-br from-white to-gray-200 rounded-full shadow-lg flex items-center justify-center z-10 overflow-hidden border border-white/50">
         <img 
            src={PV_LOGO_URL} 
            alt="AI Avatar" 
            className="w-full h-full object-contain p-1 animate-[pulse_3s_infinite]" 
         />
         {/* Glossy shine effect */}
         <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/80 to-transparent opacity-50"></div>
      </div>

      {/* Satellite particle */}
      <div className="absolute -top-1 -right-1">
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400 blur-sm rounded-full animate-pulse"></div>
          <div className="relative bg-yellow-300 rounded-full p-0.5 border border-white">
            <Sparkles size={size === 'sm' ? 8 : 12} className="text-yellow-700" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ contextData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Greetings. I am your AI Consultant. I have analyzed the current ticket sales and zone efficiency. How can we optimize yield for the next match?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(userMsg.text, contextData);
      
      const botMsg: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 to-red-600 p-4 text-white flex items-center gap-4 shadow-md relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        
        <AIAvatar size="md" />
        
        <div className="relative z-10">
          <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
            AI Consultant
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 border border-white/20 text-white uppercase tracking-wider">
              Live
            </span>
          </h3>
          <p className="text-xs text-red-100 font-medium">Strategic Board Advisor • PV Engine</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-white border border-red-100 text-gray-800 rounded-br-none' 
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
            }`}>
              {msg.role === 'model' && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-50">
                   <BrainCircuit size={14} className="text-red-600" />
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consultant</span>
                </div>
              )}
              {msg.role === 'user' && (
                <div className="flex items-center justify-end gap-2 mb-2 pb-2 border-b border-gray-50">
                   <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Director</span>
                </div>
              )}
              
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">{msg.text}</div>
              <div className="text-[10px] mt-2 text-right text-gray-300 font-medium">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="relative">
                 <div className="absolute inset-0 bg-red-100 rounded-full animate-ping"></div>
                 <Loader2 className="animate-spin text-red-600 relative z-10" size={18} />
              </div>
              <span className="text-sm text-gray-500 font-medium animate-pulse">Consultant is analyzing scenarios...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex gap-2 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask for strategic advice, revenue projections, or ticket pricing adjustment..."
            className="w-full resize-none rounded-xl border border-gray-200 pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm min-h-[50px] max-h-[120px] bg-gray-50 focus:bg-white transition-all"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 p-2 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-lg hover:shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex justify-center mt-2">
            <p className="text-[10px] text-gray-300 font-medium flex items-center gap-1">
                <Sparkles size={8} /> AI insights are based on available historical data.
            </p>
        </div>
      </div>
    </div>
  );
};