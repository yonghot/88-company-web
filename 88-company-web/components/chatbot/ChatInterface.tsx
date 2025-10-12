'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ProgressBar } from './ProgressBar';
import { QuickReplyOptions } from './QuickReplyOptions';
import { VerificationInput } from './VerificationInput';
import { Message, ChatState, LeadData, ChatFlowMap, ChatStep } from '@/lib/types';
import { staticQuestionService } from '@/lib/chat/static-question-service';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles } from 'lucide-react';
import { MetaPixelDebug } from '../MetaPixelDebug';

export function ChatInterface() {
  const [isLoading, setIsLoading] = useState(true);
  const [chatState, setChatState] = useState<ChatState>({
    currentStep: '',
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
    if (!firstStep) {
      console.error('[ChatInterface] No first step found in flow');
      return;
    }

    const messages: Message[] = [];

    const welcomeQuestion = staticQuestionService.getWelcomeMessage();
    if (welcomeQuestion) {
      const welcomeMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: welcomeQuestion.question,
        timestamp: new Date()
      };
      messages.push(welcomeMessage);
      console.log('[ChatInterface] ✅ Welcome message added (order_index=0)');
      console.log('[ChatInterface] Welcome content:', welcomeQuestion.question.substring(0, 50) + '...');
    } else {
      console.warn('[ChatInterface] ⚠️ No welcome message found (order_index=0)');
      console.warn('[ChatInterface] Please run: npx tsx scripts/add-welcome-final.ts');
    }

    const firstQuestionStep = flow[firstStep];
    const firstQuestionMessage: Message = {
      id: uuidv4(),
      type: 'bot',
      content: firstQuestionStep.question,
      timestamp: new Date()
    };
    messages.push(firstQuestionMessage);
    console.log('[ChatInterface] ✅ First question added:', firstStep);
    console.log('[ChatInterface] Total initial messages:', messages.length);

    setChatState({
      currentStep: firstStep,
      messages,
      leadData: {},
      isCompleted: false
    });

    console.log('[ChatInterface] 🎯 Chat initialized');
    console.log('[ChatInterface] - Current step:', firstStep);
    console.log('[ChatInterface] - Messages displayed:', messages.length);
    console.log('[ChatInterface] - User will answer:', firstQuestionStep.question.substring(0, 50) + '...');
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        console.log('[ChatInterface] Loading questions from database...');
        await staticQuestionService.loadQuestions();

        const flow = staticQuestionService.getChatFlow();
        const steps = staticQuestionService.getTotalSteps();

        console.log('[ChatInterface] Loaded', steps, 'questions');

        setChatFlow(flow as ChatFlowMap);
        setTotalSteps(steps);

        if (Object.keys(flow).length > 0) {
          initializeChat(flow);
        } else {
          console.warn('[ChatInterface] No questions loaded from database');
        }
      } catch (error) {
        console.error('[ChatInterface] Failed to load questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [initializeChat]);

  const handleUserInput = async (value: string) => {
    const currentStep = chatFlow[chatState.currentStep];
    if (!currentStep) return;

    if (currentStep.validation && !currentStep.validation(value)) {
      let errorContent = '입력하신 정보가 올바르지 않습니다. 다시 확인해주세요.';

      if (chatState.currentStep === 'phone') {
        errorContent = '📱 올바른 휴대폰 번호 형식이 아닙니다.\n\n✅ 올바른 형식:\n• 010-1234-5678\n• 01012345678\n• 010 1234 5678\n\n⚠️ 휴대폰 번호(010, 011, 016, 017, 018, 019)를 입력해주세요.\n다시 입력해주세요.';
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

    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsTyping(false);

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
    console.log('[ChatInterface] Phone submitted:', phone);
    setPhoneNumber(phone);
    setShowVerification(true);
  };

  const handleVerificationComplete = async () => {
    console.log('[ChatInterface] 🎯 handleVerificationComplete 호출됨');
    console.log('[ChatInterface] 전화번호:', phoneNumber);
    console.log('[ChatInterface] 기존 리드 데이터:', chatState.leadData);

    const updatedLeadData: LeadData = {
      ...chatState.leadData,
      phone: phoneNumber,
      verified: true
    };

    console.log('[ChatInterface] 💾 saveLeadData 호출 시작...');
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

      console.log('[ChatInterface] ✅ Lead saved successfully to database');

      try {
        console.log('[ChatInterface] 🔍 Meta Pixel 확인 중...');
        console.log('[ChatInterface] - window 객체:', typeof window);
        console.log('[ChatInterface] - window.fbq 존재:', typeof window !== 'undefined' && !!window.fbq);

        if (typeof window !== 'undefined' && window.fbq) {
          console.log('[ChatInterface] 📤 Meta Pixel Lead 이벤트 발송 시작...');
          window.fbq('track', 'Lead', {
            content_name: '88 Company 상담 신청',
            content_category: '정부지원사업 컨설팅',
            value: 0,
            currency: 'KRW',
          });
          console.log('[ChatInterface] ✅ Meta Pixel Lead event sent');

          console.log('[ChatInterface] ⏳ 네트워크 요청 완료 대기 중 (300ms)...');
          await new Promise(resolve => setTimeout(resolve, 300));
          console.log('[ChatInterface] ✅ Lead 이벤트 전송 완료 대기 완료');
        } else {
          console.log('[ChatInterface] ℹ️ Meta Pixel not available');
          console.log('[ChatInterface] - NEXT_PUBLIC_META_PIXEL_ID가 설정되지 않았거나 스크립트 로딩 실패');
        }
      } catch (pixelError) {
        console.error('[ChatInterface] ⚠️ Meta Pixel error (non-critical):', pixelError);
      }

      const completeStep = chatFlow['complete'];
      if (!completeStep) {
        console.error('[ChatInterface] Complete step not found in chat flow');
        return;
      }

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

    const userMessageCount = chatState.messages.filter(m => m.type === 'user').length;
    return Math.min(userMessageCount, totalSteps);
  };

  if (isLoading || Object.keys(chatFlow).length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">
            {isLoading ? '로딩 중...' : '질문을 불러올 수 없습니다.'}
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
            {currentStep.inputType !== 'select' && currentStep.inputType !== 'phone' && (
              <ChatInput
                currentStep={currentStep as ChatStep}
                onSubmit={handleUserInput}
              />
            )}
            {currentStep.inputType === 'phone' && !showVerification && (
              <ChatInput
                currentStep={currentStep as ChatStep}
                onSubmit={handlePhoneSubmit}
              />
            )}
            {currentStep.inputType === 'phone' && showVerification && phoneNumber && (
              <VerificationInput
                phoneNumber={phoneNumber}
                onVerify={handleVerificationComplete}
                onBack={() => {
                  setShowVerification(false);
                  setPhoneNumber('');
                  const retryMessage: Message = {
                    id: uuidv4(),
                    type: 'bot',
                    content: '📱 올바른 휴대폰 번호를 다시 입력해주세요.\n(11자리 휴대폰 번호)',
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
      <MetaPixelDebug />
    </div>
  );
}
