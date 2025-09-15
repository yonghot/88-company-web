'use client';

import { ProgressBar } from './ProgressBar';

interface ClientProgressBarProps {
  completedSteps: string[];
  totalQuestions: number;
}

export function ClientProgressBar({ completedSteps, totalQuestions }: ClientProgressBarProps) {
  // Ensure we're on client side and have valid data
  if (typeof window === 'undefined') {
    console.log('ClientProgressBar - Server side, returning null');
    return null;
  }

  console.log('🚨 CACHE_BUSTER_2024_12_15_15_30 - ClientProgressBar rendering');
  console.log('🔥 ClientProgressBar DEBUG:');
  console.log('  - completedSteps received:', completedSteps);
  console.log('  - completedSteps type:', typeof completedSteps);
  console.log('  - completedSteps isArray:', Array.isArray(completedSteps));
  console.log('  - completedSteps length:', completedSteps?.length);
  console.log('  - totalQuestions:', totalQuestions);

  if (completedSteps && completedSteps.length > 0) {
    console.log('🚨 WARNING: completedSteps has items on render!', completedSteps);
    console.log('🚨 Individual steps:', completedSteps.map((step, i) => `${i}: ${step}`));
  }

  // Force initial state to be 0
  const actualCompleted = completedSteps?.length || 0;

  console.log('🎯 ClientProgressBar CALCULATED - actualCompleted:', actualCompleted, 'passing to ProgressBar as currentStep');
  console.log('ClientProgressBar RENDER - completed:', actualCompleted, 'total:', totalQuestions, 'completedSteps array:', completedSteps);
  console.log('ClientProgressBar - Progress will be:', actualCompleted, '/', totalQuestions, '=', Math.round((actualCompleted / totalQuestions) * 100) + '%');

  return (
    <ProgressBar
      currentStep={actualCompleted}
      totalSteps={totalQuestions}
    />
  );
}