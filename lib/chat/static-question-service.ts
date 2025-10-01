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
      .filter(q => q.is_active === true)
      .sort((a, b) => a.order_index - b.order_index);
  }

  getTotalSteps(): number {
    return this.getActiveQuestions().length;
  }

  getChatFlow(): Record<string, ChatFlowStep> {
    const activeQuestions = this.getActiveQuestions();
    const flow: Record<string, ChatFlowStep> = {};

    activeQuestions.forEach((question, index) => {
      const nextQuestion = activeQuestions[index + 1];

      flow[question.step] = {
        id: question.step,
        question: question.question,
        inputType: this.getInputType(question),
        placeholder: question.placeholder,
        options: question.options,
        validation: this.getValidation(question),
        nextStep: this.createNextStepFunction(question, nextQuestion)
      };
    });

    if (flow['phone']) {
      flow['phoneVerification'] = {
        id: 'phoneVerification',
        question: '📱 인증번호 6자리를 입력해주세요.',
        inputType: 'text',
        placeholder: '인증번호 6자리',
        validation: (value: string) => /^[0-9]{6}$/.test(value),
        nextStep: () => 'complete'
      };

      flow['phone'].nextStep = () => 'phoneVerification';
    }

    if (!flow['complete']) {
      flow['complete'] = {
        id: 'complete',
        question: '🎉 등록이 완료되었습니다!\n\n빠른 시일 내에 연락드리겠습니다.\n88 Company와 함께 성공적인 창업을 시작하세요!',
        inputType: 'text',
        nextStep: () => 'complete'
      };
    }

    return flow;
  }

  private getInputType(question: ChatQuestion): 'text' | 'textarea' | 'select' | 'phone' | 'email' {
    if (question.step === 'phone') return 'phone';

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
    if (question.step === 'phone') {
      return (value: string) => {
        const cleanedValue = value.replace(/[\s-]/g, '');
        const phoneRegex = /^01[0-9]{9}$/;
        return phoneRegex.test(cleanedValue);
      };
    }

    if (question.step === 'name') {
      return (value: string) => value.length >= 2;
    }

    if (question.validation?.required) {
      return (value: string) => value.trim().length > 0;
    }

    return undefined;
  }

  private createNextStepFunction(
    question: ChatQuestion,
    nextQuestion?: ChatQuestion
  ): (value?: string) => string {
    return (value?: string) => {
      if (question.step === 'phone') return 'phoneVerification';
      if (question.step === 'phoneVerification') return 'complete';

      if (nextQuestion) return nextQuestion.step;
      if (question.next_step) return question.next_step;

      return 'complete';
    };
  }
}

export const staticQuestionService = StaticQuestionService.getInstance();
