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

  // Calculate actual completed steps
  const actualCompleted = Array.isArray(completedSteps) ? completedSteps.length : 0;

  return (
    <ProgressBar
      currentStep={actualCompleted}
      totalSteps={totalQuestions}
    />
  );
}