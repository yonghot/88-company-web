import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 NHN Cloud SMS Direct API Test\n');
console.log('=' .repeat(50));

const appKey = process.env.NHN_APP_KEY!;
const secretKey = process.env.NHN_SECRET_KEY!;
const sendNo = process.env.NHN_SEND_NO!;

console.log('현재 설정:');
console.log(`App Key: ${appKey}`);
console.log(`Secret Key: ${secretKey.substring(0, 8)}...`);
console.log(`발신번호: ${sendNo}`);
console.log('');

// 1. 프로젝트 정보 확인 (다른 엔드포인트)
async function testProjectInfo() {
  console.log('📌 Test 1: Project Info Check');
  console.log('-'.repeat(50));

  const endpoints = [
    {
      name: 'SMS Service Info',
      url: `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}`,
      method: 'GET'
    },
    {
      name: 'Sender Numbers List',
      url: `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/sendNos`,
      method: 'GET'
    },
    {
      name: 'Categories',
      url: `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/categories`,
      method: 'GET'
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);

    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'X-Secret-Key': secretKey,
          'Content-Type': 'application/json;charset=UTF-8'
        }
      });

      const text = await response.text();
      console.log(`Status: ${response.status}`);

      try {
        const data = JSON.parse(text);
        if (data.header) {
          console.log(`Result: ${data.header.isSuccessful ? '✅' : '❌'} ${data.header.resultMessage}`);
          if (data.header.isSuccessful && data.body) {
            console.log('Body:', JSON.stringify(data.body, null, 2));
          }
        }
      } catch {
        console.log('Response:', text.substring(0, 200));
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }
}

// 2. 다른 리전 테스트
async function testRegions() {
  console.log('\n📌 Test 2: Region Check');
  console.log('-'.repeat(50));

  const regions = [
    { name: 'Global', url: 'https://api-sms.cloud.toast.com' },
    { name: 'Korea', url: 'https://kr1-api-sms.cloud.toast.com' },
    { name: 'Japan', url: 'https://jp1-api-sms.cloud.toast.com' }
  ];

  for (const region of regions) {
    console.log(`\nTesting ${region.name}: ${region.url}`);

    try {
      const response = await fetch(`${region.url}/sms/v3.0/appKeys/${appKey}/senders`, {
        headers: {
          'X-Secret-Key': secretKey,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log(`Status: ${response.status}`);
      if (data.header) {
        console.log(`Result: ${data.header.isSuccessful ? '✅ SUCCESS' : `❌ ${data.header.resultMessage}`}`);
      }
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }
}

// 3. SMS 발송 테스트 (Dry Run)
async function testSMSSend() {
  console.log('\n📌 Test 3: SMS Send (Validation Only)');
  console.log('-'.repeat(50));

  const testNumber = '01012345678'; // 테스트용 번호
  const requestBody = {
    body: '[88 Company] 테스트 메시지입니다.',
    sendNo: sendNo.replace(/-/g, ''), // 하이픈 제거
    recipientList: [
      {
        recipientNo: testNumber,
        countryCode: '82'
      }
    ],
    userId: 'system'
  };

  console.log('Request Body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(
      `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/sender/sms`,
      {
        method: 'POST',
        headers: {
          'X-Secret-Key': secretKey,
          'Content-Type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    console.log(`\nStatus: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
  }
}

// 4. 인증 방식 체크
async function testAuthentication() {
  console.log('\n📌 Test 4: Authentication Methods');
  console.log('-'.repeat(50));

  const authTests = [
    {
      name: 'Standard (X-Secret-Key)',
      headers: {
        'X-Secret-Key': secretKey
      }
    },
    {
      name: 'With Timestamp',
      headers: {
        'X-Secret-Key': secretKey,
        'X-TC-TIMESTAMP': Date.now().toString()
      }
    },
    {
      name: 'App Key in Header',
      headers: {
        'X-Secret-Key': secretKey,
        'X-TC-APP-KEY': appKey
      }
    }
  ];

  const url = `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/senders`;

  for (const test of authTests) {
    console.log(`\nTesting: ${test.name}`);

    try {
      const response = await fetch(url, {
        headers: {
          ...test.headers,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log(`Status: ${response.status}`);
      console.log(`Result: ${data.header?.isSuccessful ? '✅ SUCCESS' : `❌ ${data.header?.resultMessage}`}`);
    } catch (error: any) {
      console.log(`Error: ${error.message}`);
    }
  }
}

async function main() {
  console.log('\n🚀 Starting comprehensive NHN Cloud SMS tests...\n');

  await testProjectInfo();
  await testRegions();
  await testAuthentication();
  await testSMSSend();

  console.log('\n' + '='.repeat(50));
  console.log('📊 테스트 완료');
  console.log('='.repeat(50));
  console.log('\n💡 확인 사항:');
  console.log('1. App Key가 SMS 서비스의 App Key인지 확인');
  console.log('2. Secret Key가 SMS 서비스의 Secret Key인지 확인');
  console.log('3. NHN Cloud Console에서 SMS 서비스가 "사용" 상태인지 확인');
  console.log('4. 발신번호가 승인된 상태인지 확인');
  console.log('5. 프로젝트 리전이 한국(kr1)인지 확인');
}

main().catch(console.error);