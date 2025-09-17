'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ProgressBar } from './ProgressBar';
import { QuickReplyOptions } from './QuickReplyOptions';
import { VerificationInput } from './VerificationInput';
import { Message, ChatState, LeadData } from '@/lib/types';
import { questionManager } from '@/lib/chat/question-manager';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles } from 'lucide-react';

export function SimpleChatInterface() {
  const [chatState, setChatState] = useState<ChatState>({
    currentStep: 'welcome',
    messages: [],
    leadData: {},
    isCompleted: false
  });

  const [isTyping, setIsTyping] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [flow, setFlow] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  // 초기 로드 및 업데이트 감지
  useEffect(() => {
    const loadFlow = () => {
      const newFlow = questionManager.getFlow();
      setFlow(newFlow);

      // 첫 번째 질문 표시
      if (chatState.messages.length === 0 && newFlow['welcome']) {
        const welcomeMessage: Message = {
          id: uuidv4(),
          type: 'bot',
          content: newFlow['welcome'].question,
          timestamp: new Date()
        };

        setChatState(prev => ({
          ...prev,
          messages: [welcomeMessage]
        }));
      }
    };

    loadFlow();

    // 질문 업데이트 감지
    const handleQuestionsUpdate = () => {
      const newFlow = questionManager.getFlow();
      setFlow(newFlow);
    };

    window.addEventListener('questionsUpdated', handleQuestionsUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'questions_updated' || e.key === 'chat_questions') {
        handleQuestionsUpdate();
      }
    });

    return () => {
      window.removeEventListener('questionsUpdated', handleQuestionsUpdate);
    };
  }, []);

  const handleUserInput = async (value: string) => {
    const currentStep = flow[chatState.currentStep];
    if (!currentStep) return;

    // 검증
    if (currentStep.validation && !currentStep.validation(value)) {
      const errorMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: '입력하신 정보가 올바르지 않습니다. 다시 확인해주세요.',
        timestamp: new Date()
      };
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
      return;
    }

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: uuidv4(),
      type: 'user',
      content: value,
      timestamp: new Date()
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    // 리드 데이터 업데이트
    const updatedLeadData: LeadData = { ...chatState.leadData };
    const stepMapping: Record<string, keyof LeadData> = {
      'welcome': 'service',
      'customService': 'service',
      'budget': 'budget',
      'timeline': 'timeline',
      'details': 'message',
      'name': 'name',
      'phone': 'phone'
    };

    const dataKey = stepMapping[chatState.currentStep];
    if (dataKey) {
      (updatedLeadData as any)[dataKey] = value;
    }

    if (chatState.currentStep === 'phone') {
      setPhoneNumber(value);
    }

    // 타이핑 효과
    setIsTyping(true);
    setTimeout(async () => {
      setIsTyping(false);

      const nextStepId = currentStep.nextStep ? currentStep.nextStep(value) : 'complete';

      if (nextStepId === 'complete' || chatState.currentStep === 'complete') {
        setChatState(prev => ({
          ...prev,
          isCompleted: true,
          leadData: updatedLeadData
        }));
      } else if (nextStepId && flow[nextStepId]) {
        const nextStep = flow[nextStepId];
        const botMessage: Message = {
          id: uuidv4(),
          type: 'bot',
          content: nextStep.question,
          timestamp: new Date()
        };

        setChatState(prev => ({
          ...prev,
          currentStep: nextStepId,
          messages: [...prev.messages, botMessage],
          leadData: updatedLeadData
        }));
      }
    }, 1000);
  };

  const handleVerificationComplete = async (code: string) => {
    const updatedLeadData: LeadData = {
      ...chatState.leadData,
      phone: phoneNumber,
      verified: true
    };

    try {
      const leadId = phoneNumber.replace(/[^0-9]/g, '');

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedLeadData,
          id: leadId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save lead');
      }

      const completeMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: flow['complete']?.question || '🎉 등록이 완료되었습니다! 빠른 시일 내에 연락드리겠습니다.',
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, completeMessage],
        leadData: updatedLeadData,
        isCompleted: true
      }));
    } catch (error) {
      console.error('Error saving lead:', error);

      const errorMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: '죄송합니다. 등록 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    }
  };

  const getProgressSteps = () => {
    // 동적으로 총 단계 수 계산
    const questions = questionManager.getQuestions();
    const activeQuestions = questions.filter(q => q.is_active !== false);

    // customService는 조건부이므로 제외
    const mainQuestions = activeQuestions.filter(q => q.step !== 'customService');

    // phoneVerification은 자동으로 추가되므로 +1
    const hasPhoneStep = mainQuestions.some(q => q.step === 'phone');
    const totalSteps = mainQuestions.length + (hasPhoneStep ? 1 : 0);

    // 현재 단계의 인덱스 찾기 (customService 제외된 목록에서)
    const currentQuestionIndex = mainQuestions.findIndex(q => q.step === chatState.currentStep);

    // 특수 단계 처리
    if (chatState.currentStep === 'phoneVerification') {
      return totalSteps - 1; // 마지막에서 두 번째
    }

    if (chatState.currentStep === 'complete') {
      return totalSteps; // 마지막
    }

    // customService는 진행도에 포함하지 않지만 현재 단계일 때는 이전 단계 유지
    if (chatState.currentStep === 'customService') {
      // welcome과 같은 진행도로 처리 (옵션 선택 중)
      return 1;
    }

    // 일반 질문의 경우
    if (currentQuestionIndex !== -1) {
      return currentQuestionIndex + 1;
    }

    // 사용자 메시지 수로 폴백
    const userMessageCount = chatState.messages.filter(msg => msg.type === 'user').length;
    return Math.min(userMessageCount, totalSteps);
  };

  const getTotalSteps = () => {
    const questions = questionManager.getQuestions();
    const activeQuestions = questions.filter(q => q.is_active !== false);

    // customService는 조건부이므로 제외 (선택적)
    const mainQuestions = activeQuestions.filter(q => q.step !== 'customService');

    // phoneVerification은 자동으로 추가되므로 +1
    const hasPhoneStep = mainQuestions.some(q => q.step === 'phone');
    return mainQuestions.length + (hasPhoneStep ? 1 : 0);
  };

  const currentStep = flow[chatState.currentStep];

  if (!currentStep && !chatState.isCompleted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {!chatState.isCompleted && (
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <ProgressBar currentStep={getProgressSteps()} totalSteps={getTotalSteps()} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {chatState.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && (
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm">입력 중...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!chatState.isCompleted && !isTyping && currentStep && (
        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            {currentStep.inputType === 'select' && currentStep.options && (
              <QuickReplyOptions
                options={currentStep.options}
                onSelect={handleUserInput}
              />
            )}
            {currentStep.inputType !== 'select' && chatState.currentStep !== 'phone' && (
              <ChatInput
                currentStep={currentStep}
                onSubmit={handleUserInput}
              />
            )}
            {chatState.currentStep === 'phone' && (
              <VerificationInput
                phoneNumber={phoneNumber}
                onVerify={handleVerificationComplete}
              />
            )}
          </div>
        </div>
      )}

      {chatState.isCompleted && (
        <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-600" />
              <p className="text-gray-600 dark:text-gray-400">상담이 완료되었습니다</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                새로운 상담 시작하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}