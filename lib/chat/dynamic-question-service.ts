import { createClient } from '@supabase/supabase-js';
import { ChatQuestion, ChatFlow, ChatQuestionHistory, DynamicQuestionService, QuestionCache, CACHE_TTL } from './dynamic-types';
import { chatQuestions as staticQuestions } from './questions';
import { ClientStorage } from '@/lib/storage/client-storage';

class QuestionCacheImpl implements QuestionCache {
  questions: Map<string, ChatQuestion> | null = null;
  flow: ChatFlow | null = null;
  lastFetch: Date | null = null;

  isStale(): boolean {
    if (!this.lastFetch) return true;
    return Date.now() - this.lastFetch.getTime() > CACHE_TTL;
  }

  invalidate(): void {
    this.questions = null;
    this.flow = null;
    this.lastFetch = null;
  }
}

export class DynamicQuestionServiceImpl implements DynamicQuestionService {
  private supabase: any | null;
  private cache: QuestionCache;
  private useStaticFallback: boolean = false;

  constructor() {
    this.cache = new QuestionCacheImpl();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Supabase가 올바르게 설정되었는지 확인
    const isValidSupabaseConfig =
      supabaseUrl &&
      supabaseKey &&
      supabaseUrl.startsWith('http') &&
      !supabaseUrl.includes('placeholder') &&
      !supabaseUrl.includes('your_supabase');

    if (isValidSupabaseConfig) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      // Supabase not configured, using static questions (this is expected in development)
      this.supabase = null;
      this.useStaticFallback = true;
    }
  }

  private convertStaticToMap(): Map<string, ChatQuestion> {
    const map = new Map<string, ChatQuestion>();
    Object.entries(staticQuestions).forEach(([key, value], index) => {
      let type: 'text' | 'textarea' | 'select' = 'text';
      if ('options' in value && value.options) {
        type = 'select';
      } else if (key === 'customService' || key === 'details') {
        type = 'textarea';
      }

      const question: ChatQuestion = {
        step: key,
        type: type,
        question: value.question,
        placeholder: ('placeholder' in value ? value.placeholder : '') || '',
        options: 'options' in value ? value.options : undefined,
        validation: undefined,
        next_step: this.getDefaultNextStep(key),
        is_active: true,
        order_index: index
      };
      map.set(key, question);
    });
    return map;
  }

  private getDefaultNextStep(currentStep: string): string {
    const stepOrder = ['welcome', 'customService', 'budget', 'timeline', 'details', 'name', 'phone', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      return stepOrder[currentIndex + 1];
    }
    return '';
  }

  async loadQuestions(): Promise<Map<string, ChatQuestion>> {
    if (!this.cache.isStale() && this.cache.questions) {
      return this.cache.questions;
    }

    if (this.useStaticFallback || !this.supabase) {
      // 클라이언트 사이드에서는 localStorage 사용
      if (typeof window !== 'undefined') {
        const localQuestions = ClientStorage.loadQuestions();
        // localStorage 데이터가 불완전하면 무시하고 정적 플로우 사용
        // 필수 스텝이 하나라도 빠지면 정적 플로우 사용
        const requiredSteps = ['welcome', 'budget', 'timeline', 'details', 'name', 'phone'];
        const hasAllRequired = localQuestions && localQuestions.length > 0 &&
          requiredSteps.every(step => localQuestions.some(q => q.step === step));

        if (hasAllRequired) {
          const questionsMap = new Map<string, ChatQuestion>();
          localQuestions.forEach(q => questionsMap.set(q.step, q));
          this.cache.questions = questionsMap;
          this.cache.lastFetch = new Date();
          return questionsMap;
        }
      }

      // 서버 사이드에서는 API 또는 static 사용
      const fileQuestions = await this.loadQuestionsFromAPI();
      if (fileQuestions && fileQuestions.size > 0) {
        this.cache.questions = fileQuestions;
        this.cache.lastFetch = new Date();
        return fileQuestions;
      }
      return this.convertStaticToMap();
    }

    try {
      const { data, error } = await this.supabase
        .from('chat_questions')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Failed to load questions from Supabase:', error);
        return this.convertStaticToMap();
      }

      const questionsMap = new Map<string, ChatQuestion>();
      data.forEach((q: ChatQuestion) => {
        questionsMap.set(q.step, {
          ...q,
          options: q.options || undefined,
          validation: q.validation || undefined
        });
      });

      this.cache.questions = questionsMap;
      this.cache.lastFetch = new Date();

      return questionsMap;
    } catch (error) {
      console.error('Error loading dynamic questions:', error);
      return this.convertStaticToMap();
    }
  }

  async loadFlow(flowName: string = 'default'): Promise<ChatFlow | null> {
    if (!this.cache.isStale() && this.cache.flow) {
      return this.cache.flow;
    }

    if (this.useStaticFallback || !this.supabase) {
      return {
        name: 'default',
        description: '기본 리드 생성 플로우',
        start_step: 'welcome',
        is_active: true
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('chat_flows')
        .select('*')
        .eq('name', flowName)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Failed to load flow from Supabase:', error);
        return {
          name: 'default',
          description: '기본 리드 생성 플로우',
          start_step: 'welcome',
          is_active: true
        };
      }

      this.cache.flow = data;
      return data;
    } catch (error) {
      console.error('Error loading flow:', error);
      return null;
    }
  }

  async saveQuestion(question: ChatQuestion): Promise<ChatQuestion> {
    if (this.useStaticFallback || !this.supabase) {
      const questions = await this.loadQuestions();
      questions.set(question.step, question);

      // 클라이언트 사이드에서는 localStorage에 저장
      if (typeof window !== 'undefined') {
        ClientStorage.addQuestion(question);
      } else {
        await this.saveQuestionsToAPI(questions);
      }

      this.cache.invalidate();
      return question;
    }

    const { data, error } = await this.supabase
      .from('chat_questions')
      .insert([question] as any)
      .select()
      .single();

    if (error) {
      throw error;
    }

    this.cache.invalidate();

    await this.recordHistory(data.id, 'create', null, data);

    return data;
  }

  async updateQuestion(step: string, updates: Partial<ChatQuestion>): Promise<ChatQuestion> {
    if (this.useStaticFallback || !this.supabase) {
      const questions = await this.loadQuestions();
      const question = questions.get(step);
      if (!question) throw new Error('Question not found');

      const updated = { ...question, ...updates };
      questions.set(step, updated);

      // 클라이언트 사이드에서는 localStorage에 저장
      if (typeof window !== 'undefined') {
        ClientStorage.updateQuestion(step, updates);
      } else {
        await this.saveQuestionsToAPI(questions);
      }

      this.cache.invalidate();
      return updated;
    }

    const { data: oldData } = await this.supabase
      .from('chat_questions')
      .select('*')
      .eq('step', step)
      .single();

    const { data, error } = await this.supabase
      .from('chat_questions')
      .update(updates as any)
      .eq('step', step)
      .select()
      .single();

    if (error) {
      throw error;
    }

    this.cache.invalidate();

    if (oldData) {
      await this.recordHistory(data.id, 'update', oldData, data);
    }

    return data;
  }

  async deleteQuestion(step: string): Promise<void> {
    if (this.useStaticFallback || !this.supabase) {
      const questions = await this.loadQuestions();
      questions.delete(step);

      // 클라이언트 사이드에서는 localStorage에서 삭제
      if (typeof window !== 'undefined') {
        ClientStorage.deleteQuestion(step);
      } else {
        await this.saveQuestionsToAPI(questions);
      }

      this.cache.invalidate();
      return;
    }

    const { data: oldData } = await this.supabase
      .from('chat_questions')
      .select('*')
      .eq('step', step)
      .single();

    const { error } = await this.supabase
      .from('chat_questions')
      .update({ is_active: false })
      .eq('step', step);

    if (error) {
      throw error;
    }

    this.cache.invalidate();

    if (oldData) {
      await this.recordHistory(oldData.id, 'delete', oldData, null);
    }
  }

  async reorderQuestions(steps: string[]): Promise<void> {
    if (this.useStaticFallback || !this.supabase) {
      if (this.cache.questions) {
        const reorderedMap = new Map<string, ChatQuestion>();
        steps.forEach((step, index) => {
          const question = this.cache.questions?.get(step);
          if (question) {
            reorderedMap.set(step, {
              ...question,
              order_index: index
            });
          }
        });
        this.cache.questions = reorderedMap;

        // 클라이언트 사이드에서는 localStorage에 저장
        if (typeof window !== 'undefined') {
          ClientStorage.reorderQuestions(steps);
        } else {
          // 서버 사이드에서는 API로 저장
          await this.saveQuestionsToAPI(reorderedMap);
        }
      }
      return;
    }

    const updates = steps.map((step, index) => ({
      step,
      order_index: index
    }));

    for (const update of updates) {
      await this.supabase
        .from('chat_questions')
        .update({ order_index: update.order_index } as any)
        .eq('step', update.step);
    }

    this.cache.invalidate();
  }

  async getQuestionHistory(questionId: string): Promise<ChatQuestionHistory[]> {
    if (this.useStaticFallback || !this.supabase) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('chat_questions_history')
      .select('*')
      .eq('question_id', questionId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Failed to load question history:', error);
      return [];
    }

    return data || [];
  }

  private async recordHistory(
    questionId: string,
    changeType: 'create' | 'update' | 'delete',
    oldData: ChatQuestion | null,
    newData: ChatQuestion | null
  ): Promise<void> {
    if (this.useStaticFallback || !this.supabase) return;

    try {
      await this.supabase
        .from('chat_questions_history')
        .insert([{
          question_id: questionId,
          change_type: changeType,
          old_data: oldData,
          new_data: newData,
          changed_by: 'admin'
        }]);
    } catch (error) {
      console.error('Failed to record history:', error);
    }
  }

  invalidateCache(): void {
    this.cache.invalidate();
  }

  private async loadQuestionsFromAPI(): Promise<Map<string, ChatQuestion> | null> {
    try {
      // 서버 사이드에서는 전체 URL 필요
      const baseUrl = typeof window === 'undefined'
        ? `http://localhost:${process.env.PORT || 3000}`
        : '';

      const response = await fetch(`${baseUrl}/api/admin/questions/file`, {
        method: 'GET'
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        const questionsMap = new Map<string, ChatQuestion>();
        data.questions.forEach((q: ChatQuestion) => {
          questionsMap.set(q.step, q);
        });
        return questionsMap;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private async saveQuestionsToAPI(questions: Map<string, ChatQuestion>): Promise<void> {
    try {
      const questionsArray = Array.from(questions.values()).sort((a, b) => a.order_index - b.order_index);

      // 서버 사이드에서는 전체 URL 필요
      const baseUrl = typeof window === 'undefined'
        ? `http://localhost:${process.env.PORT || 3000}`
        : '';

      await fetch(`${baseUrl}/api/admin/questions/file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: questionsArray
        })
      });
    } catch (error) {
      console.error('Failed to save questions to API:', error);
    }
  }
}

let serviceInstance: DynamicQuestionServiceImpl | null = null;

export function getDynamicQuestionService(): DynamicQuestionServiceImpl {
  if (!serviceInstance) {
    serviceInstance = new DynamicQuestionServiceImpl();
  }
  return serviceInstance;
}