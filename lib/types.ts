export type MessageType = 'bot' | 'user';

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  options?: string[];
}

export interface ChatStep {
  id: string;
  question: string;
  inputType: 'select' | 'text' | 'email' | 'phone' | 'textarea';
  options?: string[];
  placeholder?: string;
  validation?: (value: string) => boolean;
  nextStep?: (value: string) => string;
}

export interface LeadData {
  service?: string;
  details?: string;
  budget?: string;
  timeline?: string;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  createdAt?: Date;
  verified?: boolean;
}

export interface ChatState {
  currentStep: string;
  messages: Message[];
  leadData: LeadData;
  isCompleted: boolean;
}