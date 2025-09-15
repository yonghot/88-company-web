'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const safeCurrentStep = Math.max(0, currentStep || 0);
  const safeTotalSteps = Math.max(1, totalSteps || 6);
  const progress = safeTotalSteps > 0 ? (safeCurrentStep / safeTotalSteps) * 100 : 0;

  const getDisplayStep = () => {
    if (safeCurrentStep === 0) return '시작';
    if (safeCurrentStep === safeTotalSteps) return '완료';
    return `${safeCurrentStep}단계`;
  };

  const displayStep = getDisplayStep();

  return (
    <div className="w-full px-4 py-4">
      <div className="max-w-2xl mx-auto">
        {/* 스텝 인디케이터 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-300">
              {displayStep}
            </span>
            <span className="text-sm text-gray-400">/ 총 {safeTotalSteps}단계</span>
          </div>
          <span className="text-sm font-medium text-[#00E5DB]">
            {Math.round(progress)}% 완료
          </span>
        </div>
        
        {/* 프로그레스 바 */}
        <div className="relative">
          <div className="w-full bg-[#252B3B] rounded-full h-2.5 overflow-hidden border border-[#2E3544]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                "bg-gradient-to-r from-[#00E5DB] to-[#4DA3FF] shadow-[0_0_10px_rgba(0,229,219,0.4)]"
              )}
              style={{ width: `${progress}%` }}
            >
              {/* 애니메이션 효과 */}
              <div className="h-full bg-white/30 animate-pulse" />
            </div>
          </div>
          
          {/* 스텝 마커 */}
          <div className="absolute top-0 left-0 w-full h-2.5 flex justify-between px-1">
            {Array.from({ length: safeTotalSteps }, (_, i) => {
              const stepProgress = ((i + 1) / safeTotalSteps) * 100;
              const isCompleted = i < safeCurrentStep;

              return (
                <div
                  key={i}
                  className={cn(
                    "w-1 h-2.5 rounded-full transition-all duration-300",
                    isCompleted
                      ? "bg-white/50"
                      : "bg-transparent"
                  )}
                  style={{ left: `${stepProgress}%` }}
                />
              );
            })}
          </div>
        </div>
        
        {/* 단계별 라벨 (모바일에서는 숨김) */}
        <div className="hidden md:flex justify-between mt-3">
          <span className="text-xs text-gray-500">정보 수집</span>
          <span className="text-xs text-gray-500">상세 내용</span>
          <span className="text-xs text-gray-500">연락처</span>
          <span className="text-xs text-gray-500">완료</span>
        </div>
      </div>
    </div>
  );
}