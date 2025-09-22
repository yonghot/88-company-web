import { NextResponse } from 'next/server';

/**
 * GET /api/debug-sms
 * SMS 설정 상태 확인 (프로덕션 디버깅용)
 */
export async function GET() {
  // 민감한 정보는 일부만 노출
  const maskSecret = (value: string | undefined) => {
    if (!value) return 'NOT_SET';
    if (value.length < 8) return '***';
    return value.substring(0, 4) + '***' + value.substring(value.length - 2);
  };

  const debugInfo = {
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    },
    smsConfig: {
      SMS_PROVIDER: process.env.SMS_PROVIDER || 'NOT_SET',
      NHN_APP_KEY: process.env.NHN_APP_KEY ? 'SET' : 'NOT_SET',
      NHN_SECRET_KEY: maskSecret(process.env.NHN_SECRET_KEY),
      NHN_SEND_NO: process.env.NHN_SEND_NO || 'NOT_SET',
      SHOW_DEMO_CODE: process.env.SHOW_DEMO_CODE || 'NOT_SET',
    },
    analysis: {
      isProduction: process.env.NODE_ENV === 'production',
      isVercel: !!process.env.VERCEL,
      expectedProvider: process.env.SMS_PROVIDER || 'demo',
      hasNHNConfig: !!(process.env.NHN_APP_KEY && process.env.NHN_SECRET_KEY && process.env.NHN_SEND_NO),
    },
    timestamp: new Date().toISOString(),
  };

  // 실제 SMS 서비스 초기화 테스트
  try {
    const { SMSService } = await import('@/lib/sms/sms-service');
    const service = SMSService.getInstance();

    // provider 상태 확인 (private 필드라 직접 접근 불가)
    debugInfo.analysis['serviceInitialized'] = !!service;

    // 테스트 메시지 생성 시도 (실제 발송은 안 함)
    const testPhone = '01000000000';
    const canFormat = SMSService.formatPhoneNumber(testPhone);
    debugInfo.analysis['formattingWorks'] = !!canFormat;

  } catch (error) {
    debugInfo.analysis['initError'] = error instanceof Error ? error.message : 'Unknown error';
  }

  return NextResponse.json(debugInfo);
}