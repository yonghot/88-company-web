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
    <div className="flex w-full mb-4 fade-in">
      <div className="flex gap-3 max-w-[85%] md:max-w-[70%]">
        {/* 아바타 공간 (빈 공간으로 정렬 맞춤) */}
        <div className="flex-shrink-0 w-9 h-9" />
        
        {/* 옵션 버튼들 */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-400 mb-1">
            빠른 답변
          </span>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => (
              <button
                key={option}
                className={cn(
                  'group px-3 py-2 rounded-xl text-sm transition-all duration-200',
                  'border border-[#2E3544] bg-[#252B3B] text-gray-300',
                  'hover:border-[#00E5DB]/50 hover:bg-[#00E5DB]/10 hover:text-[#00E5DB]',
                  'hover:shadow-[0_0_10px_rgba(0,229,219,0.2)]',
                  'active:scale-[0.98]',
                  'flex items-center gap-1'
                )}
                onClick={() => onSelect(option)}
                disabled={disabled}
              >
                <span>{option}</span>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}