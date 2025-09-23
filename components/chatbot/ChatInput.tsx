'use client';

import { useState } from 'react';
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
  const [isPhoneValid, setIsPhoneValid] = useState<boolean | null>(null);

  // 전화번호 자동 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');

    // 11자리일 경우 자동으로 하이픈 추가
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }

    // 11자리 초과 시 잘라내기
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 전화번호 유효성 검사 함수 (서버와 동일한 검증 로직)
  const validatePhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    // 010, 011, 016, 017, 018, 019로 시작하는 11자리 번호 허용
    const validPrefixes = ['010', '011', '016', '017', '018', '019'];
    return numbers.length === 11 && validPrefixes.some(prefix => numbers.startsWith(prefix));
  };

  const handlePhoneInputChange = (value: string) => {
    if (currentStep.inputType === 'phone') {
      const formatted = formatPhoneNumber(value);
      setInputValue(formatted);

      // 실시간 유효성 검사
      if (value.length > 0) {
        setIsPhoneValid(validatePhoneNumber(formatted));
      } else {
        setIsPhoneValid(null);
      }
    } else {
      setInputValue(value);
    }
  };

  const handleSubmit = () => {
    const value = currentStep.inputType === 'select' ? selectedOption : inputValue;

    // 전화번호 입력일 경우 유효성 검사
    if (currentStep.inputType === 'phone') {
      const isValid = validatePhoneNumber(value);
      if (!isValid) {
        // 유효하지 않으면 제출하지 않음
        return;
      }
    }

    if (value.trim()) {
      onSubmit(value.trim());
      setInputValue('');
      setSelectedOption('');
      setIsPhoneValid(null);
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
      <div className="p-3 sm:p-4 md:p-6 bg-[#1A1F2E]/80 backdrop-blur-sm border-t border-[#2E3544]/50">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 font-medium">
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
      <div className="p-3 sm:p-4 md:p-6 bg-[#1A1F2E]/80 backdrop-blur-sm border-t border-[#2E3544]/50">
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
                'absolute bottom-3 right-3 p-2.5 sm:p-2 rounded-lg',
                'bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-gray-900',
                'hover:shadow-[0_0_15px_rgba(0,229,219,0.4)] active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-200'
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 hidden sm:block">
            Enter키를 눌러 전송하거나 오른쪽 버튼을 클릭하세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-[#1A1F2E]/80 backdrop-blur-sm border-t border-[#2E3544]/50">
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Input
            type={currentStep.inputType === 'email' ? 'email' :
                  currentStep.inputType === 'phone' ? 'tel' : 'text'}
            value={inputValue}
            onChange={(e) => handlePhoneInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentStep.placeholder}
            disabled={disabled}
            maxLength={currentStep.inputType === 'phone' ? 13 : undefined}
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
            disabled={disabled || !inputValue.trim() || (currentStep.inputType === 'phone' && isPhoneValid === false)}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 rounded-lg',
              'bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-gray-900',
              'hover:shadow-[0_0_15px_rgba(0,229,219,0.4)] active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-200'
            )}
            title={currentStep.inputType === 'phone' && isPhoneValid === false ? '올바른 전화번호를 입력해주세요' : ''}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {currentStep.inputType === 'phone'
              ? '휴대폰 번호를 입력하세요 (예: 010-1234-5678)'
              : currentStep.inputType === 'email'
              ? '예: example@email.com'
              : <span className="hidden sm:inline">Enter키를 눌러 전송하세요</span>}
          </p>
          {currentStep.inputType === 'phone' && isPhoneValid !== null && (
            <span className={cn(
              "text-xs font-medium",
              isPhoneValid ? "text-green-500" : "text-amber-500"
            )}>
              {isPhoneValid
                ? "✅ 올바른 형식"
                : inputValue.replace(/\D/g, '').length < 11
                  ? "⚠️ 숫자를 더 입력해주세요"
                  : "⚠️ 올바른 휴대폰 번호가 아닙니다"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}