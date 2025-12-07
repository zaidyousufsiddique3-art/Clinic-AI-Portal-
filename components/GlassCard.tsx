import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div
      className={`
        relative backdrop-blur-xl bg-white/[0.06] border border-white/[0.14] rounded-2xl p-6
        shadow-[0_0_12px_rgba(138,43,255,0.1)]
        transition-all duration-300
        ${glow ? 'shadow-[0_0_20px_rgba(138,43,255,0.3)] border-purple-500/30' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
