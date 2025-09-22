'use client';

import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface QuickReplyOptionsProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export function QuickReplyOptions({ options, onSelect, disabled = false }: QuickReplyOptionsProps) {
  return (
    <div className="w-full fade-in">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-gray-400">
          빠른 답변을 선택해주세요
        </span>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              className={cn(
                'group px-4 py-2.5 sm:px-3 sm:py-2 rounded-xl text-sm transition-all duration-200',
                'border border-[#2E3544] bg-[#252B3B] text-gray-300',
                'hover:border-[#00E5DB]/50 hover:bg-[#00E5DB]/10 hover:text-[#00E5DB]',
                'hover:shadow-[0_0_10px_rgba(0,229,219,0.2)]',
                'active:scale-[0.98]',
                'flex items-center gap-1',
                'min-h-[44px] sm:min-h-0'  // 모바일에서 최소 44px 터치 타겟
              )}
              onClick={() => onSelect(option)}
              disabled={disabled}
            >
              <span>{option}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}