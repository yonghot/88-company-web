'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ProgressBar } from './ProgressBar';
import { QuickReplyOptions } from './QuickReplyOptions';
import { VerificationInput } from './VerificationInput';
import { Message, ChatState, LeadData } from '@/lib/types';
import { chatFlow, getNextStep, validateInput } from '@/lib/chat/flow';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatInterface() {
  const [chatState, setChatState] = useState<ChatState>({
    currentStep: 'welcome',
    messages: [],
    leadData: {},
    isCompleted: false
  });
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');  // Store phone for verification
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  useEffect(() => {
    // Show initial welcome message
    const welcomeMessage: Message = {
      id: uuidv4(),
      type: 'bot',
      content: chatFlow.welcome.question,
      timestamp: new Date()
    };
    setChatState(prev => ({
      ...prev,
      messages: [welcomeMessage]
    }));
  }, []);

  const handleUserInput = async (value: string) => {
    const currentStep = chatFlow[chatState.currentStep];
    
    // Validate input
    if (!validateInput(chatState.currentStep, value)) {
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

    // Add user message
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

    // Update lead data
    const updatedLeadData: LeadData = { ...chatState.leadData };
    
    switch (chatState.currentStep) {
      case 'welcome':
        updatedLeadData.service = value;
        break;
      case 'customService':
        updatedLeadData.service = value;
        break;
      case 'budget':
        updatedLeadData.budget = value;
        break;
      case 'timeline':
        updatedLeadData.timeline = value;
        break;
      case 'details':
        updatedLeadData.message = value;
        break;
      case 'name':
        updatedLeadData.name = value;
        break;
      case 'phone':
        updatedLeadData.phone = value;
        setPhoneNumber(value);  // Store phone number for verification
        break;
      case 'phoneVerification':
        // Phone is already stored, just mark as verified
        updatedLeadData.verified = true;
        updatedLeadData.createdAt = new Date();
        break;
    }

    // Show typing indicator
    setIsTyping(true);

    // Simulate bot thinking time
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mark current step as completed before moving to next
    if (!completedSteps.includes(chatState.currentStep)) {
      setCompletedSteps(prev => [...prev, chatState.currentStep]);
    }

    // Get next step
    const nextStep = getNextStep(chatState.currentStep, value);

    if (nextStep && nextStep.id !== 'complete') {
      const botMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: nextStep.question,
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        currentStep: nextStep.id,
        messages: [...prev.messages, botMessage],
        leadData: updatedLeadData
      }));
    } else if (nextStep && nextStep.id === 'complete') {
      // Save lead data
      await saveLeadData(updatedLeadData);
      
      const completeMessage: Message = {
        id: uuidv4(),
        type: 'bot',
        content: nextStep.question,
        timestamp: new Date()
      };

      setChatState(prev => ({
        ...prev,
        currentStep: nextStep.id,
        messages: [...prev.messages, completeMessage],
        leadData: updatedLeadData,
        isCompleted: true
      }));
    }
    
    setIsTyping(false);
  };

  const saveLeadData = async (data: LeadData) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          createdAt: new Date()
        }),
      });

      if (!response.ok) {
        console.error('Failed to save lead data');
      }
    } catch (error) {
      console.error('Error saving lead data:', error);
    }
  };

  const getCompletedStepsCount = () => {
    // Define the main steps (excluding customService and phoneVerification as they are sub-steps)
    const mainSteps = ['welcome', 'budget', 'timeline', 'details', 'name', 'phone'];

    // Count how many main steps have been completed
    let completedCount = 0;
    for (const step of mainSteps) {
      if (completedSteps.includes(step)) {
        completedCount++;
      }
      // Also count customService as welcome completion if it was answered
      if (step === 'welcome' && completedSteps.includes('customService')) {
        completedCount = Math.max(completedCount, 1);
      }
    }

    // If phone verification is completed, count it as the final step
    if (completedSteps.includes('phoneVerification') || chatState.isCompleted) {
      completedCount = mainSteps.length;
    }

    return completedCount;
  };

  const getTotalSteps = () => {
    // Count main steps only (excluding sub-steps like customService and phoneVerification)
    return 6; // welcome, budget, timeline, details, name, phone
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#0A0D13] to-[#141821]">
      {/* Header */}
      <div className="bg-[#1A1F2E]/80 backdrop-blur-lg border-b border-[#2E3544]/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#00E5DB] to-[#00C7BE] rounded-xl shadow-lg neon-border">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                  88
                  <Sparkles className="w-4 h-4 text-[#00E5DB]" />
                </h1>
                <p className="text-xs text-gray-400">
                  비즈니스 성장을 위한 전문 컨설팅
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#00E5DB]/20 text-[#00E5DB] text-xs font-medium rounded-full border border-[#00E5DB]/30">
                온라인
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {!chatState.isCompleted && (
        <div className="bg-[#1A1F2E]/60 backdrop-blur-sm border-b border-[#2E3544]/50">
          <ProgressBar
            currentStep={getCompletedStepsCount()}
            totalSteps={getTotalSteps()}
          />
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto smooth-scroll">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* 환영 메시지 배경 */}
          {chatState.messages.length === 1 && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00E5DB]/10 rounded-full mb-4 border border-[#00E5DB]/20">
                <Sparkles className="w-4 h-4 text-[#00E5DB] pulse-glow" />
                <span className="text-sm font-medium text-[#00E5DB]">
                  AI 컨설턴트가 도와드립니다
                </span>
              </div>
            </div>
          )}
          
          {/* 메시지 리스트 */}
          <div className="space-y-4">
            {chatState.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && (
              <ChatMessage
                message={{
                  id: 'typing',
                  type: 'bot',
                  content: '',
                  timestamp: new Date()
                }}
                isTyping={true}
              />
            )}
            
            {/* 선택 옵션을 챗봇 대화 영역에 표시 */}
            {!isTyping && !chatState.isCompleted && 
             chatFlow[chatState.currentStep]?.inputType === 'select' && 
             chatFlow[chatState.currentStep]?.options && (
              <QuickReplyOptions
                options={chatFlow[chatState.currentStep].options!}
                onSelect={handleUserInput}
                disabled={isTyping}
              />
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - select 타입이 아닐 때만 표시 */}
      {!chatState.isCompleted && chatFlow[chatState.currentStep]?.inputType !== 'select' && (
        <div className="shadow-lg">
          {chatState.currentStep === 'phoneVerification' ? (
            <VerificationInput
              phoneNumber={phoneNumber}
              onVerify={(code) => handleUserInput(code)}
              disabled={isTyping}
            />
          ) : (
            <ChatInput
              currentStep={chatFlow[chatState.currentStep]}
              onSubmit={handleUserInput}
              disabled={isTyping}
            />
          )}
        </div>
      )}
      
      {/* 완료 시 재시작 버튼 */}
      {chatState.isCompleted && (
        <div className="p-4 md:p-6 bg-white border-t border-gray-100">
          <div className="max-w-2xl mx-auto text-center">
            <button
              onClick={() => window.location.reload()}
              className={cn(
                'px-6 py-3 rounded-xl font-medium',
                'bg-gradient-to-r from-[#00E5DB] to-[#4DA3FF] text-gray-900',
                'hover:shadow-[0_0_30px_rgba(0,229,219,0.4)] hover:-translate-y-0.5',
                'transition-all duration-200 active:scale-95',
                'shadow-[0_0_20px_rgba(0,229,219,0.3)]'
              )}
            >
              새로운 상담 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}