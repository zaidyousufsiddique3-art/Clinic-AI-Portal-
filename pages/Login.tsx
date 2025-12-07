import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const Login = () => {
  const [email, setEmail] = useState('demo@clinicai.com');
  const [password, setPassword] = useState('Demo@1234');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard/live');
    } else {
      setError('Invalid credentials. Use demo@clinicai.com / Demo@1234');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0D1021] overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#6A00FF]/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00C8FF]/10 rounded-full blur-[120px]" />

      <GlassCard className="w-full max-w-md mx-4 relative z-10 p-8 border-white/10" glow>
        <div className="text-center mb-8">
           <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14F1FF] to-[#6A00FF] mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(106,0,255,0.4)]">
                <span className="text-3xl font-bold text-white">C</span>
           </div>
           <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">ClinicAI Portal</h1>
           <p className="text-gray-400">Next-Gen Patient Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#14F1FF] transition-colors" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#14F1FF]/50 focus:ring-1 focus:ring-[#14F1FF]/50 transition-all"
                placeholder="Email Address"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#14F1FF] transition-colors" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#14F1FF]/50 focus:ring-1 focus:ring-[#14F1FF]/50 transition-all"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6A00FF] to-[#00C8FF] text-white font-bold text-lg shadow-[0_0_20px_rgba(106,0,255,0.3)] hover:shadow-[0_0_30px_rgba(106,0,255,0.5)] hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Access Demo'}
            {!isSubmitting && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-xs text-gray-500">
             Secure simulation environment. <br/> Access restricted to authorized personnel.
           </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default Login;
