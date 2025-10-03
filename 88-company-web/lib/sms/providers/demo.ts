import { SMSProvider, SMSResult } from '../types';
import { logger } from '@/lib/utils/logger';

/**
 * 데모 SMS 프로바이더
 * 개발 환경에서 사용, 실제 SMS를 보내지 않고 콘솔에 출력
 */
export class DemoSMSProvider implements SMSProvider {
  getName(): string {
    return 'Demo';
  }

  async sendSMS(phone: string, message: string): Promise<SMSResult> {
    // 콘솔에 SMS 내용 출력
    logger.demo('━'.repeat(50));
    logger.demo('📱 [DEMO SMS Provider]');
    logger.demo(`📞 To: ${phone}`);
    logger.demo(`💬 Message: ${message}`);
    logger.demo('━'.repeat(50));

    // 메시지에서 인증번호 추출 (있는 경우)
    const codeMatch = message.match(/(\d{6})/);
    if (codeMatch) {
      logger.demo(`🔑 인증번호: ${codeMatch[1]}`);
      logger.demo('━'.repeat(50));
    }

    // 가상의 성공 응답 반환
    return {
      success: true,
      messageId: `demo_${Date.now()}`,
      provider: 'demo',
      timestamp: new Date()
    };
  }

  async healthCheck(): Promise<boolean> {
    // 데모 프로바이더는 항상 정상
    return true;
  }
}