export interface User {
  email: string;
  name: string;
  avatar: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'patient' | 'ai' | 'system';
  timestamp: Date;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  service: string;
  stage: 'New' | 'Contacted' | 'Booked' | 'Completed' | 'Lost';
  lastMessage: string;
  createdAt: string;
  notes?: string;
}

export interface Automation {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  sampleMessage: string;
}

export interface ChartData {
  name: string;
  value: number;
}