import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Bell } from 'lucide-react';

const HeaderBar = () => {
  const { user } = useAuth();

  return (
    <header className="h-20 px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm bg-[#0D1021]/80 border-b border-white/5">
      {/* Left: Clinic Info */}
      <div className="flex flex-col justify-center">
        <h1 className="text-white font-medium tracking-wide leading-tight">ClinicAI Demo Clinic</h1>
        <p className="text-[10px] text-gray-400 font-light tracking-wide mt-0.5">AI-Powered Patient Communication & Lead Management</p>
      </div>

      {/* Center: AI Status */}
      <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
        <div className="relative flex items-center justify-center w-3 h-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </div>
        <span className="text-xs font-mono text-green-400 tracking-wider">AI STATUS: ONLINE • 98% UPTIME</span>
      </div>

      {/* Right: Profile & Actions */}
      <div className="flex items-center gap-6">
        {/* Simulation Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#6A00FF]/10 border border-[#6A00FF]/30 backdrop-blur-md shadow-[0_0_10px_rgba(106,0,255,0.1)]">
           <span className="w-1.5 h-1.5 rounded-full bg-[#6A00FF] animate-pulse"></span>
           <span className="text-[10px] font-medium text-[#c4b5fd] tracking-wide uppercase">Simulation Mode — Demo Data Active</span>
        </div>

        <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#6A00FF] rounded-full border border-black"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-500">Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6A00FF] to-[#00C8FF] p-[2px] cursor-pointer hover:shadow-[0_0_15px_rgba(106,0,255,0.4)] transition-all">
               <img 
                 src={user?.avatar || "https://picsum.photos/200"} 
                 alt="Profile" 
                 className="w-full h-full rounded-full object-cover border-2 border-[#0D1021]"
               />
            </div>
            <ChevronDown size={16} className="text-gray-500 cursor-pointer" />
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;