import { NextResponse } from 'next/server';
import { SMSService } from '@/lib/sms/sms-service';
import { headers } from 'next/headers';

/**
 * 관리자 비밀번호 확인
 */
async function checkAdminAuth(): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get('x-admin-password');
  const adminPassword = process.env.ADMIN_PASSWORD || '159753';

  return authHeader === adminPassword;
}

/**
 * GET /api/test-sms
 * SMS 테스트 발송 API (관리자 전용)
 *
 * 사용법:
 * - x-admin-password 헤더에 관리자 비밀번호 전송
 * - phone 쿼리 파라미터로 수신 번호 지정
 */
export async function GET(request: Request) {
  try {
    // 관리자 권한 체크
    if (!(await checkAdminAuth())) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요 (예: ?phone=010-1234-5678)' },
        { status: 400 }
      );
    }

    // 테스트 메시지 발송
    const smsService = SMSService.getInstance();
    const testMessage = `[88 Company 테스트] SMS 발송 테스트 메시지입니다. 시간: ${new Date().toLocaleString('ko-KR')}`;

    console.log(`[TEST-SMS] 테스트 SMS 발송 시작: ${phone}`);
    console.log(`[TEST-SMS] 환경 정보:`, {
      NODE_ENV: process.env.NODE_ENV,
      SMS_PROVIDER: process.env.SMS_PROVIDER,
      NHN_APP_KEY: process.env.NHN_APP_KEY ? '설정됨' : '없음',
      NHN_SECRET_KEY: process.env.NHN_SECRET_KEY ? '설정됨' : '없음',
      NHN_SEND_NO: process.env.NHN_SEND_NO || '없음'
    });

    const result = await smsService.sendSMS(phone, testMessage);

    console.log(`[TEST-SMS] 발송 결과:`, result);

    return NextResponse.json({
      success: result.success,
      message: result.success ? '테스트 SMS 발송 성공' : '테스트 SMS 발송 실패',
      result,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SMS_PROVIDER: process.env.SMS_PROVIDER || 'demo',
        VERCEL_ENV: process.env.VERCEL_ENV,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[TEST-SMS] 테스트 SMS 발송 오류:', error);

    return NextResponse.json(
      {
        error: '테스트 SMS 발송 실패',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV !== 'production' ? (error as Error).stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-sms/health
 * NHN Cloud 헬스체크 API
 */
export async function POST(request: Request) {
  try {
    // 관리자 권한 체크
    if (!(await checkAdminAuth())) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 401 }
      );
    }

    const smsService = SMSService.getInstance();
    const healthResult = await smsService.healthCheck();

    console.log(`[HEALTH-CHECK] SMS 서비스 상태:`, healthResult);

    // 추가 디버깅 정보
    const debugInfo = {
      ...healthResult,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        SMS_PROVIDER: process.env.SMS_PROVIDER,
        NHN_CONFIG: {
          APP_KEY: process.env.NHN_APP_KEY ? '✅ 설정됨' : '❌ 없음',
          SECRET_KEY: process.env.NHN_SECRET_KEY ? '✅ 설정됨' : '❌ 없음',
          SEND_NO: process.env.NHN_SEND_NO ? `✅ ${process.env.NHN_SEND_NO}` : '❌ 없음',
          API_URL: process.env.NHN_API_URL || '기본값 사용'
        }
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('[HEALTH-CHECK] 헬스체크 오류:', error);

    return NextResponse.json(
      {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}