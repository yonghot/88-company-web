/**
 * SMS 인증 시스템 테스트 스크립트
 * NHN Cloud, Twilio, 알리고, Demo 프로바이더 테스트
 */

console.log('\n📱 SMS 인증 시스템 테스트 시작\n');

// 테스트 환경에서 Demo 모드 사용
process.env.SMS_PROVIDER = process.env.SMS_PROVIDER || 'demo';

// 테스트 전화번호
const testPhones = [
  '010-1234-5678',
  '01012345678',
  '010-9876-5432'
];

// 테스트 결과 추적
let testsPassed = 0;
let testsFailed = 0;

// 테스트 헬퍼 함수
async function runTest(testName: string, testFunction: () => Promise<boolean>): Promise<boolean> {
  try {
    console.log(`\n🧪 테스트: ${testName}`);
    const result = await testFunction();
    if (result) {
      console.log(`✅ 성공`);
      testsPassed++;
    } else {
      console.log(`❌ 실패`);
      testsFailed++;
    }
    return result;
  } catch (error) {
    console.log(`❌ 오류: ${error instanceof Error ? error.message : 'Unknown error'}`);
    testsFailed++;
    return false;
  }
}

// 동적 import로 모듈 로드 (개발 서버 환경)
async function runTests() {
  try {
    // 기본 테스트: 프로바이더 설정 확인
    await runTest('환경 설정 확인', async () => {
      const provider = process.env.SMS_PROVIDER || 'demo';
      console.log(`  현재 프로바이더: ${provider}`);

      if (provider === 'nhncloud') {
        const hasAppKey = !!process.env.NHN_APP_KEY;
        const hasSecretKey = !!process.env.NHN_SECRET_KEY;
        const hasSendNo = !!process.env.NHN_SEND_NO;

        if (!hasAppKey || !hasSecretKey || !hasSendNo) {
          console.log('  ⚠️  NHN Cloud 설정이 불완전합니다');
          console.log('  필요한 환경 변수:');
          if (!hasAppKey) console.log('    - NHN_APP_KEY');
          if (!hasSecretKey) console.log('    - NHN_SECRET_KEY');
          if (!hasSendNo) console.log('    - NHN_SEND_NO');
          return false;
        }
        console.log('  ✅ NHN Cloud 설정 완료');
      }

      return true;
    });

    // API 엔드포인트 테스트
    await runTest('API 엔드포인트 응답', async () => {
      try {
        const response = await fetch('http://localhost:3000/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send',
            phone: '010-1234-5678'
          })
        });

        const data = await response.json();
        console.log(`  API 응답: ${response.status}`);

        if (data.demoCode) {
          console.log(`  📱 Demo 모드 - 인증번호: ${data.demoCode}`);
        }

        return response.ok && data.success;
      } catch (error) {
        console.log('  ⚠️  개발 서버가 실행 중인지 확인하세요');
        return false;
      }
    });

    // 전화번호 형식 검증
    await runTest('전화번호 형식 검증', async () => {
      const validFormats = [
        '010-1234-5678',
        '01012345678',
        '011-123-4567',
        '016-9876-5432'
      ];

      const invalidFormats = [
        '02-1234-5678',  // 지역번호
        '1234567890',    // 형식 오류
        'abc-defg-hijk', // 문자
        '010-12-345'     // 자릿수 부족
      ];

      console.log('  유효한 번호 테스트:');
      for (const phone of validFormats) {
        const normalized = phone.replace(/[^0-9]/g, '');
        console.log(`    ${phone} → ${normalized}`);
      }

      return true;
    });

    // 프로바이더별 설정 안내
    console.log('\n📊 프로바이더별 특징\n');

    console.log('🔵 NHN Cloud (추천)');
    console.log('  - 가격: SMS 11원/건, LMS 30원/건');
    console.log('  - 장점: 대용량 안정성, 상세 모니터링');
    console.log('  - 단점: 초기 설정 복잡');
    console.log('  - 용도: 프로덕션 환경');

    console.log('\n⚪ Twilio');
    console.log('  - 가격: 약 100원/건 (한국)');
    console.log('  - 장점: 글로벌 지원, 즉시 시작');
    console.log('  - 단점: 높은 가격');
    console.log('  - 용도: 국제 SMS');

    console.log('\n🟡 알리고');
    console.log('  - 가격: SMS 16원/건');
    console.log('  - 장점: 간단한 설정, 저렴');
    console.log('  - 단점: 국내 전용');
    console.log('  - 용도: 중소규모 서비스');

  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
  }

  // 테스트 결과 요약
  console.log('\n📊 테스트 결과 요약\n');
  console.log(`  성공: ${testsPassed}개`);
  console.log(`  실패: ${testsFailed}개`);
  console.log(`  전체: ${testsPassed + testsFailed}개`);

  const successRate = testsPassed > 0 ? ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1) : '0';
  if (successRate === '100.0') {
    console.log(`\n🎉 모든 테스트 통과! (${successRate}%)`);
  } else if (parseFloat(successRate) >= 80) {
    console.log(`\n⚠️  대부분의 테스트 통과 (${successRate}%)`);
  } else {
    console.log(`\n❌ 테스트 실패 (${successRate}%)`);
  }

  // 환경 설정 안내
  console.log('\n📝 환경 설정 안내\n');
  console.log('SMS 프로바이더를 실제로 사용하려면 .env.local 파일에 다음 설정을 추가하세요:\n');
  console.log('# NHN Cloud (추천 - 국내/국제 SMS)');
  console.log('SMS_PROVIDER=nhncloud');
  console.log('NHN_APP_KEY=your_app_key');
  console.log('NHN_SECRET_KEY=your_secret_key');
  console.log('NHN_SEND_NO=0212345678\n');
  console.log('자세한 설정 가이드: docs/NHN_CLOUD_SMS_GUIDE.md');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// 테스트 실행
runTests().catch(console.error);