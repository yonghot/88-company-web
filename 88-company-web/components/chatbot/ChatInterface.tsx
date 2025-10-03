'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ProgressBar } from './ProgressBar';
import { QuickReplyOptions } from './QuickReplyOptions';
import { VerificationInput } from './VerificationInput';
import { Message, ChatState, LeadData, ChatFlowMap, ChatFlowStep, ChatStep } from '@/lib/types';
import { staticQuestionService } from '@/lib/chat/static-question-service';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles } from 'lucide-react';

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
    </div>
  );
}
