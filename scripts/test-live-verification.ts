import { config } from 'dotenv';
import chalk from 'chalk';

config({ path: '.env.local' });

const TEST_PHONE = '010-9876-5432';
const baseURL = 'https://www.88-company.com';

async function testLiveVerification() {
  console.log(chalk.cyan.bold('🔍 실시간 SMS 인증 시스템 완전 진단'));
  console.log(chalk.gray('='.repeat(60)));

  try {
    // Step 1: 인증번호 발송
    console.log(chalk.yellow('\n📱 Step 1: 인증번호 발송 테스트'));
    console.log(chalk.gray(`전화번호: ${TEST_PHONE}`));

    const sendResponse = await fetch(`${baseURL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        phone: TEST_PHONE
      })
    });

    console.log(chalk.blue(`응답 상태: ${sendResponse.status} ${sendResponse.statusText}`));

    // 응답 헤더 확인
    const headers: any = {};
    sendResponse.headers.forEach((value, key) => {
      if (key.includes('vercel') || key.includes('cache') || key === 'date') {
        headers[key] = value;
      }
    });

    if (Object.keys(headers).length > 0) {
      console.log(chalk.gray('응답 헤더:'));
      Object.entries(headers).forEach(([key, value]) => {
        console.log(chalk.gray(`  ${key}: ${value}`));
      });
    }

    const sendResult = await sendResponse.json();
    console.log(chalk.gray('응답 본문:'), JSON.stringify(sendResult, null, 2));

    if (!sendResponse.ok) {
      console.error(chalk.red(`❌ 발송 실패: ${sendResult.error || sendResult.message}`));
      console.log(chalk.yellow('\n📊 진단 결과:'));
      console.log(chalk.red('• SMS 발송 API 자체가 실패하고 있습니다'));
      console.log(chalk.yellow('• 가능한 원인:'));
      console.log(chalk.gray('  1. 전화번호 형식 검증 문제'));
      console.log(chalk.gray('  2. SMS 프로바이더 설정 문제'));
      console.log(chalk.gray('  3. 환경변수 누락'));
      return;
    }

    const verificationCode = sendResult.demoCode || '123456';
    console.log(chalk.green(`✅ 발송 성공`));

    if (sendResult.demoCode) {
      console.log(chalk.cyan(`📮 데모 인증번호: ${verificationCode}`));
    }

    // Step 2: 2초 대기
    console.log(chalk.gray('\n⏳ 2초 대기...'));
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: 인증번호 확인
    console.log(chalk.yellow('\n✅ Step 2: 인증번호 검증 테스트'));
    console.log(chalk.gray(`인증번호: ${verificationCode}`));

    const verifyResponse = await fetch(`${baseURL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        phone: TEST_PHONE,
        code: verificationCode
      })
    });

    console.log(chalk.blue(`응답 상태: ${verifyResponse.status} ${verifyResponse.statusText}`));

    const verifyResult = await verifyResponse.json();
    console.log(chalk.gray('응답 본문:'), JSON.stringify(verifyResult, null, 2));

    if (verifyResponse.ok && verifyResult.verified) {
      console.log(chalk.green.bold('✅ 인증 성공!'));
    } else {
      console.log(chalk.red.bold('❌ 인증 실패'));
      console.log(chalk.yellow('\n📊 진단 결과:'));
      console.log(chalk.red('• 인증 코드가 맞는데도 실패합니다'));
      console.log(chalk.yellow('• 가능한 원인:'));
      console.log(chalk.gray('  1. Supabase 저장/조회 문제'));
      console.log(chalk.gray('  2. 타입 변환 문제 (string vs number)'));
      console.log(chalk.gray('  3. 전화번호 정규화 불일치'));
      console.log(chalk.gray('  4. 타임스탬프 검증 오류'));
    }

    // Step 4: 잘못된 코드 테스트
    console.log(chalk.yellow('\n🔒 Step 3: 보안 테스트 (잘못된 코드)'));

    const wrongVerifyResponse = await fetch(`${baseURL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        phone: TEST_PHONE,
        code: '000000'
      })
    });

    const wrongResult = await wrongVerifyResponse.json();

    if (!wrongVerifyResponse.ok) {
      console.log(chalk.green('✅ 잘못된 코드 거부 - 정상'));
    } else {
      console.log(chalk.red('❌ 보안 문제 - 잘못된 코드 통과'));
    }

    // 최종 진단
    console.log(chalk.cyan.bold('\n📊 종합 진단 결과:'));

    if (!sendResponse.ok) {
      console.log(chalk.red('🚨 발송 단계에서 실패'));
      console.log(chalk.yellow('권장 조치:'));
      console.log('1. Vercel 환경변수 확인');
      console.log('2. SMS_PROVIDER 설정 확인');
      console.log('3. 프로덕션 로그 확인');
    } else if (!verifyResponse.ok || !verifyResult.verified) {
      console.log(chalk.red('🚨 검증 단계에서 실패'));
      console.log(chalk.yellow('권장 조치:'));
      console.log('1. Supabase 연결 상태 확인');
      console.log('2. verification-service.ts 타입 처리 확인');
      console.log('3. 전화번호 정규화 로직 확인');
    } else {
      console.log(chalk.green('✅ 시스템 정상 작동 중'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ 테스트 중 오류 발생:'));
    console.error(error);
  }
}

testLiveVerification().catch(console.error);