import { supabase } from '@/lib/supabase';
import { SMSService } from './sms-service';
import { rateLimiter } from './rate-limiter';
import { VerificationCode } from './types';

/**
 * 통합 인증 서비스
 * SMS 발송, 인증번호 관리, 보안 기능을 통합 관리
 */
export class VerificationService {
  private smsService: SMSService;
  private static instance: VerificationService;

  // 설정
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 3;
  private readonly MAX_VERIFICATION_ATTEMPTS = 5;

  // 메모리 저장소 (Supabase 미사용 시)
  private memoryStore = new Map<string, VerificationCode>();

  constructor() {
    this.smsService = SMSService.getInstance();
  }

  static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  /**
   * 인증번호 발송
   */
  async sendVerificationCode(phone: string): Promise<{
    success: boolean;
    message: string;
    demoCode?: string;
    error?: string;
  }> {
    try {
      const normalizedPhone = SMSService.normalizePhoneNumber(phone);

      // 1. Rate Limiting 체크
      const rateLimitCheck = rateLimiter.isAllowed(normalizedPhone);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: rateLimitCheck.reason,
          message: rateLimitCheck.reason || '요청이 제한되었습니다'
        };
      }

      // 2. 중복 체크
      const isDuplicate = await this.checkDuplicatePhone(normalizedPhone);
      if (isDuplicate) {
        return {
          success: false,
          error: '이미 등록된 휴대폰 번호입니다',
          message: '이미 등록된 휴대폰 번호입니다'
        };
      }

      // 3. 인증번호 생성
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

      // 4. 인증번호 저장
      await this.saveVerificationCode(normalizedPhone, code, expiresAt);

      // 5. SMS 발송
      const smsResult = await this.smsService.sendVerificationCode(phone, code);

      // 6. Rate Limiter 기록
      rateLimiter.recordAttempt(normalizedPhone);

      // 7. 개발 환경에서는 코드 반환
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isDemo = this.smsService.getProviderName() === 'Demo';

      return {
        success: smsResult.success,
        message: '인증번호가 발송되었습니다',
        demoCode: (isDevelopment || isDemo) ? code : undefined
      };

    } catch (error) {
      console.error('인증번호 발송 오류:', error);
      return {
        success: false,
        error: '인증번호 발송에 실패했습니다',
        message: '인증번호 발송에 실패했습니다'
      };
    }
  }

  /**
   * 인증번호 확인
   */
  async verifyCode(phone: string, code: string): Promise<{
    success: boolean;
    verified: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const normalizedPhone = SMSService.normalizePhoneNumber(phone);

      // 1. 저장된 인증번호 조회
      const storedCode = await this.getVerificationCode(normalizedPhone);

      if (!storedCode) {
        return {
          success: false,
          verified: false,
          error: '인증번호를 먼저 요청해주세요',
          message: '인증번호를 먼저 요청해주세요'
        };
      }

      // 2. 만료 확인
      if (new Date() > storedCode.expiresAt) {
        await this.deleteVerificationCode(normalizedPhone);
        return {
          success: false,
          verified: false,
          error: '인증번호가 만료되었습니다',
          message: '인증번호가 만료되었습니다. 다시 요청해주세요'
        };
      }

      // 3. 시도 횟수 확인
      if (storedCode.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
        await this.deleteVerificationCode(normalizedPhone);
        return {
          success: false,
          verified: false,
          error: '인증 시도 횟수를 초과했습니다',
          message: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요'
        };
      }

      // 4. 코드 확인
      if (storedCode.code !== code) {
        // 시도 횟수 증가
        await this.incrementAttempts(normalizedPhone);
        return {
          success: false,
          verified: false,
          error: '인증번호가 일치하지 않습니다',
          message: '인증번호가 일치하지 않습니다'
        };
      }

      // 5. 인증 성공
      await this.deleteVerificationCode(normalizedPhone);
      rateLimiter.recordSuccess(normalizedPhone);

      return {
        success: true,
        verified: true,
        message: '인증이 완료되었습니다'
      };

    } catch (error) {
      console.error('인증번호 확인 오류:', error);
      return {
        success: false,
        verified: false,
        error: '인증 확인에 실패했습니다',
        message: '인증 확인에 실패했습니다'
      };
    }
  }

  /**
   * 인증번호 생성
   */
  private generateCode(): string {
    const min = Math.pow(10, this.CODE_LENGTH - 1);
    const max = Math.pow(10, this.CODE_LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * 중복 전화번호 확인
   */
  private async checkDuplicatePhone(phone: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase
        .from('leads')
        .select('id')
        .eq('id', phone)
        .single();

      return !!data;
    }

    // 파일 시스템 체크 (필요시 구현)
    return false;
  }

  /**
   * 인증번호 저장
   */
  private async saveVerificationCode(phone: string, code: string, expiresAt: Date): Promise<void> {
    const verificationCode: VerificationCode = {
      phone,
      code,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
      verified: false
    };

    if (this.isSupabaseConfigured()) {
      // 기존 코드 삭제
      await supabase
        .from('verification_codes')
        .delete()
        .eq('phone', phone);

      // 새 코드 저장
      await supabase
        .from('verification_codes')
        .insert({
          phone,
          code,
          expires_at: expiresAt.toISOString()
        });
    } else {
      // 메모리 저장
      this.memoryStore.set(phone, verificationCode);
    }
  }

  /**
   * 인증번호 조회
   */
  private async getVerificationCode(phone: string): Promise<VerificationCode | null> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        return {
          phone: data.phone,
          code: data.code,
          expiresAt: new Date(data.expires_at),
          attempts: data.attempts || 0,
          createdAt: new Date(data.created_at),
          verified: false
        };
      }
    } else {
      return this.memoryStore.get(phone) || null;
    }

    return null;
  }

  /**
   * 인증번호 삭제
   */
  private async deleteVerificationCode(phone: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase
        .from('verification_codes')
        .delete()
        .eq('phone', phone);
    } else {
      this.memoryStore.delete(phone);
    }
  }

  /**
   * 시도 횟수 증가
   */
  private async incrementAttempts(phone: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase
        .from('verification_codes')
        .select('attempts')
        .eq('phone', phone)
        .single();

      if (data) {
        await supabase
          .from('verification_codes')
          .update({ attempts: (data.attempts || 0) + 1 })
          .eq('phone', phone);
      }
    } else {
      const code = this.memoryStore.get(phone);
      if (code) {
        code.attempts++;
      }
    }
  }

  /**
   * Supabase 설정 확인
   */
  private isSupabaseConfigured(): boolean {
    return !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase')
    );
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      provider: this.smsService.getProviderName(),
      rateLimiter: rateLimiter.getStats(),
      memoryStoreSize: this.memoryStore.size
    };
  }
}