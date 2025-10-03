import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !accessToken) {
  console.error('❌ 필수 환경 변수가 설정되지 않았습니다');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

async function executeMigration() {
  console.log('🚀 step/next_step 컬럼 제거 마이그레이션 실행...\n');

  const sqlPath = path.join(__dirname, '../supabase/migrations/remove-step-next-step-columns.sql');
  const migrationSQL = fs.readFileSync(sqlPath, 'utf-8');

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ query: migrationSQL })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ 마이그레이션 실패:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('✅ 마이그레이션 성공!\n');
    console.log('📊 결과:');
    console.log(JSON.stringify(result, null, 2));

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    const { data: questions } = await supabase
      .from('chat_questions')
      .select('*')
      .limit(1);

    if (questions && questions.length > 0) {
      console.log('\n📋 변경 후 테이블 구조:');
      console.log(Object.keys(questions[0]));

      if ('step' in questions[0] || 'next_step' in questions[0]) {
        console.log('⚠️  step 또는 next_step 컬럼이 여전히 존재합니다');
      } else {
        console.log('✅ step, next_step 컬럼이 성공적으로 제거되었습니다!');
      }
    }

  } catch (error: any) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

executeMigration();
