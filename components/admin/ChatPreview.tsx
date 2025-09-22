'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatQuestion } from '@/lib/chat/dynamic-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Monitor,
  X,
  RefreshCw,
  User,
  Bot,
  Send,
  CheckCircle
} from 'lucide-react';

interface ChatPreviewProps {
  questions: ChatQuestion[];
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  options?: string[];
}

export default function ChatPreview({ questions, isOpen, onClose }: ChatPreviewProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && questions.length > 0) {
      startPreview();
    }
  }, [isOpen, questions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startPreview = () => {
    setMessages([]);
    setCurrentStep(0);
    setInputValue('');

    // 첫 질문 표시
    if (questions.length > 0) {
      const firstQuestion = questions[0];
      setMessages([{
        id: '1',
        type: 'bot',
        content: firstQuestion.question,
        options: firstQuestion.options
      }]);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() && !questions[currentStep]?.options) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // 다음 질문 표시
    setTimeout(() => {
      const nextStep = currentStep + 1;
      if (nextStep < questions.length) {
        const nextQuestion = questions[nextStep];
        setMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: nextQuestion.question,
          options: nextQuestion.options
        }]);
        setCurrentStep(nextStep);
      } else {
        // 완료 메시지
        setMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: '🎉 등록이 완료되었습니다! 빠른 시일 내에 연락드리겠습니다.'
        }]);
      }
      setIsTyping(false);
    }, 1000);
  };

  const handleOptionClick = (option: string) => {
    setInputValue(option);
    handleSend();
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentStep];
  const showInput = currentStep < questions.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* 미리보기 컨테이너 */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  채팅 미리보기
                </h2>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setDevice('mobile')}
                    className={`p-1.5 rounded-md transition-colors ${
                      device === 'mobile'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    title="모바일 뷰"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDevice('desktop')}
                    className={`p-1.5 rounded-md transition-colors ${
                      device === 'desktop'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    title="데스크톱 뷰"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={startPreview}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="다시 시작"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 진행 상태 바 */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                <span>진행률</span>
                <span>{Math.round((currentStep / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / questions.length) * 100}%` }}
                  className="bg-purple-600 h-1.5 rounded-full"
                />
              </div>
            </div>

            {/* 채팅 영역 */}
            <div className={`flex flex-col h-[calc(100%-200px)] ${
              device === 'mobile' ? 'max-w-sm mx-auto' : ''
            }`}>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'bot' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] ${
                        message.type === 'user'
                          ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl rounded-tl-sm'
                      } px-4 py-2`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.options && (
                        <div className="mt-3 space-y-2">
                          {message.options.map((option, i) => (
                            <button
                              key={i}
                              onClick={() => handleOptionClick(option)}
                              className="w-full text-left px-3 py-2 bg-white/10 dark:bg-black/10 rounded-lg hover:bg-white/20 dark:hover:bg-black/20 transition-colors text-sm"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                          className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 입력 영역 */}
              {showInput && (
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                  {currentQuestion?.options ? (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                      위 옵션 중 하나를 선택하세요
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={currentQuestion?.placeholder || '답변을 입력하세요...'}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="submit"
                          className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {!showInput && currentStep >= questions.length && (
                <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">대화 완료</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}