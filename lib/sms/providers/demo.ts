import { SMSProvider, SMSResult } from '../types';

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
    console.log('━'.repeat(50));
    console.log('📱 [DEMO SMS Provider]');
    console.log(`📞 To: ${phone}`);
    console.log(`💬 Message: ${message}`);
    console.log('━'.repeat(50));

    // 메시지에서 인증번호 추출 (있는 경우)
    const codeMatch = message.match(/(\d{6})/);
    if (codeMatch) {
      console.log(`🔑 인증번호: ${codeMatch[1]}`);
      console.log('━'.repeat(50));
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