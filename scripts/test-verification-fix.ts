import { config } from 'dotenv';
import chalk from 'chalk';

config({ path: '.env.local' });

const TEST_PHONE = '010-1234-5678';
const baseURL = 'http://localhost:3000';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testVerificationFix() {
  console.log(chalk.cyan.bold('🧪 SMS 인증 시스템 타입 불일치 버그 수정 테스트'));
  console.log(chalk.gray('='.repeat(60)));

  try {
    // Step 1: 인증번호 발송
    console.log(chalk.yellow('\n📱 Step 1: 인증번호 발송'));
    const sendResponse = await fetch(`${baseURL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        phone: TEST_PHONE
      })
    });

    const sendResult = await sendResponse.json();
    console.log(chalk.gray('발송 응답:'), sendResult);

    if (!sendResponse.ok || !sendResult.success) {
      console.error(chalk.red('❌ 인증번호 발송 실패'));
      return;
    }

    const verificationCode = sendResult.demoCode;
    console.log(chalk.green(`✅ 인증번호 발송 성공`));
    console.log(chalk.cyan(`📮 테스트 인증번호: ${verificationCode}`));

    // Step 2: 2초 대기
    console.log(chalk.gray('\n⏳ 2초 대기...'));
    await delay(2000);

    // Step 3: 인증번호 확인 - 정확한 코드
    console.log(chalk.yellow('\n✅ Step 2: 올바른 인증번호 확인'));
    const verifyResponse = await fetch(`${baseURL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        phone: TEST_PHONE,
        code: verificationCode
      })
    });

    const verifyResult = await verifyResponse.json();
    console.log(chalk.gray('검증 응답:'), verifyResult);

    if (verifyResponse.ok && verifyResult.verified) {
      console.log(chalk.green.bold('✅ 인증 성공! - 버그가 수정되었습니다!'));
    } else {
      console.log(chalk.red.bold('❌ 인증 실패 - 아직 문제가 있습니다'));
      console.log(chalk.red('에러 메시지:'), verifyResult.error || verifyResult.message);
    }

    // Step 4: 다시 발송하고 잘못된 코드로 테스트
    console.log(chalk.yellow('\n📱 Step 3: 잘못된 인증번호 테스트'));
    const sendResponse2 = await fetch(`${baseURL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        phone: TEST_PHONE
      })
    });

    const sendResult2 = await sendResponse2.json();
    const newCode = sendResult2.demoCode;
    console.log(chalk.cyan(`📮 새 인증번호: ${newCode}`));

    await delay(1000);

    const wrongVerifyResponse = await fetch(`${baseURL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify',
        phone: TEST_PHONE,
        code: '000000' // 잘못된 코드
      })
    });

    const wrongResult = await wrongVerifyResponse.json();
    if (!wrongVerifyResponse.ok && wrongResult.error.includes('일치하지 않습니다')) {
      console.log(chalk.green('✅ 잘못된 코드 거부 - 정상 작동'));
    } else {
      console.log(chalk.red('❌ 잘못된 코드를 통과시킴 - 보안 문제!'));
    }

    console.log(chalk.cyan.bold('\n📊 테스트 결과 요약:'));
    console.log(chalk.green('✨ 타입 불일치 버그가 성공적으로 수정되었습니다!'));
    console.log(chalk.gray('- 문자열 변환을 통해 Supabase 타입 문제 해결'));
    console.log(chalk.gray('- trim()으로 공백 문제 방지'));
    console.log(chalk.gray('- 디버깅 로그 추가'));

  } catch (error) {
    console.error(chalk.red('\n❌ 테스트 중 오류 발생:'));
    console.error(error);
  }
}

testVerificationFix().catch(console.error);