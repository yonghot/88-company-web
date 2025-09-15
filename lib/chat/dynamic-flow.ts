import { ChatStep } from './types';
import { getDynamicQuestionService } from './dynamic-question-service';
import { ChatQuestion } from './dynamic-types';
import { chatFlow as staticFlow } from './flow';

export class DynamicChatFlow {
  private questionsMap: Map<string, ChatQuestion> | null = null;
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;

  private async ensureLoaded(): Promise<void> {
    if (this.questionsMap) return;

    if (this.isLoading && this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.isLoading = true;
    this.loadPromise = this.loadQuestions();
    await this.loadPromise;
    this.isLoading = false;
  }

  private async loadQuestions(): Promise<void> {
    try {
      const service = getDynamicQuestionService();
      this.questionsMap = await service.loadQuestions();
    } catch (error) {
      console.error('Failed to load dynamic questions:', error);
      this.questionsMap = null;
    }
  }

  async getFlow(): Promise<Record<string, ChatStep>> {
    await this.ensureLoaded();

    if (!this.questionsMap || this.questionsMap.size === 0) {
      console.warn('Using static flow as fallback');
      return staticFlow;
    }

    const flow: Record<string, ChatStep> = {};

    this.questionsMap.forEach((question, step) => {
      flow[step] = this.convertQuestionToStep(question);
    });

    return flow;
  }

  private convertQuestionToStep(question: ChatQuestion): ChatStep {
    const step: ChatStep = {
      id: question.step,
      question: question.question,
      inputType: this.mapQuestionType(question.type),
      nextStep: () => question.next_step || ''
    };

    if (question.placeholder) {
      step.placeholder = question.placeholder;
    }

    if (question.options && question.options.length > 0) {
      step.options = question.options;
    }

    if (question.validation) {
      if (question.validation.required) {
        step.validation = (value: string) => {
          if (!value || value.trim() === '') return false;

          if (question.validation?.minLength && value.length < question.validation.minLength) {
            return false;
          }

          if (question.validation?.maxLength && value.length > question.validation.maxLength) {
            return false;
          }

          if (question.validation?.pattern) {
            const regex = new RegExp(question.validation.pattern);
            return regex.test(value);
          }

          return true;
        };
      }
    }

    if (question.type === 'verification') {
      step.inputType = 'phone';
    }

    return step;
  }

  private mapQuestionType(type: ChatQuestion['type']): ChatStep['inputType'] {
    switch (type) {
      case 'text':
        return 'text';
      case 'textarea':
        return 'textarea';
      case 'select':
      case 'quick-reply':
        return 'select';
      case 'verification':
        return 'text';
      default:
        return 'text';
    }
  }

  async getStartStep(): Promise<string> {
    try {
      const service = getDynamicQuestionService();
      const flow = await service.loadFlow();
      return flow?.start_step || 'service_type';
    } catch (error) {
      console.error('Failed to get start step:', error);
      return 'welcome';
    }
  }

  async getQuestion(step: string): Promise<ChatQuestion | null> {
    await this.ensureLoaded();

    if (!this.questionsMap) {
      return null;
    }

    return this.questionsMap.get(step) || null;
  }

  invalidateCache(): void {
    this.questionsMap = null;
    const service = getDynamicQuestionService();
    service.invalidateCache();
  }
}

let flowInstance: DynamicChatFlow | null = null;

export function getDynamicChatFlow(): DynamicChatFlow {
  if (!flowInstance) {
    flowInstance = new DynamicChatFlow();
  }
  return flowInstance;
}