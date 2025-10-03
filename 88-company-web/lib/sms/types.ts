// SMS Provider Types and Interfaces

export interface SMSProvider {
  /**
   * SMS 발송
   * @param phone 수신자 전화번호
   * @param message 메시지 내용
   * @returns 발송 결과
   */
  sendSMS(phone: string, message: string): Promise<SMSResult>;

  /**
   * 프로바이더 이름
   */
  getName(): string;

  /**
   * 프로바이더 상태 확인
   */
  healthCheck(): Promise<boolean>;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  timestamp: Date;
  details?: any;
}

export interface SMSConfig {
  provider?: 'demo' | 'twilio' | 'aligo' | 'nhncloud';
  twilio?: TwilioConfig;
  aligo?: AligoConfig;
  nhncloud?: NHNCloudConfig;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface AligoConfig {
  apiKey: string;
  userId: string;
  sender: string;
}

export interface NHNCloudConfig {
  appKey: string;
  secretKey: string;
  sendNo: string;
  projectId?: string;
}

// In-memory verification code structure (different from database schema)
export interface InMemoryVerificationCode {
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  verified: boolean;
}

// Alias for backward compatibility
export type VerificationCode = InMemoryVerificationCode;

export interface RateLimitEntry {
  phone: string;
  attempts: number;
  firstAttempt: Date;
  lastAttempt: Date;
  blockedUntil?: Date;
}

export class SMSProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'SMSProviderError';
  }
}