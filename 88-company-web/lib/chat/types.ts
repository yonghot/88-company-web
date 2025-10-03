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

// Lead 데이터 타입 - 현재 챗봇 질문 구조에 맞춤
export interface LeadData {
  id?: string;
  welcome?: string;         // Q1: 예비창업자 여부
  experience?: string;      // Q2: 정부지원사업 경험
  business_idea?: string;   // Q3: 사업 아이템
  region?: string;          // Q4: 지역
  gender?: string;          // Q5: 성별
  age?: string;             // Q6: 나이
  name?: string;            // Q7: 이름
  phone?: string;           // Q8: 전화번호
  createdAt?: Date;
  verified?: boolean;
  [key: string]: any;       // Allow dynamic step_ keys
}
