import { useState, useEffect, useRef } from 'react';
import { Message, Lead } from '../types';

const INITIAL_MESSAGES: Message[] = [
  { id: '1', text: 'Incoming lead detected from WhatsApp.', sender: 'system', timestamp: new Date(Date.now() - 60000) },
  { id: '2', text: 'Hi, do you have any openings for teeth whitening this Friday?', sender: 'patient', timestamp: new Date(Date.now() - 10000) },
];

const MOCK_RESPONSES = [
  // 1. AI asks for email (Mandatory Onboarding)
  { text: 'Before we continue, may I have your email so we can send booking confirmations?', sender: 'ai' as const },
  
  // 2. Patient provides email
  { text: 'sure, it is ahmed.saleh@example.com', sender: 'patient' as const },
  
  // 3. System recognizes email
  { text: 'System: Email captured and verified.', sender: 'system' as const },
  
  // 4. AI proceeds after email is captured
  { text: 'Thank you. I have updated your profile. Regarding your inquiry, we have a slot at 4:30 PM on Friday.', sender: 'ai' as const },
  
  // 5. Patient responds in Arabic (RTL Test)
  { text: 'ممتاز، هذا الوقت يناسبني جداً. شكراً لك.', sender: 'patient' as const },
  
  // 6. AI responds in Arabic (Language Switching)
  { text: 'رائع! لقد حجزت لك هذا الموعد مبدئيًا. ستصلك رسالة تأكيد قريبًا.', sender: 'ai' as const },
  
  // 7. System update
  { text: 'System: Lead stage updated to "Booked"', sender: 'system' as const },
];

export const useDemoLiveFeed = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [activeLead, setActiveLead] = useState<Lead>({
    id: 'live-1',
    name: 'New Lead (Detecting...)',
    phone: '+966 55 123 4567',
    email: 'Not Provided',
    service: 'Detecting Service Interest...',
    stage: 'New',
    lastMessage: 'Hi, do you have any openings...',
    createdAt: new Date().toISOString()
  });

  const responseIndex = useRef(0);

  // Frontend placeholder function for email capture
  const handleEmailCapture = (text: string) => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const match = text.match(emailRegex);
    if (match) {
        setActiveLead(prev => ({
            ...prev,
            email: match[0],
            name: 'Ahmed Saleh', // Simulating ID resolution
            stage: 'Contacted'
        }));
        return true;
    }
    return false;
  };

  useEffect(() => {
    // TODO: Replace simulated messages with Firestore listener triggered by WhatsApp webhook
    const interval = setInterval(() => {
      if (responseIndex.current < MOCK_RESPONSES.length) {
        const nextMsg = MOCK_RESPONSES[responseIndex.current];
        
        const newMessage: Message = {
          id: Date.now().toString(),
          text: nextMsg.text,
          sender: nextMsg.sender,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);

        // Logic triggers
        if (nextMsg.sender === 'patient') {
             // Simulate email capture check
             handleEmailCapture(nextMsg.text);
        }
        
        if (nextMsg.text.includes('Booked') || nextMsg.text.includes('حجزت')) {
             setActiveLead(prev => ({ ...prev, stage: 'Booked' }));
        }

        responseIndex.current += 1;
      }
    }, 4000); // New message every 4 seconds for demo pace

    return () => clearInterval(interval);
  }, []);

  return { messages, activeLead };
};