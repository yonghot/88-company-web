#!/usr/bin/env npx tsx

/**
 * NHN Cloud SMS 인증 시스템 테스트 스크립트
 *
 * 사용법:
 * npm run test:sms
 * 또는
 * npx tsx scripts/test-nhn-sms.ts
 */

import { SMSService } from '../lib/sms/sms-service';
import { VerificationService } from '../lib/sms/verification-service';
import { config } from 'dotenv';
import path from 'path';
import readline from 'readline';

// 환경 변수 로드
config({ path: path.resolve(process.cwd(), '.env.local') });

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// 로그 헬퍼
const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg: string) => console.log(`\n${colors.cyan}${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}${colors.reset}\n`),
  step: (num: number, msg: string) => console.log(`${colors.gray}[Step ${num}]${colors.reset} ${msg}`)
};

// 입력 받기 유틸리티
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

// 테스트 메인 함수
async function runTests() {
  log.section('🧪 NHN Cloud SMS 인증 시스템 테스트');

  try {
    // Step 1: 환경 변수 확인
    log.step(1, '환경 변수 확인');

    const requiredEnvVars = ['NHN_APP_KEY', 'NHN_SECRET_KEY', 'NHN_SEND_NO'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
      log.error(`필수 환경 변수가 누락되었습니다: ${missingVars.join(', ')}`);
      log.info('`.env.local` 파일에 다음 변수들을 설정해주세요:');
      missingVars.forEach(v => console.log(`  ${v}=your_value_here`));
      process.exit(1);
    }

    log.success('모든 필수 환경 변수가 설정되었습니다');
    console.log(`  App Key: ${process.env.NHN_APP_KEY?.substring(0, 10)}...`);
    console.log(`  발신번호: ${process.env.NHN_SEND_NO}`);

    // Step 2: SMS 서비스 초기화
    log.step(2, 'SMS 서비스 초기화');

    let smsService: SMSService;
    let verificationService: VerificationService;

    try {
      smsService = SMSService.getInstance();
      verificationService = VerificationService.getInstance();
      log.success('SMS 서비스가 성공적으로 초기화되었습니다');
    } catch (error) {
      log.error(`서비스 초기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      process.exit(1);
    }

    // Step 3: 헬스 체크
    log.step(3, '서비스 헬스 체크');

    const healthResult = await smsService.healthCheck();

    if (healthResult.healthy) {
      log.success(`NHN Cloud 서비스 연결 상태: ${healthResult.message}`);
    } else {
      log.error(`서비스 연결 실패: ${healthResult.message}`);
      log.warning('NHN Cloud Console에서 서비스 상태를 확인해주세요');
    }

    // Step 4: 발송 가능 여부 확인
    log.step(4, '발송 가능 여부 확인');

    const canSendResult = await smsService.canSend();

    if (canSendResult.canSend) {
      log.success('SMS 발송 가능 상태입니다');
    } else {
      log.error(`발송 불가: ${canSendResult.reason}`);
    }

    // Step 5: 통계 정보 조회
    log.step(5, '서비스 통계 정보');

    const stats = verificationService.getStats();
    console.log(`  프로바이더: ${stats.provider}`);
    console.log(`  오늘 발송 건수: ${stats.todayCount}건`);
    console.log(`  활성 인증: ${stats.activeVerifications}건`);
    console.log(`  일일 한도: ${stats.dailyLimit}건`);
    console.log(`  차단된 번호: ${stats.rateLimiter.blockedNumbers}개`);

    // Step 6: 실제 발송 테스트 (선택)
    log.section('📤 실제 SMS 발송 테스트');

    const doSendTest = await question('\n실제로 SMS를 발송하여 테스트하시겠습니까? (y/N): ');

    if (doSendTest.toLowerCase() === 'y') {
      const phoneNumber = await question('수신할 휴대폰 번호를 입력하세요 (예: 010-1234-5678): ');

      // 전화번호 유효성 검사
      const phoneRegex = /^(010|011|016|017|018|019)[-]?\d{3,4}[-]?\d{4}$/;

      if (!phoneRegex.test(phoneNumber)) {
        log.error('올바른 휴대폰 번호 형식이 아닙니다');
        rl.close();
        return;
      }

      log.info('인증번호를 발송합니다...');

      const result = await verificationService.sendVerificationCode(phoneNumber);

      if (result.success) {
        log.success('인증번호가 성공적으로 발송되었습니다!');

        if (result.demoCode) {
          log.info(`개발 모드 - 테스트 인증번호: ${result.demoCode}`);
        }

        // 인증번호 검증 테스트
        const doVerifyTest = await question('\n인증번호 검증을 테스트하시겠습니까? (y/N): ');

        if (doVerifyTest.toLowerCase() === 'y') {
          const code = await question('받으신 인증번호 6자리를 입력하세요: ');

          const verifyResult = await verificationService.verifyCode(phoneNumber, code);

          if (verifyResult.verified) {
            log.success('인증이 성공적으로 완료되었습니다!');
          } else {
            log.error(`인증 실패: ${verifyResult.error}`);
          }
        }
      } else {
        log.error(`발송 실패: ${result.error}`);

        if (result.retryAfter) {
          log.info(`${result.retryAfter}초 후에 재시도할 수 있습니다`);
        }
      }
    }

    // Step 7: 만료된 코드 정리
    log.step(7, '만료된 인증 코드 정리');

    const cleanedCount = await verificationService.cleanupExpiredCodes();
    log.info(`${cleanedCount}개의 만료된 인증 코드가 정리되었습니다`);

  } catch (error) {
    log.error(`테스트 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    console.error(error);
  } finally {
    rl.close();
  }

  log.section('🎉 테스트 완료');
}

// 테스트 실행
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});