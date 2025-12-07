import React from 'react';
import { Message } from '../types';
import { Bot, User, Activity } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAi = message.sender === 'ai';
  const isSystem = message.sender === 'system';

  // Helper function to detect language
  const detectLanguage = (text: string): 'arabic' | 'english' => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text) ? 'arabic' : 'english';
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 animate-fade-in-up">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-400 flex items-center gap-2 backdrop-blur-md">
          <Activity size={12} className="text-blue-400" />
          {message.text}
        </span>
      </div>
    );
  }

  const language = detectLanguage(message.text);
  const isArabic = language === 'arabic';

  return (
    <div className={`flex w-full mb-6 ${isAi ? 'justify-end' : 'justify-start'} animate-slide-in`}>
      <div className={`flex flex-col ${isAi ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <div className={`flex ${isAi ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center shrink-0
            ${isAi ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'}
          `}>
            {isAi ? <Bot size={16} /> : <User size={16} />}
          </div>
          
          <div className={`
            p-4 rounded-2xl backdrop-blur-md border relative
            ${isAi 
              ? 'bg-gradient-to-br from-[#6A00FF]/40 to-[#9D4DFF]/10 border-purple-500/30 rounded-br-none text-white' 
              : 'bg-gradient-to-br from-[#00C8FF]/20 to-[#14F1FF]/5 border-blue-500/30 rounded-bl-none text-gray-100'}
          `}>
            <p 
              className={`text-sm leading-relaxed ${isArabic ? 'text-right font-serif' : 'text-left'}`}
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {message.text}
            </p>
            <span className="text-[10px] opacity-50 mt-2 block text-right">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        {/* Detected Language Label */}
        <span className={`text-[9px] text-gray-600 mt-1 uppercase tracking-wider ${isAi ? 'mr-12' : 'ml-12'}`}>
          Detected Language: {language === 'arabic' ? 'Arabic' : 'English'}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;