import { SMSProvider, SMSResult, TwilioConfig, SMSProviderError } from '../types';

/**
 * Twilio SMS 프로바이더
 * 국제 SMS 발송에 최적화
 */
export class TwilioSMSProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private baseUrl = 'https://api.twilio.com/2010-04-01';

  constructor(config: TwilioConfig) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.fromNumber = config.fromNumber;

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new SMSProviderError(
        'Twilio configuration is incomplete',
        'twilio'
      );
    }
  }

  getName(): string {
    return 'Twilio';
  }

  async sendSMS(phone: string, message: string): Promise<SMSResult> {
    try {
      // 한국 번호 형식을 국제 형식으로 변환
      const formattedPhone = this.formatPhoneNumber(phone);

      // Twilio API 호출
      const url = `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`;

      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const params = new URLSearchParams({
        From: this.fromNumber,
        To: formattedPhone,
        Body: message
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ SMS sent via Twilio to ${formattedPhone}`);
        return {
          success: true,
          messageId: data.sid,
          provider: 'twilio',
          timestamp: new Date()
        };
      } else {
        throw new SMSProviderError(
          data.message || 'Failed to send SMS via Twilio',
          'twilio',
          data
        );
      }
    } catch (error) {
      if (error instanceof SMSProviderError) {
        throw error;
      }

      throw new SMSProviderError(
        'Failed to send SMS via Twilio',
        'twilio',
        error
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/Accounts/${this.accountSid}.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    // 하이픈 제거
    let cleaned = phone.replace(/-/g, '');

    // 한국 번호인 경우 +82 추가
    if (cleaned.startsWith('010')) {
      cleaned = '+82' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+')) {
      // 이미 국제 형식이 아닌 경우 +82 추가
      cleaned = '+82' + cleaned;
    }

    return cleaned;
  }
}