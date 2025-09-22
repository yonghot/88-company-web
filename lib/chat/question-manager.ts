import { ChatStep } from './types';
import { ChatQuestion } from './dynamic-types';

export interface QuestionManager {
  getQuestions(): ChatQuestion[];
  saveQuestions(questions: ChatQuestion[]): void;
  getFlow(): Record<string, ChatStep>;
  clearCache(): void;
}

export class LocalStorageQuestionManager implements QuestionManager {
  private static instance: LocalStorageQuestionManager;
  private readonly STORAGE_KEY = 'chat_questions';
  private readonly UPDATE_KEY = 'questions_updated';

  private constructor() {}

  static getInstance(): LocalStorageQuestionManager {
    if (!this.instance) {
      this.instance = new LocalStorageQuestionManager();
    }
    return this.instance;
  }

  private memoryStorage: ChatQuestion[] | null = null;

  getQuestions(): ChatQuestion[] {
    if (typeof window === 'undefined') {
      // Node.js 환경에서는 메모리 스토리지 사용
      if (!this.memoryStorage) {
        this.memoryStorage = this.getDefaultQuestions();
      }
      return this.memoryStorage;
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
      // Keep critical error logging for debugging
      console.error('Failed to load questions:', error);
    }

    // 저장된 질문이 없으면 기본 질문 사용
    const defaultQuestions = this.getDefaultQuestions();
    this.saveQuestions(defaultQuestions);
    return defaultQuestions;
  }

