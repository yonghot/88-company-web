import { ChatStep } from './types';

export interface ChatFlowStep extends Omit<ChatStep, 'nextStep'> {
  step?: string;
  nextStep?: ((value: string) => string) | string;
}

export interface ChatFlowMap {
  [key: string]: ChatFlowStep;
}

export interface ErrorResponse {
  error?: string;
  message?: string;
  retryAfter?: number;
  verified?: boolean;
  demoCode?: string;
}

export interface VerificationResult {
  success: boolean;
  verified?: boolean;
  error?: string;
  message?: string;
  demoCode?: string;
}

export interface QuestionValidationFunction {
  (value: string): boolean;
}

export interface QuestionMetadata {
  mode?: string;
  phone?: string;
  message?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface StatsData {
  provider: string;
  rateLimiter: {
    totalEntries: number;
    blockedNumbers: number;
    recentAttempts: number;
  };
  memoryStoreSize?: number;
}

export type OptionalAny = unknown;