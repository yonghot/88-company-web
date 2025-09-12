'use client';

import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
}

export function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  const isBot = message.type === 'bot';

  return (
    <div
      className={cn(
        'flex w-full mb-4 fade-in',
        isBot ? 'justify-start' : 'justify-end'
      )}
    >
      <div className={cn(
        'flex gap-3 max-w-[85%] md:max-w-[70%]',
        !isBot && 'flex-row-reverse'
      )}>
        {/* 아바타 */}
        <div className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg overflow-hidden',
          isBot ? 'bg-[#1A1F2E] border border-[#00E5DB]/30' : 'bg-gradient-to-br from-[#4DA3FF] to-[#00E5DB]'
        )}>
          {isBot ? (
            <img src="/88-logo.png" alt="88" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
        
        {/* 메시지 버블 */}
        <div className="flex flex-col gap-1">
          {/* 발신자 라벨 */}
          <span className={cn(
            'text-xs font-medium',
            isBot ? 'text-[#00E5DB]' : 'text-gray-400',
            !isBot && 'text-right'
          )}>
            {isBot ? '88' : '나'}
          </span>
          
          <div
            className={cn(
              'px-4 py-3 rounded-2xl shadow-lg',
              isBot
                ? 'bg-[#1A1F2E] border border-[#2E3544] text-gray-200 rounded-tl-md'
                : 'bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-gray-900 rounded-tr-md',
              'hover:shadow-xl transition-all duration-200',
              isBot && 'hover:border-[#00E5DB]/30'
            )}
          >
            {isTyping ? (
              <div className="flex items-center space-x-2 py-1">
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-[#00E5DB] rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-[#00E5DB] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-[#00E5DB] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs text-gray-400 ml-2">입력 중...</span>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            )}
          </div>
          
          {/* 시간 표시 */}
          {!isTyping && (
            <span className={cn(
              'text-[10px] text-gray-500 mt-1',
              !isBot && 'text-right'
            )}>
              {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}