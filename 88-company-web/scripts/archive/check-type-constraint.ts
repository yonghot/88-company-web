import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !accessToken) {
  console.error('❌ 필수 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function checkTypeConstraint() {
  console.log('🔍 chat_questions 테이블의 type 제약 조건 확인...\n');

  const checkSQL = `
    SELECT
      conname AS constraint_name,
      pg_get_constraintdef(c.oid) AS constraint_definition
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class cl ON cl.oid = c.conrelid
    WHERE cl.relname = 'chat_questions'
      AND c.contype = 'c';
  `;

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query: checkSQL })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ 조회 실패:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('📋 현재 제약 조건:\n');
    result.forEach((row: any) => {
      console.log(`제약 이름: ${row.constraint_name}`);
      console.log(`제약 정의: ${row.constraint_definition}\n`);
    });

  } catch (error: any) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

checkTypeConstraint();
