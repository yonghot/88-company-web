import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const appKey = process.env.NHN_APP_KEY!;
const secretKey = process.env.NHN_SECRET_KEY!;
const sendNo = process.env.NHN_SEND_NO!;

console.log('🔍 NHN Cloud API 상세 진단\n');
console.log('='.repeat(50));

async function testEndpoint(name: string, url: string, method: string = 'GET') {
  console.log(`\n📍 테스트: ${name}`);
  console.log(`URL: ${url}`);
  console.log(`Method: ${method}`);

  try {
    const headers: any = {
      'X-Secret-Key': secretKey,
      'Content-Type': 'application/json;charset=UTF-8'
    };

    const options: any = {
      method,
      headers
    };

    if (method === 'POST') {
      options.body = JSON.stringify({
        body: 'Test',
        sendNo: sendNo,
        recipientList: [{
          recipientNo: '01012345678',
          countryCode: '82'
        }],
        userId: 'test'
      });
    }

    const response = await fetch(url, options);
    const text = await response.text();

    console.log(`상태: ${response.status} ${response.statusText}`);

    if (text) {
      try {
        const data = JSON.parse(text);
        console.log('응답:', JSON.stringify(data, null, 2));

        if (data.header) {
          if (data.header.isSuccessful) {
            console.log('✅ 성공');
          } else {
            console.log(`⚠️ 실패: ${data.header.resultMessage} (코드: ${data.header.resultCode})`);
          }
        }
      } catch (e) {
        console.log('텍스트 응답:', text.substring(0, 200));
      }
    }

    return response.status;
  } catch (error: any) {
    console.log(`❌ 에러: ${error.message}`);
    return -1;
  }
}

async function tryAlternativeEndpoints() {
  const endpoints = [
    {
      name: 'Toast SMS v3.0 (한국)',
      base: 'https://api-sms.cloud.toast.com',
      paths: [
        `/sms/v3.0/appKeys/${appKey}/senders`,
        `/sms/v3.0/appKeys/${appKey}/sender/auth/sms`
      ]
    },
    {
      name: 'Toast SMS v2.4 (Legacy)',
      base: 'https://api-sms.cloud.toast.com',
      paths: [
        `/sms/v2.4/appKeys/${appKey}/senders`,
        `/sms/v2.4/appKeys/${appKey}/sender/sms`
      ]
    },
    {
      name: 'NHN KR Region',
      base: 'https://kr1-api-sms.cloud.toast.com',
      paths: [
        `/sms/v3.0/appKeys/${appKey}/senders`
      ]
    },
    {
      name: 'Alternative Auth Header',
      base: 'https://api-sms.cloud.toast.com',
      paths: [
        `/sms/v3.0/appKeys/${appKey}/senders`
      ],
      customHeaders: true
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔧 ${endpoint.name}`);
    console.log('='.repeat(50));

    for (const path of endpoint.paths) {
      const url = `${endpoint.base}${path}`;

      if (endpoint.customHeaders) {
        console.log('(Alternative headers: X-TC-APP-KEY, X-TC-AUTHENTICATION)');
        const headers: any = {
          'X-TC-APP-KEY': appKey,
          'X-TC-AUTHENTICATION': secretKey,
          'Content-Type': 'application/json'
        };

        try {
          const response = await fetch(url, { headers });
          console.log(`상태: ${response.status}`);
        } catch (e: any) {
          console.log(`❌ ${e.message}`);
        }
      } else {
        await testEndpoint(path, url);
      }
    }
  }
}

async function checkProjectStructure() {
  console.log('\n' + '='.repeat(50));
  console.log('📋 프로젝트 구조 확인');
  console.log('='.repeat(50));

  console.log('\nApp Key 형식 분석:');
  console.log(`- 길이: ${appKey.length}자`);
  console.log(`- 패턴: ${appKey.match(/[A-Za-z0-9]+/) ? '영숫자' : '특수문자 포함'}`);

  console.log('\nSecret Key 형식 분석:');
  console.log(`- 길이: ${secretKey.length}자`);
  console.log(`- 앞 4자: ${secretKey.substring(0, 4)}`);

  console.log('\n발신번호 형식:');
  console.log(`- 원본: ${sendNo}`);
  console.log(`- 숫자만: ${sendNo.replace(/-/g, '')}`);
}

async function testWithDifferentAuth() {
  console.log('\n' + '='.repeat(50));
  console.log('🔐 다양한 인증 방식 테스트');
  console.log('='.repeat(50));

  const authMethods = [
    {
      name: 'X-Secret-Key (Standard)',
      headers: {
        'X-Secret-Key': secretKey
      }
    },
    {
      name: 'X-TC-APP-KEY + X-TC-AUTHENTICATION',
      headers: {
        'X-TC-APP-KEY': appKey,
        'X-TC-AUTHENTICATION': secretKey
      }
    },
    {
      name: 'Authorization Bearer',
      headers: {
        'Authorization': `Bearer ${secretKey}`
      }
    },
    {
      name: 'X-NHN-SECRET-KEY',
      headers: {
        'X-NHN-SECRET-KEY': secretKey
      }
    }
  ];

  const url = `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/senders`;

  for (const method of authMethods) {
    console.log(`\n테스트: ${method.name}`);

    try {
      const response = await fetch(url, {
        headers: {
          ...method.headers,
          'Content-Type': 'application/json'
        } as unknown as HeadersInit
      });

      const data = await response.json();
      console.log(`상태: ${response.status}`);
      if (data.header) {
        console.log(`결과: ${data.header.isSuccessful ? '✅' : '❌'} ${data.header.resultMessage}`);
      }
    } catch (e: any) {
      console.log(`❌ 에러: ${e.message}`);
    }
  }
}

async function main() {
  console.log('1️⃣ 환경 변수 상태');
  console.log('-'.repeat(50));
  console.log(`APP_KEY: ${appKey ? '✅' : '❌'} ${appKey || '미설정'}`);
  console.log(`SECRET_KEY: ${secretKey ? '✅' : '❌'} ${secretKey ? secretKey.substring(0, 6) + '...' : '미설정'}`);
  console.log(`SEND_NO: ${sendNo ? '✅' : '❌'} ${sendNo || '미설정'}`);
  console.log(`SMS_PROVIDER: ${process.env.SMS_PROVIDER}`);

  await checkProjectStructure();
  await testWithDifferentAuth();
  await tryAlternativeEndpoints();

  console.log('\n' + '='.repeat(50));
  console.log('💡 권장 사항:');
  console.log('='.repeat(50));
  console.log('1. NHN Cloud Console에서 다음 사항 확인:');
  console.log('   - Notification > SMS 서비스 활성화 여부');
  console.log('   - App Key가 SMS 서비스의 App Key인지 확인');
  console.log('   - Secret Key가 올바른지 확인');
  console.log('   - 발신번호(010-5317-9499)가 사전 등록되었는지 확인');
  console.log('2. API 버전 확인 (v2.4 vs v3.0)');
  console.log('3. 프로젝트 리전 확인 (한국/일본/미국)');
}

main().catch(console.error);