// 클라이언트 사이드 저장소 (localStorage 기반)

import { ChatQuestion } from '@/lib/chat/dynamic-types';

const STORAGE_KEY = 'admin_questions';

export class ClientStorage {
  static saveQuestions(questions: ChatQuestion[]): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        questions,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static loadQuestions(): ChatQuestion[] | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return data.questions || null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  static deleteQuestion(step: string): void {
    const questions = this.loadQuestions();
    if (!questions) return;

    const filtered = questions.filter(q => q.step !== step);
    this.saveQuestions(filtered);
  }

  static updateQuestion(step: string, updates: Partial<ChatQuestion>): ChatQuestion | null {
    const questions = this.loadQuestions();
    if (!questions) return null;

    const index = questions.findIndex(q => q.step === step);
    if (index === -1) return null;

    questions[index] = { ...questions[index], ...updates };
    this.saveQuestions(questions);
    return questions[index];
  }

  static reorderQuestions(steps: string[]): void {
    const questions = this.loadQuestions();
    if (!questions) return;

    const questionsMap = new Map(questions.map(q => [q.step, q]));
    const reordered = steps.map((step, index) => {
      const question = questionsMap.get(step);
      if (question) {
        return { ...question, order_index: index };
      }
      return null;
    }).filter(q => q !== null) as ChatQuestion[];

    this.saveQuestions(reordered);
  }

  static addQuestion(question: ChatQuestion): void {
    const questions = this.loadQuestions() || [];
    questions.push(question);
    this.saveQuestions(questions);
  }
}