#!/usr/bin/env npx tsx

/**
 * 환경 변수 확인 스크립트
 */

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 환경 변수 로드
config({ path: path.resolve(process.cwd(), '.env.local') });

console.log(`\n${colors.cyan}${'='.repeat(60)}`);
console.log('📋 환경 변수 상태 확인');
console.log(`${'='.repeat(60)}${colors.reset}\n`);

// 환경 변수 정의
const envVars = {
  필수: {
    'NHN_APP_KEY': '  NHN Cloud App Key',
    'NHN_SECRET_KEY': '  NHN Cloud Secret Key',
    'NHN_SEND_NO': '  SMS 발신번호'
  },
  선택: {
    'NHN_PROJECT_ID': '  NHN Cloud 프로젝트 ID',
    'NHN_API_URL': '  NHN Cloud API URL',
    'NEXT_PUBLIC_SUPABASE_URL': '  Supabase URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': '  Supabase Anon Key',
    'ADMIN_SECRET_KEY': '  관리자 API Key',
    'ADMIN_PASSWORD': '  관리자 페이지 비밀번호'
  },
  개발: {
    'NODE_ENV': '  실행 환경',
    'SHOW_DEMO_CODE': '  데모 코드 표시 여부'
  }
};

// 필수 환경 변수 체크
console.log(`${colors.yellow}[필수 환경 변수]${colors.reset}`);
let hasAllRequired = true;
for (const [key, desc] of Object.entries(envVars.필수)) {
  const value = process.env[key];
  if (value) {
    console.log(`${colors.green}✅${colors.reset} ${key.padEnd(30)} ${desc}`);
    console.log(`   → ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    console.log(`${colors.red}❌${colors.reset} ${key.padEnd(30)} ${desc}`);
    console.log(`   → 설정되지 않음`);
    hasAllRequired = false;
  }
}

// 선택 환경 변수 체크
console.log(`\n${colors.blue}[선택 환경 변수]${colors.reset}`);
for (const [key, desc] of Object.entries(envVars.선택)) {
  const value = process.env[key];
  if (value) {
    console.log(`${colors.green}✅${colors.reset} ${key.padEnd(30)} ${desc}`);
    if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
      console.log(`   → ****${value.slice(-4)}`);
    } else {
      console.log(`   → ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
    }
  } else {
    console.log(`${colors.yellow}○${colors.reset} ${key.padEnd(30)} ${desc}`);
    console.log(`   → 설정되지 않음 (선택사항)`);
  }
}

// 개발 환경 변수 체크
console.log(`\n${colors.cyan}[개발 환경 변수]${colors.reset}`);
for (const [key, desc] of Object.entries(envVars.개발)) {
  const value = process.env[key];
  console.log(`${value ? colors.green + '✅' : colors.yellow + '○'}${colors.reset} ${key.padEnd(30)} ${desc}`);
  console.log(`   → ${value || '설정되지 않음 (기본값 사용)'}`);
}

// 환경 파일 체크
console.log(`\n${colors.cyan}[환경 파일 상태]${colors.reset}`);
const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
for (const file of envFiles) {
  const filePath = path.resolve(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`${colors.green}✅${colors.reset} ${file.padEnd(20)} (${stats.size} bytes)`);
  } else {
    console.log(`${colors.yellow}○${colors.reset} ${file.padEnd(20)} (파일 없음)`);
  }
}

// 최종 결과
console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
if (hasAllRequired) {
  console.log(`${colors.green}✅ 모든 필수 환경 변수가 설정되었습니다!${colors.reset}`);
  console.log('NHN Cloud SMS 서비스를 사용할 준비가 되었습니다.');
} else {
  console.log(`${colors.red}⚠️  일부 필수 환경 변수가 누락되었습니다.${colors.reset}`);
  console.log(`\n${colors.yellow}다음 단계:${colors.reset}`);
  console.log('1. .env.local 파일을 생성하거나 수정하세요');
  console.log('2. 누락된 환경 변수를 추가하세요');
  console.log('3. NHN Cloud Console에서 필요한 정보를 확인하세요');
  console.log(`\n자세한 설정 방법은 ${colors.blue}docs/SMS_SETUP.md${colors.reset} 파일을 참고하세요.`);
}
console.log(`${'='.repeat(60)}\n`);