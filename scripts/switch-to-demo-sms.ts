#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const envPath = path.resolve(process.cwd(), '.env.local');

console.log('🔄 SMS 프로바이더를 Demo 모드로 전환합니다...\n');

try {
  // .env.local 파일 읽기
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // SMS_PROVIDER 설정 변경
  const lines = envContent.split('\n');
  const newLines: string[] = [];
  let providerFound = false;
  let showDemoFound = false;

  for (const line of lines) {
    if (line.startsWith('SMS_PROVIDER=')) {
      newLines.push('SMS_PROVIDER=demo');
      providerFound = true;
    } else if (line.startsWith('SHOW_DEMO_CODE=')) {
      newLines.push('SHOW_DEMO_CODE=true');
      showDemoFound = true;
    } else {
      newLines.push(line);
    }
  }

  // 없으면 추가
  if (!providerFound) {
    newLines.push('SMS_PROVIDER=demo');
  }
  if (!showDemoFound) {
    newLines.push('SHOW_DEMO_CODE=true');
  }

  // 파일 쓰기
  fs.writeFileSync(envPath, newLines.join('\n'));

  console.log('✅ .env.local 파일이 업데이트되었습니다.');
  console.log('');
  console.log('📋 현재 설정:');
  console.log('-------------------');
  console.log('SMS_PROVIDER=demo');
  console.log('SHOW_DEMO_CODE=true');
  console.log('');
  console.log('💡 Demo 모드 특징:');
  console.log('- 실제 SMS가 발송되지 않습니다');
  console.log('- 인증번호가 화면에 표시됩니다');
  console.log('- 개발/테스트 용도로만 사용하세요');
  console.log('');
  console.log('🚀 서버를 재시작하려면:');
  console.log('   npm run dev');
  console.log('');
  console.log('🔙 NHN Cloud로 되돌리려면:');
  console.log('   SMS_PROVIDER=nhncloud로 변경하세요');

} catch (error) {
  console.error('❌ 오류가 발생했습니다:', error);
  process.exit(1);
}