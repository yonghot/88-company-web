import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다');
  process.exit(1);
}

if (!accessToken) {
  console.error('❌ SUPABASE_ACCESS_TOKEN이 설정되지 않았습니다');
  console.error('\n토큰 생성 방법:');
  console.error('1. https://app.supabase.com/account/tokens 접속');
  console.error('2. "Generate new token" 클릭');
  console.error('3. .env.local에 SUPABASE_ACCESS_TOKEN 추가');
  process.exit(1);
}

// Project Reference ID 추출
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Supabase URL에서 Project Reference를 추출할 수 없습니다');
  process.exit(1);
}

async function executeMigration() {
  console.log('🚀 Management API를 통한 마이그레이션 실행...\n');
  console.log(`📌 Project: ${projectRef}`);
  console.log(`🔑 Token: ${accessToken.substring(0, 10)}...`);

  // 마이그레이션 SQL 읽기
  const sqlPath = path.join(__dirname, '../supabase/migrations/remove-is-active-column.sql');
  const migrationSQL = fs.readFileSync(sqlPath, 'utf-8');

  try {
    console.log('\n📡 API 요청 전송 중...');

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: migrationSQL
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('\n❌ API 요청 실패:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response:', JSON.stringify(result, null, 2));

      if (response.status === 401) {
        console.error('\n💡 인증 실패: Access Token이 유효하지 않거나 만료되었습니다.');
        console.error('   새 토큰 생성: https://app.supabase.com/account/tokens');
      } else if (response.status === 403) {
        console.error('\n💡 권한 없음: 이 프로젝트에 대한 권한이 없습니다.');
      }

      process.exit(1);
    }

    console.log('\n✅ 마이그레이션 성공!');
    console.log('\n📊 결과:');
    console.log(JSON.stringify(result, null, 2));

    // Supabase 클라이언트로 확인
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: questions } = await supabase
      .from('chat_questions')
      .select('*')
      .limit(1);

    if (questions && questions.length > 0) {
      console.log('\n📋 변경 후 테이블 구조:');
      console.log(Object.keys(questions[0]));

      if ('is_active' in questions[0]) {
        console.log('⚠️  is_active 컬럼이 여전히 존재합니다');
      } else {
        console.log('✅ is_active 컬럼이 성공적으로 제거되었습니다!');
      }
    }

  } catch (error: any) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('\n상세 오류:', error);
    process.exit(1);
  }
}

executeMigration();
