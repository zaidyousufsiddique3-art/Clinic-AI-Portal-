import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Zap, BarChart2, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Live Feed', path: '/dashboard/live' },
    { icon: Users, label: 'Leads', path: '/dashboard/leads' },
    { icon: Zap, label: 'Automations', path: '/dashboard/automations' },
    { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <aside className="w-[260px] h-screen sticky top-0 hidden md:flex flex-col p-6 z-30">
      {/* Glass Container */}
      <div className="flex-1 rounded-3xl backdrop-blur-xl bg-[#0D1021]/60 border border-white/[0.08] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-32 bg-[#6A00FF]/20 blur-[60px] pointer-events-none" />

        {/* Logo */}
        <div className="p-6 mb-2">
          <div className="flex items-center gap-2">
             <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#14F1FF] to-[#6A00FF] drop-shadow-[0_0_8px_rgba(106,0,255,0.3)]">
               ClinicAI
             </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                ${isActive 
                  ? 'bg-gradient-to-r from-[#6A00FF]/20 to-transparent text-white border border-[#6A00FF]/30 shadow-[0_0_15px_rgba(106,0,255,0.2)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-[#14F1FF] shadow-[0_0_10px_#14F1FF]" />}
                  <item.icon size={20} className={isActive ? 'text-[#14F1FF]' : 'group-hover:text-gray-300'} />
                  <span className="font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;