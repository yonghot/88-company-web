export interface ChatQuestion {
  id?: string;
  type: 'text' | 'textarea' | 'select' | 'quick-reply' | 'verification' | 'phone';
  question: string;
  placeholder?: string;
  options?: string[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface ChatFlow {
  id?: string;
  name: string;
  description?: string;
  start_step: string;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ChatQuestionHistory {
  id?: string;
  question_id: string;
  changed_by?: string;
  change_type: 'create' | 'update' | 'delete';
  old_data?: ChatQuestion;
  new_data?: ChatQuestion;
  changed_at?: string;
}

export interface DynamicQuestionService {
  loadQuestions(): Promise<Map<string, ChatQuestion>>;
  loadFlow(flowName?: string): Promise<ChatFlow | null>;
  saveQuestion(question: ChatQuestion): Promise<ChatQuestion>;
  updateQuestion(step: string, updates: Partial<ChatQuestion>): Promise<ChatQuestion>;
  deleteQuestion(step: string): Promise<void>;
  reorderQuestions(steps: string[]): Promise<void>;
  getQuestionHistory(questionId: string): Promise<ChatQuestionHistory[]>;
}

export interface QuestionCache {
  questions: Map<string, ChatQuestion> | null;
  flow: ChatFlow | null;
  lastFetch: Date | null;
  isStale(): boolean;
  invalidate(): void;
}

export const CACHE_TTL = 5 * 60 * 1000;
