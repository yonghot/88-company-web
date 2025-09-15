'use client';

import { ProgressBar } from './ProgressBar';

interface ClientProgressBarProps {
  completedSteps: string[];
  totalQuestions: number;
}

export function ClientProgressBar({ completedSteps, totalQuestions }: ClientProgressBarProps) {
  // Ensure we're on client side and have valid data
  if (typeof window === 'undefined') {
    return null;
  }

  // Force initial state to be 0
  const actualCompleted = completedSteps?.length || 0;

  console.log('ClientProgressBar - completed:', actualCompleted, 'total:', totalQuestions, 'steps:', completedSteps);

  return (
    <ProgressBar
      currentStep={actualCompleted}
      totalSteps={totalQuestions}
    />
  );
}