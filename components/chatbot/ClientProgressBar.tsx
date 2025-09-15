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

  // Force initial state to be 0
  const actualCompleted = completedSteps?.length || 0;

  console.log('ClientProgressBar RENDER - completed:', actualCompleted, 'total:', totalQuestions, 'completedSteps array:', completedSteps);
  console.log('ClientProgressBar - Progress will be:', actualCompleted, '/', totalQuestions, '=', Math.round((actualCompleted / totalQuestions) * 100) + '%');

  return (
    <ProgressBar
      currentStep={actualCompleted}
      totalSteps={totalQuestions}
    />
  );
}