import { NextResponse } from 'next/server';
import { VerificationService } from '@/lib/sms/verification-service';
import { headers } from 'next/headers';

// 통합 인증 서비스 인스턴스 - Lazy initialization
let verificationService: VerificationService | null = null;

function getVerificationService(): VerificationService {
  if (!verificationService) {
    verificationService = VerificationService.getInstance();
  }
  return verificationService;
}

/**
 * 관리자 인증 확인
 */
async function isAdmin(): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  const adminKey = process.env.ADMIN_SECRET_KEY;

  // 개발 환경에서는 인증 스킵 가능
  if (process.env.NODE_ENV === 'development' && !adminKey) {
    return true;
  }

  if (!adminKey || !authHeader) {
    return false;
  }

  // Bearer 토큰 형식 확인
  const token = authHeader.replace('Bearer ', '');
  return token === adminKey;
}

/**
 * IP 주소 추출
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Vercel 환경
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare 환경
  const cfConnectingIP = headersList.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // 일반 프록시
  const realIP = headersList.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * POST /api/verify
 * 휴대폰 번호 인증 API
 *
 * @param action - 'send' (인증번호 발송) 또는 'verify' (인증번호 확인)
 * @param phone - 휴대폰 번호
 * @param code - 인증번호 (verify 액션에서만 필요)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, phone, code } = body;

    // 클라이언트 정보 수집 (로깅용)
    const clientIP = await getClientIP();
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';

    // 로깅 (프로덕션에서는 민감 정보 제외)
    if (process.env.NODE_ENV === 'production') {
      console.log(`[SMS API] Action: ${action}, IP: ${clientIP}, Time: ${new Date().toISOString()}`);
    } else {
      console.log(`[SMS API] Action: ${action}, Phone: ${phone}, IP: ${clientIP}`);
    }

    // 입력 검증
    if (!action || !phone) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 (더 엄격한 검증)
    const phoneRegex = /^(010|011|016|017|018|019)[-]?\d{3,4}[-]?\d{4}$/;
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    if (!phoneRegex.test(phone) && !phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: '올바른 휴대폰 번호 형식이 아닙니다' },
        { status: 400 }
      );
    }

    // 인증번호 발송
    if (action === 'send') {
      const result = await getVerificationService().sendVerificationCode(phone);

      if (!result.success) {
        // 프로덕션에서는 구체적인 오류 숨김
        const errorMessage = process.env.NODE_ENV === 'production'
          ? '인증번호 발송에 실패했습니다'
          : result.error || '인증번호 발송에 실패했습니다';

        return NextResponse.json(
          {
            error: errorMessage,
            message: result.message
          },
          { status: 400 }
        );
      }

      // 프로덕션에서는 절대 인증번호 반환하지 않음
      const response: any = {
        success: true,
        message: result.message
      };

      // 개발 환경에서만 데모 코드 반환
      if (process.env.NODE_ENV !== 'production' && process.env.SHOW_DEMO_CODE !== 'false') {
        response.demoCode = result.demoCode;
      }

      return NextResponse.json(response);
    }

    // 인증번호 확인
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json(
          { error: '인증번호를 입력해주세요' },
          { status: 400 }
        );
      }

      // 인증번호 형식 검증 (6자리 숫자)
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { error: '올바른 인증번호 형식이 아닙니다' },
          { status: 400 }
        );
      }

      const result = await getVerificationService().verifyCode(phone, code);

      if (!result.success) {
        // 프로덕션에서는 구체적인 오류 숨김
        const errorMessage = process.env.NODE_ENV === 'production'
          ? '인증에 실패했습니다'
          : result.error || '인증에 실패했습니다';

        return NextResponse.json(
          {
            error: errorMessage,
            message: result.message,
            verified: false
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: result.message
      });
    }

    // 잘못된 액션
    return NextResponse.json(
      { error: '올바르지 않은 요청입니다' },
      { status: 400 }
    );

  } catch (error) {
    console.error('인증 API 오류:', error);

    // 프로덕션에서는 내부 오류 정보 숨김
    const errorMessage = process.env.NODE_ENV === 'production'
      ? '서버 오류가 발생했습니다'
      : `서버 오류: ${error instanceof Error ? error.message : 'Unknown error'}`;

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verify/stats
 * 인증 서비스 통계 (관리자용)
 *
 * Headers:
 * - Authorization: Bearer {ADMIN_SECRET_KEY}
 */
export async function GET(request: Request) {
  try {
    // 관리자 권한 체크
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const stats = getVerificationService().getStats();

    // 프로덕션에서는 민감한 정보 필터링
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: true,
        stats: {
          provider: stats.provider,
          rateLimiter: {
            totalEntries: stats.rateLimiter.totalEntries,
            blockedNumbers: stats.rateLimiter.blockedNumbers,
            recentAttempts: stats.rateLimiter.recentAttempts
          }
          // memoryStoreSize는 프로덕션에서 제외
        }
      });
    }

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('통계 조회 오류:', error);

    const errorMessage = process.env.NODE_ENV === 'production'
      ? '통계 조회에 실패했습니다'
      : `통계 조회 오류: ${error instanceof Error ? error.message : 'Unknown error'}`;

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/verify
 * CORS preflight 요청 처리
 */
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}