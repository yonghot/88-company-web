import { SMSProvider, SMSResult, AligoConfig, SMSProviderError } from '../types';

/**
 * 알리고 SMS 프로바이더
 * 국내 SMS 발송에 최적화
 */
export class AligoSMSProvider implements SMSProvider {
  private apiKey: string;
  private userId: string;
  private sender: string;
  private baseUrl = 'https://apis.aligo.in';

  constructor(config: AligoConfig) {
    this.apiKey = config.apiKey;
    this.userId = config.userId;
    this.sender = config.sender;

    if (!this.apiKey || !this.userId || !this.sender) {
      throw new SMSProviderError(
        '알리고 설정이 불완전합니다',
        'aligo'
      );
    }
  }

  getName(): string {
    return 'Aligo';
  }

  async sendSMS(phone: string, message: string): Promise<SMSResult> {
    try {
      // 전화번호 형식 정리 (하이픈 제거)
      const formattedPhone = phone.replace(/-/g, '');

      // 알리고 API 호출
      const url = `${this.baseUrl}/send/`;

      const formData = new FormData();
      formData.append('key', this.apiKey);
      formData.append('user_id', this.userId);
      formData.append('sender', this.sender);
      formData.append('receiver', formattedPhone);
      formData.append('msg', message);
      formData.append('msg_type', 'SMS'); // SMS, LMS, MMS
      formData.append('title', '[88 Company]'); // LMS/MMS용 제목

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      // 알리고 API 응답 처리
      if (data.result_code === '1') {
        console.log(`✅ SMS sent via Aligo to ${formattedPhone}`);
        return {
          success: true,
          messageId: data.msg_id,
          provider: 'aligo',
          timestamp: new Date()
        };
      } else {
        throw new SMSProviderError(
          data.message || '알리고 SMS 발송 실패',
          'aligo',
          data
        );
      }
    } catch (error) {
      if (error instanceof SMSProviderError) {
        throw error;
      }

      throw new SMSProviderError(
        '알리고 SMS 발송 중 오류가 발생했습니다',
        'aligo',
        error
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // 알리고 잔여 SMS 수량 체크 API
      const url = `${this.baseUrl}/remain/`;

      const formData = new FormData();
      formData.append('key', this.apiKey);
      formData.append('user_id', this.userId);

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      // result_code가 1이고 SMS 잔량이 0보다 크면 정상
      return data.result_code === '1' && parseInt(data.SMS_CNT || '0') > 0;
    } catch {
      return false;
    }
  }

  /**
   * 잔여 SMS 수량 확인
   */
  async getRemainingSMS(): Promise<number> {
    try {
      const url = `${this.baseUrl}/remain/`;

      const formData = new FormData();
      formData.append('key', this.apiKey);
      formData.append('user_id', this.userId);

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.result_code === '1') {
        return parseInt(data.SMS_CNT || '0');
      }

      return 0;
    } catch {
      return 0;
    }
  }
}