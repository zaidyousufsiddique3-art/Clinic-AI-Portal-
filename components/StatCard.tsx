import React from 'react';
import GlassCard from './GlassCard';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendUp, icon }) => {
  return (
    <GlassCard className="hover:bg-white/[0.08] group cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-white/5 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors text-gray-400 border border-white/5">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
        {value}
      </div>
    </GlassCard>
  );
};

export default StatCard;
