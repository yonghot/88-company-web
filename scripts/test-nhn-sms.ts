import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const appKey = process.env.NHN_APP_KEY!;
const secretKey = process.env.NHN_SECRET_KEY!;
const sendNo = process.env.NHN_SEND_NO!;

console.log('=== NHN Cloud SMS 진단 테스트 ===\n');
console.log('1️⃣ 환경 변수 확인');
console.log('-------------------');
console.log(`APP_KEY: ${appKey ? '✅ 설정됨' : '❌ 미설정'} ${appKey ? `(${appKey})` : ''}`);
console.log(`SECRET_KEY: ${secretKey ? '✅ 설정됨' : '❌ 미설정'} ${secretKey ? `(${secretKey.substring(0, 4)}...)` : ''}`);
console.log(`SEND_NO: ${sendNo ? '✅ 설정됨' : '❌ 미설정'} ${sendNo ? `(${sendNo})` : ''}`);
console.log(`SMS_PROVIDER: ${process.env.SMS_PROVIDER}`);
console.log('');

async function testHealthCheck() {
  console.log('2️⃣ Health Check 테스트');
  console.log('-------------------');

  const url = `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/senders`;

  console.log(`URL: ${url}`);
  console.log('Headers:', {
    'X-Secret-Key': secretKey.substring(0, 4) + '...',
    'Content-Type': 'application/json'
  });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Secret-Key': secretKey,
        'Content-Type': 'application/json'
      }
    });

    const text = await response.text();
    console.log(`응답 상태: ${response.status} ${response.statusText}`);
    console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

    try {
      const data = JSON.parse(text);
      console.log('응답 본문:', JSON.stringify(data, null, 2));

      if (data.header?.isSuccessful) {
        console.log('✅ Health Check 성공!');
        return true;
      } else {
        console.log('❌ Health Check 실패:', data.header?.resultMessage);
        return false;
      }
    } catch (e) {
      console.log('❌ JSON 파싱 실패. 응답:', text.substring(0, 500));
      return false;
    }
  } catch (error) {
    console.log('❌ 요청 실패:', error);
    return false;
  }
}

async function testSendSMS(testPhone: string) {
  console.log('\n3️⃣ SMS 발송 테스트');
  console.log('-------------------');

  const url = `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/sender/sms`;
  const requestBody = {
    body: '[88 Company] 테스트 메시지입니다.',
    sendNo: sendNo,
    recipientList: [
      {
        recipientNo: testPhone,
        countryCode: '82',
        internationalRecipientNo: testPhone,
        templateParameter: {}
      }
    ],
    userId: 'system',
    statsId: `88TEST`
  };

  console.log(`URL: ${url}`);
  console.log('요청 본문:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Secret-Key': secretKey,
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify(requestBody)
    });

    const text = await response.text();
    console.log(`응답 상태: ${response.status} ${response.statusText}`);

    try {
      const data = JSON.parse(text);
      console.log('응답 본문:', JSON.stringify(data, null, 2));

      if (data.header?.isSuccessful) {
        console.log('✅ SMS 발송 요청 성공!');
        console.log('Request ID:', data.body?.data?.requestId);
        return data.body?.data?.requestId;
      } else {
        console.log('❌ SMS 발송 실패:', data.header?.resultMessage);
        console.log('Result Code:', data.header?.resultCode);
        return null;
      }
    } catch (e) {
      console.log('❌ JSON 파싱 실패. 응답:', text.substring(0, 500));
      return null;
    }
  } catch (error) {
    console.log('❌ 요청 실패:', error);
    return null;
  }
}

async function checkMessageStatus(requestId: string) {
  console.log('\n4️⃣ 메시지 상태 확인');
  console.log('-------------------');

  const url = `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/sender/sms/${requestId}`;

  console.log(`URL: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Secret-Key': secretKey
      }
    });

    const data = await response.json();
    console.log('응답:', JSON.stringify(data, null, 2));

    if (data.header?.isSuccessful) {
      console.log('✅ 상태 조회 성공');
      const status = data.body?.data?.messageStatus;
      const statusMap: { [key: string]: string } = {
        '0': '발송 준비',
        '1': '발송 중',
        '2': '발송 성공',
        '3': '발송 실패',
        '4': '예약 취소'
      };
      console.log(`메시지 상태: ${statusMap[status] || '알 수 없음'} (${status})`);
    }
  } catch (error) {
    console.log('❌ 상태 조회 실패:', error);
  }
}

async function runDiagnostics() {
  console.log('\n🔍 NHN Cloud SMS 종합 진단 시작...\n');

  if (!appKey || !secretKey || !sendNo) {
    console.log('❌ 필수 환경 변수가 설정되지 않았습니다.');
    console.log('다음 변수들을 .env.local 파일에 설정해주세요:');
    console.log('- NHN_APP_KEY');
    console.log('- NHN_SECRET_KEY');
    console.log('- NHN_SEND_NO');
    return;
  }

  const healthOk = await testHealthCheck();

  if (healthOk) {
    console.log('\n테스트 SMS를 발송하시겠습니까? (실제 요금이 발생할 수 있습니다)');
    console.log('테스트하려면 수신번호를 입력하세요 (예: 010-1234-5678):');

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('수신번호 (엔터만 누르면 건너뛰기): ', async (phone: string) => {
      if (phone && phone.trim()) {
        const cleanPhone = phone.trim().replace(/-/g, '');
        const requestId = await testSendSMS(cleanPhone);

        if (requestId) {
          console.log('\n3초 후 발송 상태를 확인합니다...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          await checkMessageStatus(requestId);
        }
      } else {
        console.log('SMS 발송 테스트를 건너뛰었습니다.');
      }

      console.log('\n=== 진단 완료 ===');
      readline.close();
    });
  } else {
    console.log('\n❌ Health Check 실패로 진단을 종료합니다.');
    console.log('API 키와 Secret Key가 올바른지 확인해주세요.');
  }
}

runDiagnostics().catch(console.error);