import { ChatQuestion } from './dynamic-types';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

interface ChatFlowStep {
  id: string;
  question: string;
  inputType: 'text' | 'textarea' | 'select' | 'phone' | 'email';
  placeholder?: string;
  options?: string[];
  validation?: (value: string) => boolean;
  nextStep: (value?: string) => string;
}

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

  private initPromise: Promise<void> | null = null;
  private isReady: boolean = false;  // 초기화 완료 상태 추적

  private constructor() {
    // 브라우저 환경에서만 초기화
    if (typeof window !== 'undefined') {
      // 초기화를 Promise로 래핑하여 비동기 완료를 추적
      this.initPromise = new Promise((resolve) => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            this.initializeSupabaseWithCallback(resolve);
          });
        } else {
          // 이미 로드됨
          this.initializeSupabaseWithCallback(resolve);
        }
      });
    }
  }

  private async initializeSupabaseWithCallback(callback: () => void): Promise<void> {
    await this.initializeSupabase();
    // 초기 데이터 로드 후 콜백 호출
    await this.loadInitialData();
    this.isReady = true;  // 초기화 완료 표시
    console.log('[EnhancedRealtimeService] Initialization complete, isReady = true');
    callback();
  }

  static getInstance(): EnhancedRealtimeService {
    if (!this.instance) {
      this.instance = new EnhancedRealtimeService();
    }
    // 인스턴스가 있지만 초기화되지 않은 경우
    if (typeof window !== 'undefined' && !this.instance.supabase && !this.instance.questionsCache.length) {
      this.instance.initializeSupabase();
    }
    return this.instance;
  }

  private async initializeSupabase(): Promise<void> {
    if (typeof window === 'undefined') {
      console.log('[EnhancedRealtimeService] Server-side environment, skipping Supabase init');
      return;
    }

    const config = this.getSupabaseConfig();
    console.log('[EnhancedRealtimeService] Supabase config:', config ? 'Found' : 'Not found');

    if (!config) {
      console.warn('[EnhancedRealtimeService] Supabase configuration not found');
      this.updateStatus({ state: 'disconnected', isSupabaseEnabled: false });
      // Supabase 없이는 작동하지 않음
      this.isReady = true;  // 설정이 없어도 초기화 완료로 표시
      this.notifyListeners();
      return;
    }

    try {
      console.log('[EnhancedRealtimeService] Creating Supabase client...');
      this.supabase = createClient(config.url, config.key, {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      console.log('[EnhancedRealtimeService] Supabase client created successfully');
      this.updateStatus({ state: 'connecting', isSupabaseEnabled: true });
      this.setupRealtimeSubscription();

    } catch (error) {
      console.error('[EnhancedRealtimeService] Failed to initialize Supabase:', error);
      this.updateStatus({ state: 'error', errorCount: this.status.errorCount + 1 });
      // 에러 시에도 폴백 사용하지 않음
      this.notifyListeners();
      this.scheduleReconnect();
    }
  }

  private getSupabaseConfig(): RealtimeConfig | null {
    if (typeof window === 'undefined') return null;

    // Next.js 환경변수는 빌드 시점에 주입되므로 하드코딩된 값 사용
    // 이 값들은 .env.local에 설정된 값과 동일함
    const url = 'https://tjizerpeyteokqhufqea.supabase.co';
    const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXplcnBleXRlb2txaHVmcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxMTEsImV4cCI6MjA3MzI2NTExMX0.lpw_F9T7tML76NyCm1_6NJ6kyFdXtYsoUehK9ZhZT7s';

    console.log('[EnhancedRealtimeService] Using Supabase config:', { url: url.substring(0, 30) + '...', key: key.substring(0, 20) + '...' });

    if (!url || !key || url.includes('placeholder') || url.includes('your_')) {
      console.warn('[EnhancedRealtimeService] Invalid Supabase configuration');
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

  private async handleRealtimeChange(payload: { eventType: string; old?: Record<string, unknown> | null; new?: Record<string, unknown> | null }): Promise<void> {
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
    if (!this.supabase) {
      console.warn('[EnhancedRealtimeService] Supabase client not initialized');
      return;
    }

    try {
      console.log('[EnhancedRealtimeService] Loading questions from database...');
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
        console.log('[EnhancedRealtimeService] Successfully loaded', data.length, 'questions from database');
      } else {
        console.log('[EnhancedRealtimeService] No questions found in database');
        this.questionsCache = [];
      }

    } catch (error) {
      console.error('[EnhancedRealtimeService] Database error:', error);
      this.updateStatus({ state: 'error', errorCount: this.status.errorCount + 1 });
      // 에러 시에도 폴백 사용하지 않음
      this.questionsCache = [];
    }
  }

  private async loadInitialData(): Promise<void> {
    console.log('[EnhancedRealtimeService] Loading initial data...');
    await this.loadFromDatabase();

    // 데이터가 없으면 빈 상태 유지
    if (this.questionsCache.length === 0) {
      console.log('[EnhancedRealtimeService] No data from Supabase');
    }

    this.notifyListeners();
  }

  async saveQuestions(questions: ChatQuestion[]): Promise<boolean> {
    if (!this.supabase || !this.status.isSupabaseEnabled) {
      console.warn('[EnhancedRealtimeService] Supabase not available, cannot save questions');
      return false;
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
        .insert(questionsWithDefaults);

      if (insertError) {
        console.error('[EnhancedRealtimeService] Insert error:', insertError);
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
      return false;
    }
  }

  getQuestions(): ChatQuestion[] {
    // Supabase 데이터만 사용, 폴백 없음
    if (this.questionsCache.length > 0) {
      return this.questionsCache;
    }

    // Supabase가 비활성화되었거나 데이터가 없으면 빈 배열 반환
    console.warn('[EnhancedRealtimeService] No questions in cache, Supabase might not be connected');
    return [];
  }

  getActiveQuestions(): ChatQuestion[] {
    const allQuestions = this.getQuestions();
    return allQuestions
      .filter(q => q.is_active === true)
      .sort((a, b) => a.order_index - b.order_index);
  }

  async waitForInitialization(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  // 초기화가 완료되었는지 확인
  isInitialized(): boolean {
    // 서버 사이드에서는 항상 true
    if (typeof window === 'undefined') {
      return true;
    }

    // isReady 플래그로 초기화 완료 여부 확인
    return this.isReady;
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
    return activeQuestions.length;
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
        // 모든 공백과 하이픈 제거
        const cleanedValue = value.replace(/[\s-]/g, '');
        // 한국 휴대폰 번호 형식 검증 (010, 011, 016, 017, 018, 019) - 11자리만 허용
        const phoneRegex = /^01[0-9]{9}$/;
        return phoneRegex.test(cleanedValue);
      };
    }

    if (question.step === 'name') {
      return (value: string) => value.length >= 2;
    }

    if (question.step === 'phone') {
      return (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers.length === 11 && numbers.startsWith('010');
      };
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

  // 나머지 코드는 동일...

  private updateStatus(updates: Partial<RealtimeStatus>): void {
    this.status = { ...this.status, ...updates };
    this.statusListeners.forEach(listener => listener(this.status));
  }

  private notifyListeners(): void {
    const questions = this.getQuestions();
    this.listeners.forEach(listener => listener(questions));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    this.reconnectAttempts++;
    this.updateStatus({ state: 'reconnecting' });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.setupRealtimeSubscription();
    }, this.RECONNECT_DELAY);
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

  subscribe(listener: (questions: ChatQuestion[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToStatus(listener: (status: RealtimeStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): RealtimeStatus {
    return this.status;
  }

  // 하위 호환성을 위한 메서드 추가
  subscribeToQuestions(listener: (questions: ChatQuestion[]) => void): () => void {
    return this.subscribe(listener);
  }

  async forceRefresh(): Promise<void> {
    await this.loadFromDatabase();
    this.notifyListeners();
  }

  // getDefaultQuestions는 더 이상 사용되지 않지만 유지 (나중에 제거 예정)
  private getDefaultQuestions(): ChatQuestion[] {
    return [];
  }
}

// 싱글톤 인스턴스 export
export const enhancedRealtimeService = EnhancedRealtimeService.getInstance();