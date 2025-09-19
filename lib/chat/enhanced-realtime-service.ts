import { ChatQuestion } from './dynamic-types';
import { createClient, SupabaseClient, RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';

interface RealtimeConfig {
  url: string;
  key: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

interface RealtimeStatus {
  state: ConnectionState;
  lastSync: Date | null;
  errorCount: number;
  isSupabaseEnabled: boolean;
}

export class EnhancedRealtimeService {
  private static instance: EnhancedRealtimeService;
  private supabase: SupabaseClient | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private questionsCache: ChatQuestion[] = [];
  private listeners: Set<(questions: ChatQuestion[]) => void> = new Set();
  private statusListeners: Set<(status: RealtimeStatus) => void> = new Set();

  private status: RealtimeStatus = {
    state: 'disconnected',
    lastSync: null,
    errorCount: 0,
    isSupabaseEnabled: false
  };

  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000;

  private updateDebounceTimer: NodeJS.Timeout | null = null;
  private readonly UPDATE_DEBOUNCE_DELAY = 500;

  private lastUpdateSource: 'local' | 'remote' | null = null;
  private pendingUpdates: ChatQuestion[] | null = null;

  private constructor() {
    this.initializeSupabase();
  }

  static getInstance(): EnhancedRealtimeService {
    if (!this.instance) {
      this.instance = new EnhancedRealtimeService();
    }
    return this.instance;
  }

  private initializeSupabase(): void {
    if (typeof window === 'undefined') return;

    const config = this.getSupabaseConfig();

    if (!config) {
      console.warn('[EnhancedRealtimeService] Supabase configuration not found, using localStorage');
      this.updateStatus({ state: 'disconnected', isSupabaseEnabled: false });
      return;
    }

    try {
      this.supabase = createClient(config.url, config.key, {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      this.updateStatus({ state: 'connecting', isSupabaseEnabled: true });
      this.setupRealtimeSubscription();
      this.loadInitialData();

    } catch (error) {
      console.error('[EnhancedRealtimeService] Failed to initialize Supabase:', error);
      this.updateStatus({ state: 'error', errorCount: this.status.errorCount + 1 });
      this.scheduleReconnect();
    }
  }

  private getSupabaseConfig(): RealtimeConfig | null {
    if (typeof window === 'undefined') return null;

    const url = (window as any).ENV?.NEXT_PUBLIC_SUPABASE_URL ||
                process.env.NEXT_PUBLIC_SUPABASE_URL ||
                'https://tjizerpeyteokqhufqea.supabase.co';

    const key = (window as any).ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXplcnBleXRlb2txaHVmcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxMTEsImV4cCI6MjA3MzI2NTExMX0.lpw_F9T7tML76NyCm1_6NJ6kyFdXtYsoUehK9ZhZT7s';

    if (!url || !key || url.includes('placeholder') || url.includes('your_')) {
      return null;
    }

    return { url, key };
  }

  private async setupRealtimeSubscription(): Promise<void> {
    if (!this.supabase) return;

    if (this.realtimeChannel) {
      await this.cleanupChannel();
    }

    try {
      this.realtimeChannel = this.supabase
        .channel('questions_sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_questions'
          },
          (payload) => {
            console.log('[EnhancedRealtimeService] Change detected:', payload.eventType);
            this.handleRealtimeChange(payload);
          }
        )
        .on('presence', { event: 'sync' }, () => {
          console.log('[EnhancedRealtimeService] Presence sync');
        })
        .subscribe(async (status) => {
          console.log('[EnhancedRealtimeService] Channel status:', status);

          if (status === 'SUBSCRIBED') {
            this.updateStatus({ state: 'connected', lastSync: new Date() });
            this.reconnectAttempts = 0;

            await this.loadFromDatabase();

          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.updateStatus({ state: 'disconnected' });
            this.scheduleReconnect();
          }
        });

    } catch (error) {
      console.error('[EnhancedRealtimeService] Subscription setup failed:', error);
      this.updateStatus({ state: 'error', errorCount: this.status.errorCount + 1 });
      this.scheduleReconnect();
    }
  }

  private async handleRealtimeChange(payload: any): Promise<void> {
    if (this.lastUpdateSource === 'local' && Date.now() - this.status.lastSync!.getTime() < 1000) {
      console.log('[EnhancedRealtimeService] Ignoring echo from local update');
      return;
    }

    this.lastUpdateSource = 'remote';

    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    this.updateDebounceTimer = setTimeout(async () => {
      await this.loadFromDatabase();
      this.notifyListeners();
      this.updateStatus({ lastSync: new Date() });
    }, this.UPDATE_DEBOUNCE_DELAY);
  }

  private async loadFromDatabase(): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('chat_questions')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[EnhancedRealtimeService] Load failed:', error);
        this.updateStatus({ state: 'error', errorCount: this.status.errorCount + 1 });
        return;
      }

      if (data && data.length > 0) {
        this.questionsCache = data;
        console.log('[EnhancedRealtimeService] Loaded', data.length, 'questions');
      }

    } catch (error) {
      console.error('[EnhancedRealtimeService] Database error:', error);
      this.updateStatus({ state: 'error', errorCount: this.status.errorCount + 1 });
    }
  }

  private async loadInitialData(): Promise<void> {
    console.log('[EnhancedRealtimeService] Loading initial data...');
    await this.loadFromDatabase();

    // \ub370\uc774\ud130\uac00 \uc5c6\uc73c\uba74 \uae30\ubcf8 \uc9c8\ubb38 \ub85c\ub4dc
    if (this.questionsCache.length === 0) {
      console.log('[EnhancedRealtimeService] No data from Supabase, loading from localStorage or defaults');
      this.questionsCache = this.loadFromLocalStorage();
    }

    this.notifyListeners();
  }

  async saveQuestions(questions: ChatQuestion[]): Promise<boolean> {
    if (!this.supabase || !this.status.isSupabaseEnabled) {
      this.saveToLocalStorage(questions);
      return true;
    }

    this.lastUpdateSource = 'local';
    this.pendingUpdates = questions;

    try {
      const { error: deleteError } = await this.supabase
        .from('chat_questions')
        .delete()
        .neq('step', '');

      if (deleteError) {
        console.error('[EnhancedRealtimeService] Delete error:', deleteError);
      }

      const questionsWithDefaults = questions.map(q => ({
        ...q,
        id: q.id || undefined,
        created_at: q.created_at || undefined,
        updated_at: q.updated_at || undefined
      }));

      const { error: insertError } = await this.supabase
        .from('chat_questions')
        .insert(questionsWithDefaults as any);

      if (insertError) {
        console.error('[EnhancedRealtimeService] Insert error:', insertError);
        this.saveToLocalStorage(questions);
        return false;
      }

      this.questionsCache = questions;
      this.updateStatus({ lastSync: new Date() });
      console.log('[EnhancedRealtimeService] Saved', questions.length, 'questions');

      setTimeout(() => {
        this.lastUpdateSource = null;
      }, 2000);

      return true;

    } catch (error) {
      console.error('[EnhancedRealtimeService] Save error:', error);
      this.saveToLocalStorage(questions);
      return false;
    }
  }

  getQuestions(): ChatQuestion[] {
    if (this.questionsCache.length > 0) {
      return this.questionsCache;
    }

    // \uce90\uc2dc\uac00 \ube44\uc5b4\uc788\uc73c\uba74 localStorage\uc5d0\uc11c \ub85c\ub4dc
    const questions = this.loadFromLocalStorage();
    if (questions.length > 0) {
      this.questionsCache = questions;
    }
    return questions;
  }

  getActiveQuestions(): ChatQuestion[] {
    const allQuestions = this.getQuestions();
    return allQuestions
      .filter(q => q.is_active === true)
      .sort((a, b) => a.order_index - b.order_index);
  }

  getChatFlow(): Record<string, any> {
    const activeQuestions = this.getActiveQuestions();
    const flow: Record<string, any> = {};

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

      const originalPhoneNext = flow['phone'].nextStep;
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

  getTotalSteps(): number {
    const activeQuestions = this.getActiveQuestions();
    const hasPhone = activeQuestions.some(q => q.step === 'phone');
    return activeQuestions.length + (hasPhone ? 1 : 0);
  }

  private getInputType(question: ChatQuestion): string {
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
      if (question.step === 'phone') return 'phoneVerification';
      if (question.step === 'phoneVerification') return 'complete';

      if (nextQuestion) return nextQuestion.step;
      if (question.next_step) return question.next_step;

      return 'complete';
    };
  }

  subscribe(listener: () => void): () => void {
    const questionsListener = (questions: ChatQuestion[]) => {
      listener();
    };
    return this.subscribeToQuestions(questionsListener);
  }

  getStatus(): RealtimeStatus {
    return { ...this.status };
  }

  subscribeToQuestions(listener: (questions: ChatQuestion[]) => void): () => void {
    this.listeners.add(listener);

    if (this.questionsCache.length > 0) {
      listener(this.questionsCache);
    }

    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeToStatus(listener: (status: RealtimeStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.questionsCache);
      } catch (error) {
        console.error('[EnhancedRealtimeService] Listener error:', error);
      }
    });
  }

  private updateStatus(updates: Partial<RealtimeStatus>): void {
    this.status = { ...this.status, ...updates };

    this.statusListeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('[EnhancedRealtimeService] Status listener error:', error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    this.reconnectAttempts++;
    this.updateStatus({ state: 'reconnecting' });

    this.reconnectTimer = setTimeout(() => {
      console.log('[EnhancedRealtimeService] Attempting reconnection', this.reconnectAttempts);
      this.reconnectTimer = null;
      this.initializeSupabase();
    }, this.RECONNECT_DELAY * this.reconnectAttempts);
  }

  private async cleanupChannel(): Promise<void> {
    if (this.realtimeChannel) {
      try {
        await this.supabase?.removeChannel(this.realtimeChannel);
      } catch (error) {
        console.error('[EnhancedRealtimeService] Channel cleanup error:', error);
      }
      this.realtimeChannel = null;
    }
  }

  private saveToLocalStorage(questions: ChatQuestion[]): void {
    try {
      localStorage.setItem('chat_questions', JSON.stringify(questions));
      window.dispatchEvent(new Event('questionsUpdated'));
    } catch (error) {
      console.error('[EnhancedRealtimeService] localStorage save error:', error);
    }
  }

  private loadFromLocalStorage(): ChatQuestion[] {
    try {
      const stored = localStorage.getItem('chat_questions');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[EnhancedRealtimeService] localStorage load error:', error);
    }
    return this.getDefaultQuestions();
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

  async forceRefresh(): Promise<void> {
    await this.loadFromDatabase();
    this.notifyListeners();
  }

  async testConnection(): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { error } = await this.supabase
        .from('chat_questions')
        .select('count')
        .single();

      return !error;
    } catch {
      return false;
    }
  }

  cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    this.cleanupChannel();
    this.listeners.clear();
    this.statusListeners.clear();
  }
}

export const enhancedRealtimeService = EnhancedRealtimeService.getInstance();