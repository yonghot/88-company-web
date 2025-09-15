import { createClient } from '@supabase/supabase-js';
import { ChatQuestion, ChatFlow, DynamicQuestionService, QuestionCache, CACHE_TTL } from './dynamic-types';
import { chatQuestions as staticQuestions } from './questions';

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
  private supabase: any;
  private cache: QuestionCache;
  private useStaticFallback: boolean = false;

  constructor() {
    this.cache = new QuestionCacheImpl();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      console.warn('Supabase not configured, using static questions as fallback');
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
      data.forEach((q: any) => {
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
        start_step: 'service_type',
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
          start_step: 'service_type',
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
      throw new Error('Cannot save questions in static mode');
    }

    const { data, error } = await this.supabase
      .from('chat_questions')
      .insert([question])
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
      throw new Error('Cannot update questions in static mode');
    }

    const { data: oldData } = await this.supabase
      .from('chat_questions')
      .select('*')
      .eq('step', step)
      .single();

    const { data, error } = await this.supabase
      .from('chat_questions')
      .update(updates)
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
      throw new Error('Cannot delete questions in static mode');
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
      throw new Error('Cannot reorder questions in static mode');
    }

    const updates = steps.map((step, index) => ({
      step,
      order_index: index
    }));

    for (const update of updates) {
      await this.supabase
        .from('chat_questions')
        .update({ order_index: update.order_index })
        .eq('step', update.step);
    }

    this.cache.invalidate();
  }

  async getQuestionHistory(questionId: string): Promise<any[]> {
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
}

let serviceInstance: DynamicQuestionServiceImpl | null = null;

export function getDynamicQuestionService(): DynamicQuestionServiceImpl {
  if (!serviceInstance) {
    serviceInstance = new DynamicQuestionServiceImpl();
  }
  return serviceInstance;
}