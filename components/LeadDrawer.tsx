import React from 'react';
import { X, Phone, User, Calendar, MessageSquare, Clock } from 'lucide-react';
import { Lead } from '../types';

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, isOpen, onClose }) => {
  if (!lead) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-[400px] z-50
        bg-[#0D1021]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-transparent">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Lead Details</h2>
              <span className="text-xs text-gray-400">ID: {lead.id}</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Profile Section */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6A00FF] to-[#00C8FF] flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_15px_rgba(106,0,255,0.4)]">
                {lead.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{lead.name}</h3>
                <div className="flex items-center gap-2 text-gray-400 mt-1">
                  <Phone size={14} />
                  <span className="text-sm">{lead.phone}</span>
                </div>
              </div>
            </div>

            {/* Stage Selector (Mock) */}
            <div>
              <label className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-2 block">Current Stage</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                defaultValue={lead.stage}
              >
                <option value="New">New Lead</option>
                <option value="Contacted">Contacted</option>
                <option value="Booked">Appointment Booked</option>
                <option value="Completed">Completed</option>
                <option value="Lost">Lost</option>
              </select>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                 <div className="flex items-center gap-2 text-purple-400 mb-2">
                   <User size={16} />
                   <span className="text-xs font-medium">Service Interest</span>
                 </div>
                 <p className="text-white font-medium">{lead.service}</p>
               </div>
               <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                 <div className="flex items-center gap-2 text-blue-400 mb-2">
                   <Calendar size={16} />
                   <span className="text-xs font-medium">Created</span>
                 </div>
                 <p className="text-white font-medium">{new Date(lead.createdAt).toLocaleDateString()}</p>
               </div>
            </div>

            {/* Conversation Summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                 <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Latest Activity</label>
                 <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> Just now
                 </span>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#6A00FF] to-[#00C8FF]" />
                 <div className="flex gap-3">
                    <MessageSquare size={18} className="text-gray-400 mt-1 shrink-0" />
                    <div>
                        <p className="text-sm text-gray-300 italic">"{lead.lastMessage}"</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Notes */}
             <div>
              <label className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-2 block">Clinical Notes</label>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 min-h-[100px] text-sm"
                placeholder="Add internal notes about this patient..."
                defaultValue={lead.notes}
              />
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-6 border-t border-white/10">
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6A00FF] to-[#00C8FF] text-white font-bold shadow-lg hover:shadow-[0_0_20px_rgba(106,0,255,0.4)] transition-all transform hover:-translate-y-1">
              Book Appointment
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadDrawer;
