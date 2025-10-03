#!/usr/bin/env npx tsx

/**
 * SMS 설정 진단 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/diagnose-sms.ts
 */

console.log('🔍 SMS 설정 진단 시작...\n');

// 환경 변수 확인
const SMS_PROVIDER = process.env.SMS_PROVIDER || '미설정 (기본값: demo)';
const NODE_ENV = process.env.NODE_ENV || 'development';
const SHOW_DEMO_CODE = process.env.SHOW_DEMO_CODE !== 'false';

console.log('📋 기본 설정:');
console.log(`  - NODE_ENV: ${NODE_ENV}`);
console.log(`  - SMS_PROVIDER: ${SMS_PROVIDER}`);
console.log(`  - SHOW_DEMO_CODE: ${SHOW_DEMO_CODE}`);
console.log();

// Demo 모드 체크
if (!process.env.SMS_PROVIDER || process.env.SMS_PROVIDER === 'demo') {
  console.log('⚠️  경고: Demo 모드로 실행 중입니다!');
  console.log('  → 실제 SMS가 발송되지 않습니다.');
  console.log('  → 개발 환경에서는 인증번호가 화면에 표시됩니다.');
  console.log('  → 프로덕션 환경에서는 인증이 불가능합니다.\n');

  console.log('✅ 해결 방법:');
  console.log('  1. .env.local 파일에 다음을 추가하세요:');
  console.log('     SMS_PROVIDER=nhncloud');
  console.log('     NHN_APP_KEY=your_app_key');
  console.log('     NHN_SECRET_KEY=your_secret_key');
  console.log('     NHN_SEND_NO=010-1234-5678');
  console.log();
  console.log('  2. Vercel 프로덕션에서는 환경 변수를 Vercel Dashboard에 설정하세요.');
  console.log('     https://vercel.com/your-project/settings/environment-variables');
  console.log();

  process.exit(1);
}

// NHN Cloud 설정 확인
if (process.env.SMS_PROVIDER === 'nhncloud') {
  console.log('✅ NHN Cloud SMS 프로바이더 선택됨\n');

  const NHN_APP_KEY = process.env.NHN_APP_KEY;
  const NHN_SECRET_KEY = process.env.NHN_SECRET_KEY;
  const NHN_SEND_NO = process.env.NHN_SEND_NO;

  console.log('📋 NHN Cloud 설정:');
  console.log(`  - NHN_APP_KEY: ${NHN_APP_KEY ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`  - NHN_SECRET_KEY: ${NHN_SECRET_KEY ? '✅ 설정됨' : '❌ 없음'}`);
  console.log(`  - NHN_SEND_NO: ${NHN_SEND_NO ? `✅ ${NHN_SEND_NO}` : '❌ 없음'}`);
  console.log();

  if (!NHN_APP_KEY || !NHN_SECRET_KEY || !NHN_SEND_NO) {
    console.log('⚠️  경고: NHN Cloud 설정이 불완전합니다!');
    console.log('  → Demo 모드로 자동 전환됩니다.');
    console.log('  → 실제 SMS가 발송되지 않습니다.\n');

    console.log('✅ 해결 방법:');
    console.log('  1. NHN Cloud Console에서 SMS 서비스 활성화');
    console.log('     https://console.nhncloud.com/');
    console.log();
    console.log('  2. .env.local에 다음 환경 변수 설정:');
    console.log('     NHN_APP_KEY=your_app_key');
    console.log('     NHN_SECRET_KEY=your_secret_key');
    console.log('     NHN_SEND_NO=010-1234-5678  # 사전 등록된 발신번호');
    console.log();

    process.exit(1);
  }

  console.log('✅ NHN Cloud SMS 설정이 완료되었습니다!');
  console.log('  → 실제 SMS 발송이 가능합니다.');
  console.log();
}

// Supabase 설정 확인
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Supabase 설정:');
console.log(`  - NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 없음'}`);
console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨 (RLS 우회 가능)' : '⚠️  없음 (RLS 제한)'}`);
console.log();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('⚠️  경고: Supabase가 설정되지 않았습니다.');
  console.log('  → 인증 코드가 메모리에만 저장됩니다.');
  console.log('  → 서버 재시작 시 인증 코드가 삭제됩니다.');
  console.log();
}

console.log('✅ 진단 완료!');
console.log();
console.log('📌 다음 단계:');
console.log('  1. 필요한 환경 변수를 .env.local에 설정하세요.');
console.log('  2. 개발 서버를 재시작하세요: npm run dev');
console.log('  3. 전화번호 인증을 테스트하세요.');
console.log();
