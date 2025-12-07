import React, { useState } from 'react';
import ToggleCard from '../../components/ToggleCard';
import { Automation } from '../../types';

const AutomationsPage = () => {
  // TODO: Persist automation settings to Firestore
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: '1',
      title: 'Lead Follow-Up',
      description: 'Automatically engages new leads within 30 seconds of inquiry receipt via WhatsApp or SMS.',
      enabled: true,
      sampleMessage: "Hi there! Thanks for contacting our clinic. I'm your virtual assistant. How can I help you today?"
    },
    {
      id: '2',
      title: 'Appointment Reminders',
      description: 'Sends confirmation requests 24 hours before scheduled appointments to reduce no-shows.',
      enabled: true,
      sampleMessage: "Hi! This is a reminder about your upcoming appointment. Reply YES to confirm or RESCHEDULE to change."
    },
    {
      id: '3',
      title: 'Review Requests',
      description: 'Sends a Google Review link 2 hours after a completed appointment.',
      enabled: false,
      sampleMessage: "Hope your visit went well! Would you mind leaving us a quick review? It helps us a lot: [Link]"
    },
    {
      id: '4',
      title: 'No-Show Recovery',
      description: 'Automatically attempts to re-book patients who missed their appointment.',
      enabled: false,
      sampleMessage: "We noticed you missed your appointment. Would you like to reschedule?"
    }
  ]);

  const handleToggle = (id: string) => {
    setAutomations(prev => prev.map(auto => 
      auto.id === id ? { ...auto, enabled: !auto.enabled } : auto
    ));
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI Automations</h2>
        <p className="text-gray-400">Configure how the AI interacts with your patients automatically.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map(auto => (
          <ToggleCard key={auto.id} automation={auto} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
};

export default AutomationsPage;