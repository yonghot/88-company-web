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
    await this.loadFromDatabase();
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

    return this.loadFromLocalStorage();
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
    return [];
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