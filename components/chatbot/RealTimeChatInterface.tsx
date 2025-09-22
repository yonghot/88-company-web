'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ProgressBar } from './ProgressBar';
import { QuickReplyOptions } from './QuickReplyOptions';
import { VerificationInput } from './VerificationInput';
import { Message, ChatState, LeadData, ChatFlowMap, ChatFlowStep, ChatStep } from '@/lib/types';
import { enhancedRealtimeService } from '@/lib/chat/enhanced-realtime-service';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles } from 'lucide-react';

export function RealTimeChatInterface() {
  const [isInitialized, setIsInitialized] = useState(false); // 초기화 상태 추가
  const [chatState, setChatState] = useState<ChatState>({
    currentStep: '',  // 빈 문자열로 시작
    messages: [],
    leadData: {},
    isCompleted: false
  });

  const [isTyping, setIsTyping] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [showVerification, setShowVerification] = useState(false);
  const [chatFlow, setChatFlow] = useState<ChatFlowMap>({});
  const [totalSteps, setTotalSteps] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  const initializeChat = useCallback((flow: ChatFlowMap) => {
    const firstStep = Object.keys(flow)[0];
    if (!firstStep) return;

    const welcomeStep = flow[firstStep];
    const welcomeMessage: Message = {
      id: uuidv4(),
      type: 'bot',
      content: welcomeStep.question,
      timestamp: new Date()
    };

    setChatState({
      currentStep: firstStep,
      messages: [welcomeMessage],
      leadData: {},
      isCompleted: false
    });
  }, []);

  // 질문 초기 로드 (페이지 로드 시에만)
  useEffect(() => {
    const loadFlow = async () => {
      // Starting initialization

      // 초기화 완료 확인을 위한 폴링 (최대 10초)
      let attempts = 0;
      const maxAttempts = 100;  // 100ms * 100 = 10초

      while (!enhancedRealtimeService.isInitialized() && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!enhancedRealtimeService.isInitialized()) {
        // Service initialization timeout
        setIsInitialized(true);  // 타임아웃이어도 에러 화면 표시를 위해 설정
        return;
      }

      // Service initialized, loading flow

      // 서비스가 준비되었으니 데이터 로드
      const flow = enhancedRealtimeService.getChatFlow();
      const steps = enhancedRealtimeService.getTotalSteps();

      // Flow loaded successfully

      setChatFlow(flow as ChatFlowMap);
      setTotalSteps(steps);

      // 첫 로드 시 시작 메시지 표시
      if (Object.keys(flow).length > 0) {
        initializeChat(flow);
        setIsInitialized(true);  // 초기화 완료 표시
      } else {
        // No questions loaded from database
        // 데이터가 없어도 초기화 완료로 표시 (에러 화면 표시용)
        setIsInitialized(true);
      }
    };

    // 초기 로드만 수행 (실시간 동기화 제거)
    loadFlow();

    // 클린업: 실시간 구독 및 이벤트 리스너 모두 제거
  }, [initializeChat]);

  // 챗봇 리셋 처리 제거 (자동 리셋 방지)

  const handleUserInput = async (value: string) => {
    const currentStep = chatFlow[chatState.currentStep];
    if (!currentStep) return;

    // 입력 검증
    if (currentStep.validation && !currentStep.validation(value)) {
      let errorContent = '입력하신 정보가 올바르지 않습니다. 다시 확인해주세요.';

      // 전화번호 검증 실패 시 더 구체적인 메시지
      if (chatState.currentStep === 'phone') {
        errorContent = '📱 올바른 휴대폰 번호 형식이 아닙니다.\n\n✅ 올바른 형식:\n• 010-1234-5678\n• 01012345678\n• 010 1234 5678\n\n⚠️ 현재 010으로 시작하는 번호만 지원합니다.\n다시 입력해주세요.';
      }

      const errorMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: errorContent,
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
      messages: [...prev.messages, userMessage],
      leadData: { ...prev.leadData, [chatState.currentStep]: value }
    }));

    // 타이핑 효과
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsTyping(false);

    // 다음 단계로 이동
    const nextStepId = typeof currentStep.nextStep === 'function'
      ? currentStep.nextStep(value)
      : currentStep.nextStep || 'complete';

    if (nextStepId === 'complete') {
      await saveLeadData({ ...chatState.leadData, [chatState.currentStep]: value });
      return;
    }

    const nextStep = chatFlow[nextStepId];
    if (nextStep) {
      const botMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: nextStep.question,
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        currentStep: nextStepId,
        messages: [...prev.messages, botMessage]
      }));

      if (nextStepId === 'phone') {
        setShowVerification(false);
      }
    }
  };

  const handlePhoneSubmit = (phone: string) => {
    setPhoneNumber(phone);
    setShowVerification(true);
  };

  const handleVerificationComplete = async () => {
    // 인증 완료 처리
    const updatedLeadData: LeadData = {
      ...chatState.leadData,
      phone: phoneNumber,
      verified: true
    };

    await saveLeadData(updatedLeadData);
  };

  const saveLeadData = async (leadData: LeadData) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...leadData,
          verified: true,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save lead');
      }

      const completeStep = chatFlow['complete'] || {
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
        leadData: leadData,
        isCompleted: true
      }));
    } catch (error) {
      // Keep critical error logging for debugging
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
    if (chatState.isCompleted) return totalSteps;

    // 사용자가 답변한 메시지 수를 진행도로 사용
    const userMessageCount = chatState.messages.filter(m => m.type === 'user').length;

    // 답변한 수가 총 단계 수를 초과하지 않도록 제한
    return Math.min(userMessageCount, totalSteps);
  };

  // 초기화가 완료되지 않았거나 데이터가 없으면 로딩 화면 표시
  if (!isInitialized || Object.keys(chatFlow).length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">
            {!isInitialized ? '초기화 중...' : '로딩 중...'}
          </p>
        </div>
      </div>
    );
  }

  const currentStep = chatFlow[chatState.currentStep];

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {!chatState.isCompleted && (
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
          <div className="max-w-4xl mx-auto">
            <ProgressBar currentStep={getProgressSteps()} totalSteps={totalSteps} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
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
              <span className="text-xs sm:text-sm">입력 중...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {!chatState.isCompleted && !isTyping && currentStep && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-3 sm:px-4 py-3 sm:py-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            {currentStep.inputType === 'select' && currentStep.options && (
              <QuickReplyOptions
                options={currentStep.options as string[]}
                onSelect={handleUserInput}
              />
            )}
            {currentStep.inputType !== 'select' && chatState.currentStep !== 'phone' && (
              <ChatInput
                currentStep={currentStep as ChatStep}
                onSubmit={handleUserInput}
              />
            )}
            {chatState.currentStep === 'phone' && !showVerification && (
              <ChatInput
                currentStep={currentStep as ChatStep}
                onSubmit={handlePhoneSubmit}
              />
            )}
            {chatState.currentStep === 'phone' && showVerification && phoneNumber && (
              <VerificationInput
                phoneNumber={phoneNumber}
                onVerify={handleVerificationComplete}
                onBack={() => {
                  setShowVerification(false);
                  setPhoneNumber('');
                  // 전화번호 다시 입력 안내 메시지 추가
                  const retryMessage: Message = {
                    id: uuidv4(),
                    type: 'bot',
                    content: '📱 올바른 휴대폰 번호를 다시 입력해주세요.\n(010으로 시작하는 11자리 번호)',
                    timestamp: new Date()
                  };
                  setChatState(prev => ({
                    ...prev,
                    messages: [...prev.messages, retryMessage]
                  }));
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}