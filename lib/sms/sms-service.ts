import { SMSProvider, SMSResult, SMSConfig, SMSProviderError } from './types';
import { DemoSMSProvider } from './providers/demo';
import { TwilioSMSProvider } from './providers/twilio';
import { AligoSMSProvider } from './providers/aligo';
import { NHNCloudSMSProvider } from './providers/nhncloud';

/**
 * SMS 서비스 관리자
 * 설정에 따라 적절한 SMS 프로바이더를 선택하고 관리
 */
export class SMSService {
  private provider: SMSProvider;
  private static instance: SMSService;

  constructor(config?: SMSConfig) {
    // 환경 변수에서 설정 로드
    const providerType = config?.provider || process.env.SMS_PROVIDER || 'demo';

    switch (providerType) {
      case 'nhncloud':
        this.provider = new NHNCloudSMSProvider({
          appKey: config?.nhncloud?.appKey || process.env.NHN_APP_KEY || '',
          secretKey: config?.nhncloud?.secretKey || process.env.NHN_SECRET_KEY || '',
          sendNo: config?.nhncloud?.sendNo || process.env.NHN_SEND_NO || '',
          projectId: config?.nhncloud?.projectId || process.env.NHN_PROJECT_ID
        });
        break;

      case 'twilio':
        this.provider = new TwilioSMSProvider({
          accountSid: config?.twilio?.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
          authToken: config?.twilio?.authToken || process.env.TWILIO_AUTH_TOKEN || '',
          fromNumber: config?.twilio?.fromNumber || process.env.TWILIO_PHONE_NUMBER || ''
        });
        break;

      case 'aligo':
        this.provider = new AligoSMSProvider({
          apiKey: config?.aligo?.apiKey || process.env.ALIGO_API_KEY || '',
          userId: config?.aligo?.userId || process.env.ALIGO_USER_ID || '',
          sender: config?.aligo?.sender || process.env.ALIGO_SENDER || ''
        });
        break;

      case 'demo':
      default:
        this.provider = new DemoSMSProvider();
        break;
    }

    console.log(`📱 SMS Service initialized with ${this.provider.getName()} provider`);
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(config?: SMSConfig): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService(config);
    }
    return SMSService.instance;
  }

  /**
   * SMS 발송
   */
  async sendSMS(phone: string, message: string): Promise<SMSResult> {
    try {
      // 전화번호 유효성 검사
      if (!this.isValidPhoneNumber(phone)) {
        throw new Error('유효하지 않은 전화번호 형식입니다');
      }

      // SMS 발송
      const result = await this.provider.sendSMS(phone, message);

      // 로깅
      if (result.success) {
        console.log(`✅ SMS sent successfully via ${result.provider}`);
      } else {
        console.error(`❌ SMS failed via ${result.provider}: ${result.error}`);
      }

      return result;
    } catch (error) {
      console.error('SMS 발송 오류:', error);

      if (error instanceof SMSProviderError) {
        throw error;
      }

      throw new Error('SMS 발송 중 오류가 발생했습니다');
    }
  }

  /**
   * 인증번호 SMS 발송
   */
  async sendVerificationCode(phone: string, code: string): Promise<SMSResult> {
    const message = `[88 Company] 인증번호는 ${code}입니다. 3분 이내에 입력해주세요.`;
    return this.sendSMS(phone, message);
  }

  /**
   * 프로바이더 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.provider.healthCheck();
    } catch {
      return false;
    }
  }

  /**
   * 현재 프로바이더 이름 가져오기
   */
  getProviderName(): string {
    return this.provider.getName();
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
}