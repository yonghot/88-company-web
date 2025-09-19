import { ChatQuestion, ChatFlow } from './dynamic-types';
import { ChatStep } from './types';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export class RealTimeQuestionService {
  private static instance: RealTimeQuestionService;
  private readonly STORAGE_KEY = 'chat_questions';
  private readonly UPDATE_EVENT = 'questionsUpdated';
  private listeners: Set<() => void> = new Set();
  private supabase: SupabaseClient | null = null;
  private questionsCache: ChatQuestion[] = [];
  private realtimeChannel: RealtimeChannel | null = null;
  private isSupabaseEnabled: boolean = false;

  private constructor() {
    this.initializeSupabase();
  }

  static getInstance(): RealTimeQuestionService {
    if (!this.instance) {
      this.instance = new RealTimeQuestionService();
    }
    return this.instance;
  }

  private initializeSupabase(): void {
    if (typeof window === 'undefined') return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const isValidSupabaseConfig =
      supabaseUrl &&
      supabaseKey &&
      supabaseUrl.length > 10 &&
      supabaseKey.length > 10 &&
      supabaseUrl.startsWith('http') &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your_supabase');

    if (isValidSupabaseConfig) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.isSupabaseEnabled = true;
        this.setupRealtimeSubscription();
        this.loadFromSupabase();
        console.log('[RealTimeQuestionService] Supabase initialized successfully');
      } catch (error) {
        console.error('[RealTimeQuestionService] Failed to initialize Supabase:', error);
        this.isSupabaseEnabled = false;
      }
    } else {
      console.log('[RealTimeQuestionService] Using localStorage fallback');
    }
  }

  private async setupRealtimeSubscription(): Promise<void> {
    if (!this.supabase) return;

    try {
      this.realtimeChannel = this.supabase
        .channel('chat_questions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_questions'
          },
          (payload) => {
            console.log('[RealTimeQuestionService] Database change detected:', payload);
            this.handleDatabaseChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('[RealTimeQuestionService] Realtime subscription status:', status);
        });
    } catch (error) {
      console.error('[RealTimeQuestionService] Failed to setup realtime subscription:', error);
    }
  }

  private async handleDatabaseChange(payload: any): Promise<void> {
    await this.loadFromSupabase();
    this.notifyListeners();
  }

  private async loadFromSupabase(): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('chat_questions')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[RealTimeQuestionService] Failed to load from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        this.questionsCache = data;
        console.log('[RealTimeQuestionService] Loaded', data.length, 'questions from Supabase');
      }
    } catch (error) {
      console.error('[RealTimeQuestionService] Error loading from Supabase:', error);
    }
  }

  getActiveQuestions(): ChatQuestion[] {
    const allQuestions = this.getAllQuestions();
    return allQuestions
      .filter(q => q.is_active === true)
      .sort((a, b) => a.order_index - b.order_index);
  }

  getAllQuestions(): ChatQuestion[] {
    if (typeof window === 'undefined') {
      return this.getDefaultQuestions();
    }

    if (this.isSupabaseEnabled && this.questionsCache.length > 0) {
      return this.questionsCache;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const questions = JSON.parse(stored);
        if (Array.isArray(questions) && questions.length > 0) {
          return questions;
        }
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    }

    const defaultQuestions = this.getDefaultQuestions();
    this.saveQuestions(defaultQuestions);
    return defaultQuestions;
  }

  async saveQuestions(questions: ChatQuestion[]): Promise<void> {
    if (typeof window === 'undefined') return;

    if (this.isSupabaseEnabled && this.supabase) {
      try {
        const { error: deleteError } = await this.supabase
          .from('chat_questions')
          .delete()
          .neq('step', '');

        if (deleteError) {
          console.error('[RealTimeQuestionService] Failed to clear questions:', deleteError);
        }

        const { error: insertError } = await this.supabase
          .from('chat_questions')
          .insert(questions as any);

        if (insertError) {
          console.error('[RealTimeQuestionService] Failed to save to Supabase:', insertError);
          this.saveToLocalStorage(questions);
        } else {
          console.log('[RealTimeQuestionService] Saved', questions.length, 'questions to Supabase');
          this.questionsCache = questions;
        }
      } catch (error) {
        console.error('[RealTimeQuestionService] Error saving to Supabase:', error);
        this.saveToLocalStorage(questions);
      }
    } else {
      this.saveToLocalStorage(questions);
    }

    this.notifyListeners();
    window.dispatchEvent(new Event(this.UPDATE_EVENT));
  }

  private saveToLocalStorage(questions: ChatQuestion[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(questions));
      window.dispatchEvent(new StorageEvent('storage', {
        key: this.STORAGE_KEY,
        newValue: JSON.stringify(questions),
        url: window.location.href
      }));
      console.log('[RealTimeQuestionService] Questions saved to localStorage');
    } catch (error) {
      console.error('Failed to save questions to localStorage:', error);
    }
  }

  getChatFlow(): Record<string, ChatStep> {
    const activeQuestions = this.getActiveQuestions();
    const flow: Record<string, ChatStep> = {};

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

    // phone 다음에 phoneVerification 동적 추가
    if (flow['phone']) {
      flow['phoneVerification'] = {
        id: 'phoneVerification',
        question: '📱 인증번호 6자리를 입력해주세요.',
        inputType: 'text',
        placeholder: '인증번호 6자리',
        validation: (value: string) => /^[0-9]{6}$/.test(value),
        nextStep: () => 'complete'
      };

      const originalPhoneNext = flow['phone'].nextStep;
      flow['phone'].nextStep = () => 'phoneVerification';
    }

    // complete 단계 보장
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

  getTotalSteps(): number {
    const activeQuestions = this.getActiveQuestions();
    // phone 단계가 있으면 +1 (phoneVerification 포함)
    const hasPhone = activeQuestions.some(q => q.step === 'phone');
    return activeQuestions.length + (hasPhone ? 1 : 0);
  }

  getStepIndex(stepId: string): number {
    const activeQuestions = this.getActiveQuestions();

    if (stepId === 'phoneVerification') {
      const phoneIndex = activeQuestions.findIndex(q => q.step === 'phone');
      return phoneIndex >= 0 ? phoneIndex + 0.5 : activeQuestions.length;
    }

    if (stepId === 'complete') {
      return this.getTotalSteps();
    }

    return activeQuestions.findIndex(q => q.step === stepId);
  }

  // 리스너 등록/해제
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    console.log('[RealTimeQuestionService] Listener subscribed, total:', this.listeners.size);

    return () => {
      this.listeners.delete(listener);
      console.log('[RealTimeQuestionService] Listener unsubscribed, remaining:', this.listeners.size);
    };
  }

  private notifyListeners(): void {
    console.log('[RealTimeQuestionService] Notifying', this.listeners.size, 'listeners');
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  private getInputType(question: ChatQuestion): ChatStep['inputType'] {
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
        const phoneRegex = /^(01[0-9]{1})-?([0-9]{3,4})-?([0-9]{4})$/;
        return phoneRegex.test(value.replace(/-/g, ''));
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
      // 특수 처리
      if (question.step === 'phone') return 'phoneVerification';
      if (question.step === 'phoneVerification') return 'complete';

      // 다음 질문이 있으면 해당 질문으로
      if (nextQuestion) return nextQuestion.step;

      // 명시적 next_step이 있으면 사용
      if (question.next_step) return question.next_step;

      // 기본값
      return 'complete';
    };
  }

  private getDefaultQuestions(): ChatQuestion[] {
    return [
      {
        step: 'welcome',
        type: 'select',
        question: '안녕하세요! 88 Company입니다. 어떤 서비스를 찾고 계신가요?',
        options: ['창업 컨설팅', '경영 전략 수립', '마케팅 전략', '투자 유치 지원', '기타 문의'],
        next_step: 'budget',
        is_active: true,
        order_index: 0,
        placeholder: ''
      },
      {
        step: 'budget',
        type: 'select',
        question: '예상하시는 예산 규모는 어느 정도인가요?',
        options: ['500만원 미만', '500만원 - 1,000만원', '1,000만원 - 3,000만원', '3,000만원 - 5,000만원', '5,000만원 이상', '협의 필요'],
        next_step: 'timeline',
        is_active: true,
        order_index: 1,
        placeholder: ''
      },
      {
        step: 'timeline',
        type: 'select',
        question: '프로젝트는 언제 시작하실 예정인가요?',
        options: ['즉시 시작', '1주일 이내', '1개월 이내', '3개월 이내', '아직 미정'],
        next_step: 'details',
        is_active: true,
        order_index: 2,
        placeholder: ''
      },
      {
        step: 'details',
        type: 'textarea',
        question: '프로젝트에 대해 추가로 알려주실 내용이 있나요?',
        placeholder: '현재 상황, 목표, 특별한 요구사항 등을 자유롭게 작성해주세요...',
        next_step: 'name',
        is_active: true,
        order_index: 3
      },
      {
        step: 'name',
        type: 'text',
        question: '성함을 알려주세요.',
        placeholder: '홍길동',
        next_step: 'phone',
        is_active: true,
        order_index: 4
      },
      {
        step: 'phone',
        type: 'text',
        question: '연락 가능한 전화번호를 입력해주세요.',
        placeholder: '010-0000-0000',
        next_step: 'complete',
        is_active: true,
        order_index: 5
      }
    ];
  }

  cleanup(): void {
    if (this.realtimeChannel) {
      this.supabase?.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.listeners.clear();
  }

  isUsingSupabase(): boolean {
    return this.isSupabaseEnabled;
  }
}

export const realTimeQuestionService = RealTimeQuestionService.getInstance();