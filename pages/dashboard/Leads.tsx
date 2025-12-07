import React, { useState } from 'react';
import GlassCard from '../../components/GlassCard';
import LeadDrawer from '../../components/LeadDrawer';
import { Lead } from '../../types';
import { Search, Filter, MoreHorizontal } from 'lucide-react';

const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Ahmed Saleh', phone: '+966 55 000 0001', service: 'Whitening', stage: 'Booked', lastMessage: 'Confirmed for Friday.', createdAt: '2023-10-25T10:00:00Z', notes: 'Patient prefers afternoon slots.' },
  { id: '2', name: 'Fatima Khan', phone: '+966 55 000 0002', service: 'Invisalign', stage: 'Contacted', lastMessage: 'How much does it cost?', createdAt: '2023-10-24T14:30:00Z' },
  { id: '3', name: 'Omar Siddiq', phone: '+966 55 000 0003', service: 'Checkup', stage: 'New', lastMessage: 'Is this real?', createdAt: '2023-10-24T09:15:00Z' },
  { id: '4', name: 'Sara Noor', phone: '+966 55 000 0004', service: 'Implants', stage: 'Lost', lastMessage: 'Too expensive thanks.', createdAt: '2023-10-23T11:20:00Z' },
  { id: '5', name: 'Yusuf Malik', phone: '+966 55 000 0005', service: 'Cleaning', stage: 'Completed', lastMessage: 'Great service!', createdAt: '2023-10-20T16:45:00Z' },
];

const LeadsPage = () => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // TODO: Replace mock leads with Firestore leads collection

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'New': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Contacted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Booked': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Lost': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-white">Lead Management</h2>
         <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder="Search leads..." 
                className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#6A00FF]"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors">
               <Filter size={18} />
               <span>Filter</span>
            </button>
         </div>
       </div>

       <GlassCard className="flex-1 overflow-hidden p-0">
          <div className="overflow-x-auto h-full">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="p-6 font-semibold">Name</th>
                  <th className="p-6 font-semibold">Phone</th>
                  <th className="p-6 font-semibold">Service</th>
                  <th className="p-6 font-semibold">Stage</th>
                  <th className="p-6 font-semibold">Last Message</th>
                  <th className="p-6 font-semibold">Created</th>
                  <th className="p-6 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MOCK_LEADS.map((lead) => (
                  <tr 
                    key={lead.id} 
                    onClick={() => handleRowClick(lead)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6A00FF] to-[#00C8FF] flex items-center justify-center text-xs font-bold text-white">
                          {lead.name.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{lead.name}</span>
                      </div>
                    </td>
                    <td className="p-6 text-gray-400 text-sm">{lead.phone}</td>
                    <td className="p-6 text-gray-300 text-sm">{lead.service}</td>
                    <td className="p-6">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStageColor(lead.stage)}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="p-6 text-gray-400 text-sm truncate max-w-[200px]">{lead.lastMessage}</td>
                    <td className="p-6 text-gray-500 text-xs">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td className="p-6 text-gray-500">
                      <MoreHorizontal size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </GlassCard>

       <LeadDrawer 
         lead={selectedLead} 
         isOpen={isDrawerOpen} 
         onClose={() => setIsDrawerOpen(false)} 
       />
    </div>
  );
};

export default LeadsPage;