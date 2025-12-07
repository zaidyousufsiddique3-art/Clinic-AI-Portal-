import React from 'react';
import GlassCard from './GlassCard';

interface ToggleCardProps {
  automation: {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
    sampleMessage: string;
  };
  onToggle: (id: string) => void;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ automation, onToggle }) => {
  return (
    <GlassCard glow={automation.enabled} className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-white">{automation.title}</h3>
        <button
          onClick={() => onToggle(automation.id)}
          className={`
            w-12 h-6 rounded-full p-1 transition-all duration-300 relative
            ${automation.enabled ? 'bg-gradient-to-r from-[#6A00FF] to-[#00C8FF] shadow-[0_0_10px_rgba(106,0,255,0.5)]' : 'bg-gray-700'}
          `}
        >
          <div className={`
            w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300
            ${automation.enabled ? 'translate-x-6' : 'translate-x-0'}
          `} />
        </button>
      </div>
      
      <p className="text-sm text-gray-400 mb-6 flex-grow">
        {automation.description}
      </p>

      <div className="bg-black/30 rounded-lg p-3 border border-white/5">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">Sample Message:</p>
        <p className="text-sm text-purple-200 italic">"{automation.sampleMessage}"</p>
      </div>
    </GlassCard>
  );
};

export default ToggleCard;
