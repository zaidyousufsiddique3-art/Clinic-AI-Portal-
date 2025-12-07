import React from 'react';
import StatCard from '../../components/StatCard';
import GlassCard from '../../components/GlassCard';
import { Users, Clock, Calendar, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const LEAD_DATA = [
  { name: 'Mon', leads: 4 },
  { name: 'Tue', leads: 7 },
  { name: 'Wed', leads: 5 },
  { name: 'Thu', leads: 12 },
  { name: 'Fri', leads: 9 },
  { name: 'Sat', leads: 6 },
  { name: 'Sun', leads: 3 },
];

const SERVICE_DATA = [
  { name: 'Whitening', value: 35 },
  { name: 'Invisalign', value: 25 },
  { name: 'Checkup', value: 20 },
  { name: 'Implants', value: 10 },
  { name: 'Cleaning', value: 10 },
];

const AnalyticsPage = () => {
  // TODO: Replace with aggregated Firestore analytics

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
         <div className="text-xs text-gray-500 font-mono">LAST 7 DAYS</div>
      </div>

      {/* Row 1: Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Leads Today" 
          value="14" 
          trend="+20%" 
          trendUp={true} 
          icon={<Users size={20} />} 
        />
        <StatCard 
          title="Avg Response Time" 
          value="45s" 
          trend="-15%" 
          trendUp={true} 
          icon={<Clock size={20} />} 
        />
        <StatCard 
          title="Appointments" 
          value="32" 
          trend="+5%" 
          trendUp={true} 
          icon={<Calendar size={20} />} 
        />
        <StatCard 
          title="Conversion Rate" 
          value="37%" 
          trend="-2%" 
          trendUp={false} 
          icon={<TrendingUp size={20} />} 
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        <GlassCard className="flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Leads Volume</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={LEAD_DATA}>
                <defs>
                   <linearGradient id="colorLeads" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#6A00FF" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00C8FF" stopOpacity={0.8}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0D1021', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="leads" stroke="url(#colorLeads)" strokeWidth={3} dot={{r: 4, fill: '#14F1FF'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Top Services Interest</h3>
          <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SERVICE_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" hide />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{fontSize: 12}} width={80} tickLine={false} axisLine={false} />
                <Tooltip 
                   cursor={{fill: 'rgba(255,255,255,0.05)'}}
                   contentStyle={{ backgroundColor: '#0D1021', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}
                   itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#6A00FF" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;