import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

console.log('✅ .env.local 로드 완료\n');
console.log('🔍 SMS 설정 진단 시작...\n');

const SMS_PROVIDER = process.env.SMS_PROVIDER || '미설정';
const NHN_APP_KEY = process.env.NHN_APP_KEY;
const NHN_SECRET_KEY = process.env.NHN_SECRET_KEY;
const NHN_SEND_NO = process.env.NHN_SEND_NO;

console.log('📋 환경 변수 상태:');
console.log(`  - SMS_PROVIDER: ${SMS_PROVIDER}`);
console.log(`  - NHN_APP_KEY: ${NHN_APP_KEY ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`  - NHN_SECRET_KEY: ${NHN_SECRET_KEY ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`  - NHN_SEND_NO: ${NHN_SEND_NO || '❌ 없음'}`);
console.log();

if (SMS_PROVIDER === 'nhncloud' && NHN_APP_KEY && NHN_SECRET_KEY && NHN_SEND_NO) {
  console.log('✅ NHN Cloud SMS 설정이 완료되었습니다!');
  console.log('  → 실제 SMS 발송이 가능합니다.');
} else {
  console.log('⚠️  Demo 모드로 실행됩니다.');
  console.log('  → 실제 SMS가 발송되지 않습니다.');
}
