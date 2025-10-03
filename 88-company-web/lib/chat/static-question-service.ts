import { ChatQuestion } from './dynamic-types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface ChatFlowStep {
  id: string;
  question: string;
  inputType: 'text' | 'textarea' | 'select' | 'phone' | 'email';
  placeholder?: string;
  options?: string[];
  validation?: (value: string) => boolean;
  nextStep: (value?: string) => string;
}

export class StaticQuestionService {
  private static instance: StaticQuestionService;
  private supabase: SupabaseClient | null = null;
  private questionsCache: ChatQuestion[] = [];
  private isLoaded: boolean = false;

  private constructor() {
    this.initializeSupabase();
  }

  static getInstance(): StaticQuestionService {
    if (!this.instance) {
      this.instance = new StaticQuestionService();
    }
    return this.instance;
  }

  private initializeSupabase(): void {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('[StaticQuestionService] Supabase configuration not found');
      return;
    }

    try {
      this.supabase = createClient(url, key);
      console.log('[StaticQuestionService] Supabase client initialized');
    } catch (error) {
      console.error('[StaticQuestionService] Failed to initialize Supabase:', error);
    }
  }

  async loadQuestions(): Promise<ChatQuestion[]> {
    if (this.isLoaded && this.questionsCache.length > 0) {
      console.log('[StaticQuestionService] Using cached questions');
      return this.questionsCache;
    }

    if (!this.supabase) {
      console.warn('[StaticQuestionService] Supabase not initialized');
      return [];
    }

    try {
      console.log('[StaticQuestionService] Loading questions from database...');
      const { data, error } = await this.supabase
        .from('chat_questions')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[StaticQuestionService] Load failed:', error);
        return [];
      }

      if (data && data.length > 0) {
        this.questionsCache = data;
        this.isLoaded = true;
        console.log('[StaticQuestionService] Successfully loaded', data.length, 'questions');
      } else {
        console.log('[StaticQuestionService] No questions found in database');
        this.questionsCache = [];
        this.isLoaded = true;
      }

      return this.questionsCache;
    } catch (error) {
      console.error('[StaticQuestionService] Database error:', error);
      return [];
    }
  }

  getQuestions(): ChatQuestion[] {
    return this.questionsCache;
  }

  getActiveQuestions(): ChatQuestion[] {
    return this.questionsCache
      .filter(q => q.order_index !== 999)
      .sort((a, b) => a.order_index - b.order_index);
  }

  getTotalSteps(): number {
    return this.questionsCache.filter(q => q.order_index !== 999).length;
  }

  getChatFlow(): Record<string, ChatFlowStep> {
    const activeQuestions = this.getActiveQuestions();
    const flow: Record<string, ChatFlowStep> = {};

    activeQuestions.forEach((question, index) => {
      const nextQuestion = activeQuestions[index + 1];
      const stepId = `step_${question.order_index}`;

      flow[stepId] = {
        id: stepId,
        question: question.question,
        inputType: this.getInputType(question),
        placeholder: question.placeholder,
        options: question.options,
        validation: this.getValidation(question),
        nextStep: this.createNextStepFunction(question, nextQuestion, index)
      };
    });

    const phoneStepIndex = activeQuestions.findIndex(q => q.type === 'phone');
    if (phoneStepIndex !== -1) {
      const phoneStepId = `step_${activeQuestions[phoneStepIndex].order_index}`;
      
      flow['phoneVerification'] = {
        id: 'phoneVerification',
        question: '📱 인증번호 6자리를 입력해주세요.',
        inputType: 'text',
        placeholder: '인증번호 6자리',
        validation: (value: string) => /^[0-9]{6}$/.test(value),
        nextStep: () => 'complete'
      };

      flow[phoneStepId].nextStep = () => 'phoneVerification';
    }

    const completeQuestion = this.questionsCache.find(q => q.order_index === 999);
    if (completeQuestion) {
      flow['complete'] = {
        id: 'complete',
        question: completeQuestion.question,
        inputType: 'text',
        nextStep: () => 'complete'
      };
      console.log('[StaticQuestionService] Loaded complete message from database');
    } else {
      flow['complete'] = {
        id: 'complete',
        question: '등록이 완료되었습니다! 🎉\n\n빠른 시일 내에 88 Company에서 무료 유선 상담 연락을 드릴 예정입니다.\n\n창업 여정의 시작을 함께 하게 되어 기쁩니다.',
        inputType: 'text',
        nextStep: () => 'complete'
      };
      console.warn('[StaticQuestionService] Complete message not found in database (order_index=999), using fallback');
    }

    return flow;
  }

  private getInputType(question: ChatQuestion): 'text' | 'textarea' | 'select' | 'phone' | 'email' {
    if (question.type === 'phone') return 'phone';

    switch (question.type) {
      case 'select':
      case 'quick-reply':
        return 'select';
      case 'textarea':
        return 'textarea';
      default:
        return 'text';
    }
  }

  private getValidation(question: ChatQuestion): ((value: string) => boolean) | undefined {
    if (question.type === 'phone') {
      return (value: string) => {
        const cleanedValue = value.replace(/[\s-]/g, '');
        const phoneRegex = /^01[0-9]{9}$/;
        return phoneRegex.test(cleanedValue);
      };
    }

    if (question.validation) {
      return (value: string) => {
        const val = question.validation;
        if (val?.required && value.trim().length === 0) return false;
        if (val?.minLength && value.length < val.minLength) return false;
        if (val?.maxLength && value.length > val.maxLength) return false;
        if (val?.pattern && !new RegExp(val.pattern).test(value)) return false;
        return true;
      };
    }

    return undefined;
  }

  private createNextStepFunction(
    question: ChatQuestion,
    nextQuestion: ChatQuestion | undefined,
    currentIndex: number
  ): (value?: string) => string {
    return (value?: string) => {
      if (question.type === 'phone') return 'phoneVerification';
      
      if (nextQuestion) {
        return `step_${nextQuestion.order_index}`;
      }

      return 'complete';
    };
  }
}

export const staticQuestionService = StaticQuestionService.getInstance();
