'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChatStep } from '@/lib/types';
import { Send, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  currentStep: ChatStep;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function ChatInput({ currentStep, onSubmit, disabled = false }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const handleSubmit = () => {
    const value = currentStep.inputType === 'select' ? selectedOption : inputValue;
    if (value.trim()) {
      onSubmit(value.trim());
      setInputValue('');
      setSelectedOption('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentStep.inputType !== 'textarea') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (currentStep.inputType === 'select' && currentStep.options) {
    return (
      <div className="p-4 md:p-6 bg-[#1A1F2E]/80 backdrop-blur-sm border-t border-[#2E3544]/50">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-gray-400 mb-3 font-medium">
            옵션을 선택해주세요
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentStep.options.map((option) => (
              <button
                key={option}
                className={cn(
                  'group relative px-4 py-3 rounded-xl text-left transition-all duration-200',
                  'border hover:shadow-md hover:border-[#00E5DB] hover:-translate-y-0.5',
                  'active:scale-[0.98]',
                  selectedOption === option
                    ? 'bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-white border-[#00E5DB] shadow-lg shadow-[#00E5DB]/20'
                    : 'bg-[#252B3B] text-gray-200 border-[#2E3544] hover:bg-[#2A3142]'
                )}
                onClick={() => {
                  setSelectedOption(option);
                  onSubmit(option);
                }}
                disabled={disabled}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{option}</span>
                  <ChevronRight className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    'group-hover:translate-x-0.5',
                    selectedOption === option ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                  )} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep.inputType === 'textarea') {
    return (
      <div className="p-4 md:p-6 bg-[#1A1F2E]/80 backdrop-blur-sm border-t border-[#2E3544]/50">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentStep.placeholder}
              disabled={disabled}
              className={cn(
                'w-full min-h-[100px] resize-none px-4 py-3 pr-12',
                'bg-[#252B3B] border border-[#2E3544] rounded-xl',
                'text-gray-200 placeholder:text-gray-500',
                'focus:border-[#00E5DB] focus:ring-2 focus:ring-[#00E5DB]/30',
                'transition-all duration-200'
              )}
            />
            <button
              onClick={handleSubmit}
              disabled={disabled || !inputValue.trim()}
              className={cn(
                'absolute bottom-3 right-3 p-2 rounded-lg',
                'bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-gray-900',
                'hover:shadow-[0_0_15px_rgba(0,229,219,0.4)] active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter키를 눌러 전송하거나 오른쪽 버튼을 클릭하세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-[#1A1F2E]/80 backdrop-blur-sm border-t border-[#2E3544]/50">
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Input
            type={currentStep.inputType === 'email' ? 'email' : 
                  currentStep.inputType === 'phone' ? 'tel' : 'text'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentStep.placeholder}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-3 pr-12',
              'bg-[#252B3B] border border-[#2E3544] rounded-xl',
              'text-gray-200 placeholder:text-gray-500',
              'focus:border-[#00E5DB] focus:ring-2 focus:ring-[#00E5DB]/30',
              'transition-all duration-200'
            )}
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !inputValue.trim()}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg',
              'bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-gray-900',
              'hover:shadow-[0_0_15px_rgba(0,229,219,0.4)] active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {currentStep.inputType === 'phone'
            ? '예: 010-1234-5678'
            : currentStep.inputType === 'email'
            ? '예: example@email.com'
            : 'Enter키를 눌러 전송하세요'}
        </p>
      </div>
    </div>
  );
}