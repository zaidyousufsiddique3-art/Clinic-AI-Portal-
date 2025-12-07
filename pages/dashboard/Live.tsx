import React, { useEffect, useRef } from 'react';
import { useDemoLiveFeed } from '../../hooks/useDemoLiveFeed';
import GlassCard from '../../components/GlassCard';
import MessageBubble from '../../components/MessageBubble';
import { Phone, Calendar, BadgeCheck, ArrowRight, Mail, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LivePage = () => {
  const { messages, activeLead } = useDemoLiveFeed();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isEmailMissing = !activeLead.email || activeLead.email === 'Not Provided';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      {/* Panel A: Live Chat Feed */}
      <GlassCard className="lg:col-span-2 flex flex-col h-full relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            Live Conversation Stream
          </h2>
          <span className="text-xs text-gray-400 font-mono">ENCRYPTED :: REAL-TIME</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Onboarding Status Indicator */}
        {isEmailMissing && (
           <div className="mt-4 mb-1 px-1 flex items-center gap-2 animate-pulse">
              <AlertCircle size={12} className="text-[#14F1FF]" />
              <span className="text-xs text-[#14F1FF]/80 italic">Awaiting email to continue conversation...</span>
           </div>
        )}

        {/* Badge */}
        <div className="mt-2 px-1">
           <span className="inline-block px-2 py-0.5 rounded-full bg-[#6A00FF]/10 border border-[#6A00FF]/20 text-[10px] text-purple-300 shadow-[0_0_10px_rgba(106,0,255,0.1)]">
              WhatsApp Simulation Mode — Messages Are Not Real
           </span>
        </div>

        {/* Input Simulation Area */}
        <div className="mt-2 pt-2 border-t border-white/5">
           <div className="h-12 bg-black/20 rounded-xl border border-white/5 flex items-center px-4">
              <span className="text-gray-600 text-sm animate-pulse">
                {isEmailMissing ? 'AI is requesting email...' : 'AI is typing response...'}
              </span>
           </div>
        </div>
      </GlassCard>

      {/* Panel B: Lead Snapshot */}
      <div className="flex flex-col gap-6 h-full">
        <GlassCard className="flex-1" glow>
           <h3 className="text-sm uppercase text-gray-500 font-bold tracking-wider mb-6">Active Context Detected</h3>
           
           <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6A00FF] to-[#00C8FF] p-1 shadow-[0_0_30px_rgba(106,0,255,0.4)] mb-4">
                  <img src="https://picsum.photos/300" alt="Lead" className="w-full h-full rounded-full border-2 border-[#0D1021]" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center">{activeLead.name}</h2>
              <p className="text-purple-400 text-sm mt-1">{activeLead.phone}</p>
           </div>

           <div className="space-y-4">
             {/* Email Field */}
             <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 w-full">
                   <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg"><Mail size={18} /></div>
                   <div className="flex-1 min-w-0">
                     <p className="text-xs text-gray-400">Email</p>
                     <p className={`text-white font-medium truncate ${isEmailMissing ? 'text-gray-500 italic' : ''}`}>
                       {activeLead.email || 'Not Provided'}
                     </p>
                   </div>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Calendar size={18} /></div>
                   <div>
                     <p className="text-xs text-gray-400">Service Interest</p>
                     <p className="text-white font-medium">{activeLead.service}</p>
                   </div>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><BadgeCheck size={18} /></div>
                   <div>
                     <p className="text-xs text-gray-400">Current Stage</p>
                     <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                        {activeLead.stage}
                     </span>
                   </div>
                </div>
             </div>
           </div>

           <button 
             onClick={() => navigate('/dashboard/leads')}
             className="w-full mt-8 py-3 rounded-xl border border-[#6A00FF] text-[#6A00FF] hover:bg-[#6A00FF] hover:text-white transition-all font-medium flex items-center justify-center gap-2 group"
           >
             Open Lead Record
             <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </button>
        </GlassCard>

        <GlassCard className="h-1/3 flex flex-col justify-center items-center bg-gradient-to-br from-[#6A00FF]/10 to-transparent">
             <h4 className="text-4xl font-bold text-white mb-1">98%</h4>
             <p className="text-sm text-gray-400">AI Confidence Score</p>
        </GlassCard>
      </div>
    </div>
  );
};

export default LivePage;