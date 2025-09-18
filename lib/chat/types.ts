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
  nextStep?: (value?: string) => string;
}

export interface ChatState {
  currentStep: string;
  messages: Message[];
  leadData: LeadData;
  isCompleted: boolean;
}

// Lead 데이터는 chat과 다른 곳에서도 사용되므로 별도로 export
export interface LeadData {
  id?: string;
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