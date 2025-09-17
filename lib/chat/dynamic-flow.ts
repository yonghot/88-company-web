import { ChatStep } from './types';
import { getDynamicQuestionService } from './dynamic-question-service';
import { ChatQuestion } from './dynamic-types';
import { chatFlow as staticFlow } from './flow';
import { logger } from '@/lib/utils/logger';

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
      logger.error('Failed to load dynamic questions:', error);
      this.questionsMap = null;
    }
  }

  async getFlow(): Promise<Record<string, ChatStep>> {
    await this.ensureLoaded();

    // 동적 질문이 로드되지 않았거나 비어있으면 정적 플로우 사용
    if (!this.questionsMap || this.questionsMap.size === 0) {
      return staticFlow;
    }

    // 동적 질문을 ChatStep 형식으로 변환
    const dynamicFlow: Record<string, ChatStep> = {};

    // 질문들을 order_index 순으로 정렬
    const sortedQuestions = Array.from(this.questionsMap.values())
      .sort((a, b) => a.order_index - b.order_index);

    sortedQuestions.forEach((question, index) => {
      const step = this.convertQuestionToStep(question);

      // next_step이 없으면 다음 순서의 질문으로 자동 설정
      if (!question.next_step && index < sortedQuestions.length - 1) {
        const nextQuestion = sortedQuestions[index + 1];
        step.nextStep = () => nextQuestion.step;
      } else if (question.next_step) {
        // 동적 next_step 처리 (조건부 로직 포함)
        step.nextStep = (value?: string) => {
          // welcome 단계에서 '기타 문의' 선택 시 customService로 이동
          if (question.step === 'welcome' && value === '기타 문의') {
            return 'customService';
          }
          // phone 단계 후 phoneVerification으로 이동
          if (question.step === 'phone') {
            return 'phoneVerification';
          }
          return question.next_step || 'complete';
        };
      }

      dynamicFlow[question.step] = step;
    });

    // phoneVerification 단계가 없으면 정적 플로우에서 추가
    if (!dynamicFlow['phoneVerification'] && staticFlow['phoneVerification']) {
      dynamicFlow['phoneVerification'] = staticFlow['phoneVerification'];
    }

    // complete 단계가 없으면 정적 플로우에서 추가
    if (!dynamicFlow['complete'] && staticFlow['complete']) {
      dynamicFlow['complete'] = staticFlow['complete'];
    }

    return dynamicFlow;
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
    return 'welcome';
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