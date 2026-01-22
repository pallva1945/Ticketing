import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Brain, Ticket } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    let parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;
    
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.substring(0, boldMatch.index));
        }
        parts.push(<strong key={`b-${lineIdx}-${keyIdx++}`} className="font-semibold text-gray-900">{boldMatch[1]}</strong>);
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
      } else {
        parts.push(remaining);
        remaining = '';
      }
    }
    
    if (line.startsWith('- ')) {
      return <div key={lineIdx} className="flex gap-2 ml-2"><span className="text-red-500">•</span><span>{parts.slice(1)}</span></div>;
    }
    if (line.match(/^\d+\.\s/)) {
      return <div key={lineIdx} className="ml-2">{parts}</div>;
    }
    
    return <div key={lineIdx}>{parts.length > 0 ? parts : '\u00A0'}</div>;
  });
};

interface ChatInterfaceProps {
  contextData: string;
  initialPrompt?: string;
  onPromptConsumed?: () => void;
}

// Exported for use in App.tsx to maintain visual consistency
export const AIAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-24 h-24'
  };
  
  const iconSizes = {
    sm: 14,
    md: 20,
    lg: 32
  };
  
  const ticketSizes = {
    sm: 10,
    md: 14,
    lg: 22
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      {/* Outer glowing ring with gradient */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 animate-[spin_4s_linear_infinite] opacity-70 blur-[2px]"></div>
      
      {/* Secondary spinning ring */}
      <div className="absolute inset-0.5 border-2 border-dashed border-white/40 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
      
      {/* Dark inner background */}
      <div className="absolute inset-1.5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-full shadow-xl"></div>
      
      {/* Neural network pattern overlay */}
      <div className="absolute inset-2 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.3)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(239,68,68,0.3)_0%,transparent_50%)]"></div>
      </div>
      
      {/* Brain icon - center */}
      <div className="relative z-10 flex items-center justify-center">
        <Brain size={iconSizes[size]} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
      </div>
      
      {/* Ticket badge - bottom right */}
      <div className="absolute -bottom-0.5 -right-0.5 z-20">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500 blur-md rounded-full animate-pulse opacity-60"></div>
          <div className="relative bg-gradient-to-br from-red-500 to-red-700 rounded-full p-1 border-2 border-white/80 shadow-lg">
            <Ticket size={ticketSizes[size]} className="text-white" style={{ transform: 'rotate(-15deg)' }} />
          </div>
        </div>
      </div>
      
      {/* Sparkle accent - top left */}
      <div className="absolute -top-0.5 -left-0.5 z-20">
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400 blur-sm rounded-full animate-ping opacity-40"></div>
          <div className="relative bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full p-0.5 border border-white/80">
            <Sparkles size={ticketSizes[size] - 2} className="text-yellow-800" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ contextData, initialPrompt, onPromptConsumed }) => {
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
  const initialPromptSent = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current && !isLoading) {
      initialPromptSent.current = true;
      const sendInitialPrompt = async () => {
        const userMsg: ChatMessage = {
          role: 'user',
          text: initialPrompt,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);
        try {
          const responseText = await sendMessageToGemini(initialPrompt, contextData);
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
          onPromptConsumed?.();
        }
      };
      sendInitialPrompt();
    }
  }, [initialPrompt, contextData, isLoading, onPromptConsumed]);

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
                   <Brain size={14} className="text-red-600" />
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Consultant</span>
                </div>
              )}
              {msg.role === 'user' && (
                <div className="flex items-center justify-end gap-2 mb-2 pb-2 border-b border-gray-50">
                   <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Director</span>
                </div>
              )}
              
              <div className="text-sm leading-relaxed text-gray-700">{renderMarkdown(msg.text)}</div>
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