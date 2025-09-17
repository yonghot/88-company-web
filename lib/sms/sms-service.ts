import { SMSResult, SMSProviderError } from './types';
import { NHNCloudSMSProvider } from './providers/nhncloud';
import { logger } from '@/lib/utils/logger';

/**
 * NHN Cloud SMS 서비스
 * NHN Cloud SMS API를 통한 문자 발송 서비스
 */
export class SMSService {
  private provider: NHNCloudSMSProvider;
  private static instance: SMSService;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1초

  constructor() {
    // NHN Cloud 설정 검증
    const appKey = process.env.NHN_APP_KEY;
    const secretKey = process.env.NHN_SECRET_KEY;
    const sendNo = process.env.NHN_SEND_NO;

    if (!appKey || !secretKey || !sendNo) {
      throw new Error(
        'NHN Cloud SMS 설정이 필요합니다. 환경 변수를 확인하세요:\n' +
        '- NHN_APP_KEY\n' +
        '- NHN_SECRET_KEY\n' +
        '- NHN_SEND_NO'
      );
    }

    // NHN Cloud 프로바이더 초기화
    this.provider = new NHNCloudSMSProvider({
      appKey,
      secretKey,
      sendNo,
      projectId: process.env.NHN_PROJECT_ID
    });

    logger.info('📱 NHN Cloud SMS 서비스 초기화 완료');
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  /**
   * SMS 발송 (재시도 로직 포함)
   */
  async sendSMS(phone: string, message: string): Promise<SMSResult> {
    // 전화번호 유효성 검사
    if (!this.isValidPhoneNumber(phone)) {
      throw new Error('유효하지 않은 전화번호 형식입니다');
    }

    let lastError: any;

    // 재시도 로직
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        logger.info(`📤 SMS 발송 시도 ${attempt}/${this.retryAttempts}: ${phone}`);

        // SMS 발송
        const result = await this.provider.sendSMS(phone, message);

        // 성공 시
        if (result.success) {
          logger.info(`✅ SMS 발송 성공: ${phone} (시도 ${attempt}회)`);
          return result;
        }

        // 실패 시 에러로 처리
        throw new Error(result.error || 'SMS 발송 실패');

      } catch (error) {
        lastError = error;
        logger.error(`❌ SMS 발송 실패 (시도 ${attempt}/${this.retryAttempts}):`, error);

        // 마지막 시도가 아니면 대기 후 재시도
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt); // 점진적 지연
        }
      }
    }

    // 모든 시도 실패
    logger.error('🚫 SMS 발송 최종 실패:', lastError);

    if (lastError instanceof SMSProviderError) {
      throw lastError;
    }

    throw new Error(
      `SMS 발송에 실패했습니다 (${this.retryAttempts}회 시도).\n` +
      `에러: ${lastError?.message || '알 수 없는 오류'}`
    );
  }

  /**
   * 인증번호 SMS 발송
   */
  async sendVerificationCode(phone: string, code: string): Promise<SMSResult> {
    const message = `[88 Company] 인증번호는 ${code}입니다. 3분 이내에 입력해주세요.`;
    return this.sendSMS(phone, message);
  }

  /**
   * 발송 상태 조회
   */
  async getMessageStatus(requestId: string): Promise<{
    status: 'pending' | 'success' | 'failed';
    details?: any;
  }> {
    return this.provider.getMessageStatus(requestId);
  }

  /**
   * 서비스 상태 확인
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    provider: string;
    message?: string;
  }> {
    try {
      const isHealthy = await this.provider.healthCheck();
      return {
        healthy: isHealthy,
        provider: 'NHN Cloud',
        message: isHealthy ? '정상' : '연결 실패'
      };
    } catch (error) {
      return {
        healthy: false,
        provider: 'NHN Cloud',
        message: `헬스체크 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 발송 가능 여부 확인
   */
  async canSend(): Promise<{ canSend: boolean; reason?: string }> {
    return this.provider.canSend();
  }

  /**
   * 전화번호 유효성 검사
   */
  private isValidPhoneNumber(phone: string): boolean {
    // 한국 휴대폰 번호 형식 검사 (010-XXXX-XXXX 또는 01012345678)
    const phoneRegex = /^(010|011|016|017|018|019)[-]?\d{3,4}[-]?\d{4}$/;
    const cleaned = phone.replace(/-/g, '');

    return phoneRegex.test(phone) || phoneRegex.test(cleaned);
  }

  /**
   * 전화번호 포맷팅
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[^0-9]/g, '');

    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phone;
  }

  /**
   * 전화번호 정규화 (하이픈 제거)
   */
  static normalizePhoneNumber(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  /**
   * 지연 함수 (재시도용)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 재시도 설정 변경
   */
  setRetryConfig(attempts: number, delay: number): void {
    this.retryAttempts = Math.max(1, Math.min(5, attempts));
    this.retryDelay = Math.max(100, Math.min(5000, delay));
  }
}