  saveQuestions(questions: ChatQuestion[]): void {
    if (typeof window === 'undefined') {
      // Node.js 환경에서는 메모리에만 저장
      this.memoryStorage = questions;
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(questions));
      // 업데이트 이벤트 발생
      localStorage.setItem(this.UPDATE_KEY, Date.now().toString());
      window.dispatchEvent(new Event('questionsUpdated'));
    } catch (error) {
      // Keep critical error logging for debugging
      console.error('Failed to save questions:', error);
    }
  }

  getFlow(): Record<string, ChatStep> {
    const allQuestions = this.getQuestions();
    const flow: Record<string, ChatStep> = {};

    // 유효한 step ID 수집
    const validStepIds = new Set(allQuestions.map(q => q.step));
    validStepIds.add('phoneVerification');
    validStepIds.add('complete');
    validStepIds.add('customService');

    // 활성 질문만 필터링 (단, 모든 질문에 대한 flow는 생성)
    const activeQuestions = allQuestions
      .filter(q => q.is_active !== false)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    // 모든 질문에 대해 flow 생성
    allQuestions
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .forEach((question, index) => {
        // 다음 활성 질문 찾기
        const currentActiveIndex = activeQuestions.findIndex(q => q.step === question.step);
        const nextActiveQuestion = currentActiveIndex !== -1 && currentActiveIndex < activeQuestions.length - 1
          ? activeQuestions[currentActiveIndex + 1]
          : null;

        flow[question.step] = {
          id: question.step,
          question: question.question,
          inputType: this.getInputType(question),
          placeholder: question.placeholder,
          options: question.options,
          validation: this.getValidation(question),
          nextStep: this.createNextStepFunction(question, nextActiveQuestion || undefined, validStepIds)
        };
      });

    // phoneVerification 단계 추가 (하드코딩)
    if (flow['phone'] && !flow['phoneVerification']) {
      flow['phoneVerification'] = {
        id: 'phoneVerification',
        question: '📱 인증번호 6자리를 입력해주세요.',
        inputType: 'text',
        placeholder: '인증번호 6자리',
        validation: (value: string) => /^[0-9]{6}$/.test(value),
        nextStep: () => 'complete'
      };

      // phone의 nextStep을 phoneVerification으로 변경
      const originalPhoneNextStep = flow['phone'].nextStep;
      flow['phone'].nextStep = () => 'phoneVerification';
    }

    // complete 단계 보장
    if (!flow['complete']) {
      flow['complete'] = {
        id: 'complete',
        question: '감사합니다! 입력하신 정보를 확인했습니다. 빠른 시일 내에 연락드리겠습니다. 😊',
        inputType: 'text',
        nextStep: () => 'complete'
      };
    }

    return flow;
  }

  clearCache(): void {
    // 캐시 개념 제거 - 항상 최신 데이터 사용
  }

  private getInputType(question: ChatQuestion): ChatStep['inputType'] {
    // step 이름으로 타입 결정
    if (question.step === 'phone') {
      return 'phone';
    }

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

    if (question.step === 'phone') {
      return (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers.length === 11 && numbers.startsWith('010');
      };
    }

    if (question.validation?.required) {
      return (value: string) => {
        if (!value || value.trim() === '') return false;
        return true;
      };
    }

    return undefined;
  }

  private createNextStepFunction(
    question: ChatQuestion,
    nextQuestion?: ChatQuestion,
    validStepIds?: Set<string>
  ): (value?: string) => string {
    return (value?: string) => {
      // 특수 단계 처리
      if (question.step === 'phone') {
        return 'phoneVerification';
      }

      if (question.step === 'phoneVerification') {
        return 'complete';
      }

      // welcome 단계에서 customService가 비활성화된 경우 처리
      if (question.step === 'welcome') {
        // customService가 비활성화되었으므로, 모든 선택지가 다음 질문으로 이동
        if (nextQuestion) {
          return nextQuestion.step;
        }
      }

      // 조건부 분기 처리 (customService가 활성화된 경우에만)
      if (question.step === 'welcome' && value) {
        const customServiceQuestion = this.getQuestions().find(q => q.step === 'customService');
        if (customServiceQuestion && customServiceQuestion.is_active !== false) {
          // customService가 활성화된 경우에만 분기 처리
          if (value === '기타 문의') {
            return 'customService';
          }
        }
      }

      // 동적 질문 편집을 위해 순서에 따른 다음 질문을 우선 사용
      // nextQuestion은 order_index에 따른 다음 질문임
      if (nextQuestion) {
        return nextQuestion.step;
      }

      // 다음 질문이 없으면 명시적 next_step 확인 (호환성을 위해)
      if (question.next_step) {
        // next_step이 유효한지 확인
        if (validStepIds && !validStepIds.has(question.next_step) && question.next_step !== 'complete') {
          // Invalid next_step, falling back to complete
          return 'complete';
        }
        return question.next_step;
      }

      // 기본값
      return 'complete';
    };
  }

  private getDefaultQuestions(): ChatQuestion[] {
    return [
      {
        step: 'welcome',
        type: 'select',
        question: '안녕하세요! 88입니다. 어떤 서비스를 찾고 계신가요?',
        options: ['창업 컨설팅', '경영 전략 수립', '마케팅 전략', '투자 유치 지원', '기타 문의'],
        next_step: '',  // 동적으로 다음 질문을 찾음
        is_active: true,
        order_index: 0,
        placeholder: ''
      },
      {
        step: 'customService',
        type: 'textarea',
        question: '어떤 도움이 필요하신지 자세히 알려주세요.',
        placeholder: '필요하신 서비스를 자세히 설명해주세요...',
        next_step: 'budget',
        is_active: false,  // 비활성화 - 모든 선택지가 동일한 플로우를 따름
        order_index: 1
      },
      {
        step: 'budget',
        type: 'select',
        question: '예상하시는 예산 규모는 어느 정도인가요?',
        options: ['500만원 미만', '500만원 - 1,000만원', '1,000만원 - 3,000만원', '3,000만원 - 5,000만원', '5,000만원 이상', '협의 필요'],
        next_step: 'timeline',
        is_active: true,
        order_index: 2,
        placeholder: ''
      },
      {
        step: 'timeline',
        type: 'select',
        question: '프로젝트는 언제 시작하실 예정인가요?',
        options: ['즉시 시작', '1주일 이내', '1개월 이내', '3개월 이내', '아직 미정'],
        next_step: 'details',
        is_active: true,
        order_index: 3,
        placeholder: ''
      },
      {
        step: 'details',
        type: 'textarea',
        question: '프로젝트에 대해 추가로 알려주실 내용이 있나요?',
        placeholder: '현재 상황, 목표, 특별한 요구사항 등을 자유롭게 작성해주세요...',
        next_step: 'name',
        is_active: true,
        order_index: 4
      },
      {
        step: 'name',
        type: 'text',
        question: '성함을 알려주세요.',
        placeholder: '홍길동',
        next_step: 'phone',
        is_active: true,
        order_index: 5
      },
      {
        step: 'phone',
        type: 'text',
        question: '연락 가능한 전화번호를 입력해주세요.',
        placeholder: '010-0000-0000',
        next_step: 'complete',
        is_active: true,
        order_index: 6
      }
    ];
  }
}

// 전역 인스턴스 export
export const questionManager = LocalStorageQuestionManager.getInstance();