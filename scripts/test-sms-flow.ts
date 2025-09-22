import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 SMS 발송 플로우 진단\n');
console.log('='.repeat(50));

// 1. 환경 변수 확인
console.log('1️⃣ 환경 변수 확인');
console.log('-'.repeat(50));
console.log(`SMS_PROVIDER: ${process.env.SMS_PROVIDER}`);
console.log(`NHN_APP_KEY: ${process.env.NHN_APP_KEY}`);
console.log(`NHN_SECRET_KEY: ${process.env.NHN_SECRET_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
console.log(`NHN_SEND_NO: ${process.env.NHN_SEND_NO}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`SHOW_DEMO_CODE: ${process.env.SHOW_DEMO_CODE}`);
console.log('');

// 2. SMSService 초기화 테스트
console.log('2️⃣ SMSService 초기화 테스트');
console.log('-'.repeat(50));

import { SMSService } from '../lib/sms/sms-service';

try {
  const smsService = SMSService.getInstance();
  console.log('✅ SMSService 인스턴스 생성 성공');

  // provider 체크 - private 필드에 접근할 수 없으므로 다른 방법 사용
  const testMessage = '[88 Company] 테스트 메시지';
  const testPhone = '01012345678';

  console.log('\n3️⃣ SMS 발송 테스트 (드라이 런)');
  console.log('-'.repeat(50));
  console.log(`테스트 번호: ${testPhone}`);
  console.log(`테스트 메시지: ${testMessage}`);

  // 실제 발송 시도 (테스트 번호로)
  smsService.sendSMS(testPhone, testMessage)
    .then(result => {
      console.log('\n발송 결과:', JSON.stringify(result, null, 2));

      if (result.provider === 'demo') {
        console.log('\n⚠️ 경고: Demo 모드로 실행 중입니다!');
        console.log('실제 SMS가 발송되지 않습니다.');
      } else if (result.provider === 'nhncloud') {
        console.log('\n✅ NHN Cloud 프로바이더로 실행 중입니다.');
        console.log('실제 SMS 발송이 시도되었습니다.');
      }
    })
    .catch(error => {
      console.error('\n❌ SMS 발송 실패:', error);
    });

} catch (error) {
  console.error('❌ SMSService 초기화 실패:', error);
}

// 3. VerificationService 테스트
console.log('\n4️⃣ VerificationService 테스트');
console.log('-'.repeat(50));

import { VerificationService } from '../lib/sms/verification-service';

try {
  const verificationService = VerificationService.getInstance();
  console.log('✅ VerificationService 인스턴스 생성 성공');

  // 인증번호 발송 테스트 (실제 발송은 하지 않음)
  const testPhone2 = '01098765432';
  console.log(`\n테스트 번호로 인증번호 발송 시도: ${testPhone2}`);

  verificationService.sendVerificationCode(testPhone2)
    .then(result => {
      console.log('\n인증 서비스 결과:', JSON.stringify(result, null, 2));

      if (result.demoCode) {
        console.log('\n⚠️ Demo 모드 인증번호가 반환되었습니다:', result.demoCode);
      }
    })
    .catch(error => {
      console.error('\n❌ 인증번호 발송 실패:', error);
    });

} catch (error) {
  console.error('❌ VerificationService 초기화 실패:', error);
}

// 4. API 라우트 시뮬레이션
console.log('\n5️⃣ API 라우트 시뮬레이션');
console.log('-'.repeat(50));

async function testAPIRoute() {
  const testData = {
    action: 'send',
    phone: '010-1234-5678'
  };

  console.log('요청 데이터:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('http://localhost:3000/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('\nAPI 응답:', JSON.stringify(result, null, 2));

    if (result.demoCode) {
      console.log('\n⚠️ API가 Demo 코드를 반환했습니다!');
    }

  } catch (error) {
    console.log('\n❌ API 호출 실패 (서버가 실행 중인지 확인):', error);
  }
}

// 5초 후 API 테스트 실행
setTimeout(() => {
  testAPIRoute();
}, 5000);

console.log('\n💡 진단 정보:');
console.log('- SMS_PROVIDER가 "demo"면 실제 SMS가 발송되지 않습니다');
console.log('- SMS_PROVIDER가 "nhncloud"면 실제 SMS 발송을 시도합니다');
console.log('- SHOW_DEMO_CODE가 true면 개발 환경에서 인증번호가 표시됩니다');
console.log('\n5초 후 API 테스트가 실행됩니다...');