import React from 'react';
import GlassCard from '../../components/GlassCard';
import { Save, Upload } from 'lucide-react';

const SettingsPage = () => {
  // TODO: Bind to Firestore 'settings/{clinicId}'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Clinic Settings</h2>
        <p className="text-gray-400">Manage your clinic profile and preferences.</p>
      </div>

      <GlassCard className="space-y-8">
        {/* Clinic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Clinic Name</label>
            <input 
              type="text" 
              defaultValue="ClinicAI Demo Clinic" 
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#6A00FF]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Location Link (Google Maps)</label>
            <input 
              type="text" 
              defaultValue="https://maps.google.com/?q=..." 
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#6A00FF]"
            />
          </div>
        </div>

        {/* Operating Hours */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Operating Hours</label>
            <input 
              type="text" 
              defaultValue="Mon-Fri: 9AM - 6PM, Sat: 10AM - 2PM" 
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#6A00FF]"
            />
        </div>

        {/* Services List */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Services (Comma separated)</label>
          <textarea 
            defaultValue="General Consultation, Dermatology, Pediatrics, Dental Care, Physiotherapy" 
            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#6A00FF] h-24"
          />
        </div>

        {/* Image Upload Mock */}
        <div className="space-y-2">
           <label className="text-sm font-medium text-gray-400">Upload clinic photos or service showcases (optional)</label>
           <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-[#6A00FF]/50 hover:bg-white/5 transition-all cursor-pointer">
              <Upload size={32} className="mb-2" />
              <p>Click to upload or drag and drop</p>
              <p className="text-xs mt-1">PNG, JPG up to 10MB</p>
           </div>
        </div>

        {/* Demo System Information (Simulation Mode) */}
        <div className="space-y-2 pt-6 border-t border-white/10">
           <label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Demo System Information (Simulation Mode)</label>
           <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
              <div className="flex justify-between items-center text-xs">
                 <span className="text-gray-500">API Integration</span>
                 <span className="text-gray-300 font-mono">Simulated</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="text-gray-500">WhatsApp Connection</span>
                 <span className="text-gray-300 font-mono">Simulated</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="text-gray-500">AI Engine</span>
                 <span className="text-purple-300 font-mono">Gemini (Demo Mode)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                 <span className="text-gray-500">Backend Status</span>
                 <span className="text-gray-300 font-mono">Offline (Frontend Only)</span>
              </div>
           </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6A00FF] to-[#00C8FF] text-white font-bold shadow-lg hover:shadow-[0_0_20px_rgba(106,0,255,0.4)] transition-all">
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default SettingsPage;