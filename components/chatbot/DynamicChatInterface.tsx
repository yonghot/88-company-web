'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ProgressBar } from './ProgressBar';
import { QuickReplyOptions } from './QuickReplyOptions';
import { VerificationInput } from './VerificationInput';
import { Message, ChatState, LeadData } from '@/lib/types';
import { getDynamicChatFlow } from '@/lib/chat/dynamic-flow';
import { chatFlow as staticFlow, validateInput } from '@/lib/chat/flow';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

export function DynamicChatInterface() {
  const [chatState, setChatState] = useState<ChatState>({
    currentStep: 'welcome',
    messages: [],
    leadData: {},
    isCompleted: false
  });

  const [isTyping, setIsTyping] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [dynamicFlow, setDynamicFlow] = useState<any>(null);
  const [isLoadingFlow, setIsLoadingFlow] = useState(true);
  const [totalSteps, setTotalSteps] = useState(7); // 동적으로 계산될 전체 단계 수
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  useEffect(() => {
    loadDynamicFlow();

    // LocalStorage 변경 감지를 위한 이벤트 리스너
    const handleStorageChange = (e: StorageEvent) => {
      // 질문이 업데이트된 경우 다시 로드
      if (e.key === 'questionsUpdated' || e.key === 'chatQuestions') {
        // 캐시 무효화 및 재로드
        const flowService = getDynamicChatFlow();
        flowService.invalidateCache();
        loadDynamicFlow();
      }
    };

    // 같은 창 내에서의 LocalStorage 변경 감지를 위한 커스텀 이벤트
    const handleCustomStorageChange = () => {
      const flowService = getDynamicChatFlow();
      flowService.invalidateCache();
      loadDynamicFlow();
    };

    // 이벤트 리스너 등록
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('questionsUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('questionsUpdated', handleCustomStorageChange);
    };
  }, []);

  const loadDynamicFlow = async () => {
    setIsLoadingFlow(true);
    try {
      const flowService = getDynamicChatFlow();
      const flow = await flowService.getFlow();
      const startStep = await flowService.getStartStep();

      setDynamicFlow(flow);

      // 동적으로 전체 단계 수 계산
      const activeSteps = Object.keys(flow).filter(key => {
        // complete 단계는 제외하고 실제 질문 단계만 카운트
        return key !== 'complete' && key !== 'phoneVerification';
      });

      // phoneVerification은 phone 단계와 같이 계산되므로 +1 추가
      const calculatedSteps = activeSteps.length + 1; // +1 for verification
      setTotalSteps(calculatedSteps);

      setChatState(prev => ({
        ...prev,
        currentStep: startStep
      }));

      const welcomeStep = flow[startStep] || staticFlow.welcome;
      const welcomeMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: welcomeStep.question,
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [welcomeMessage]
      }));
    } catch (error) {
      // Using static flow when dynamic flow is not available (expected without Supabase)
      setDynamicFlow(staticFlow);

      // 정적 플로우의 단계 수 계산
      const staticSteps = Object.keys(staticFlow).filter(key => {
        return key !== 'complete' && key !== 'phoneVerification';
      });
      setTotalSteps(staticSteps.length + 1);

      const welcomeMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: staticFlow.welcome.question,
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        currentStep: 'welcome',
        messages: [welcomeMessage]
      }));
    } finally {
      setIsLoadingFlow(false);
    }
  };

  const getCurrentFlow = () => {
    return dynamicFlow || staticFlow;
  };

  const handleUserInput = async (value: string) => {
    const flow = getCurrentFlow();
    const currentStep = flow[chatState.currentStep];


    if (!currentStep) {
      const fallbackMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: '죄송합니다. 시스템 오류가 발생했습니다. 페이지를 새로고침해주세요.',
        timestamp: new Date()
      };
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, fallbackMessage]
      }));
      return;
    }

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

    setIsTyping(true);
    setTimeout(async () => {
      setIsTyping(false);

      // 디버깅: currentStep 정보 확인
      if (!currentStep.nextStep) {
        logger.error('❌ nextStep function is missing for step:', chatState.currentStep);
        logger.error('Current step data:', currentStep);
      }

      const nextStepId = currentStep.nextStep ? currentStep.nextStep(value) : null;
      logger.debug('Next step ID:', nextStepId, 'from step:', chatState.currentStep);

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
      } else {
        logger.error('❌ Next step not found or invalid:', nextStepId, 'Available steps:', Object.keys(flow));

        const fallbackFlow = staticFlow.welcome;
        const fallbackMessage: Message = {
          id: uuidv4(),
          type: 'bot',
          content: '문제가 발생했습니다. 다시 시작합니다.\n\n' + fallbackFlow.question,
          timestamp: new Date()
        };

        setChatState(prev => ({
          ...prev,
          currentStep: 'welcome',
          messages: [...prev.messages, fallbackMessage],
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

      const flow = getCurrentFlow();
      const completeStep = flow['complete'] || {
        question: '🎉 등록이 완료되었습니다!\n\n빠른 시일 내에 연락드리겠습니다.\n88 Company와 함께 성공적인 창업을 시작하세요!'
      };

      const thankYouMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: completeStep.question,
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, thankYouMessage],
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
    // 완료 상태면 전체 단계
    if (chatState.isCompleted) {
      return totalSteps;
    }

    const flow = getCurrentFlow();
    if (!flow) return 0;

    // 모든 질문 단계를 order_index 순으로 정렬
    const allSteps = Object.keys(flow)
      .filter(key => key !== 'complete' && key !== 'phoneVerification')
      .sort((a, b) => {
        const aStep = flow[a];
        const bStep = flow[b];
        // order_index가 있으면 사용, 없으면 기본 순서
        const aOrder = (aStep as any)?.order_index ?? 999;
        const bOrder = (bStep as any)?.order_index ?? 999;
        return aOrder - bOrder;
      });

    // 현재 단계의 인덱스 찾기
    let currentStepIndex = allSteps.indexOf(chatState.currentStep);

    // phoneVerification 상태일 때는 phone 단계 + 0.5로 계산
    if (chatState.currentStep === 'phoneVerification') {
      const phoneIndex = allSteps.indexOf('phone');
      currentStepIndex = phoneIndex >= 0 ? phoneIndex : allSteps.length - 1;
      // 검증 중일 때는 +0.5 진행률
      return Math.min(currentStepIndex + 1.5, totalSteps);
    }

    // welcome 상태에서 아직 답변이 없으면 0
    if (chatState.currentStep === 'welcome' &&
        chatState.messages.filter(msg => msg.type === 'user').length === 0) {
      return 0;
    }

    // 현재 단계까지 완료한 단계 수 (1-based indexing)
    return Math.min(currentStepIndex + 1, totalSteps);
  };

  if (isLoadingFlow) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  const flow = getCurrentFlow();
  const currentStep = flow[chatState.currentStep];

  if (!currentStep) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600">오류가 발생했습니다. 페이지를 새로고침해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {!chatState.isCompleted && (
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <ProgressBar currentStep={getProgressSteps()} totalSteps={totalSteps} />
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

      {!chatState.isCompleted && !isTyping && (
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