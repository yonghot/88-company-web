import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !accessToken) {
  console.error('❌ 필수 환경 변수가 설정되지 않았습니다');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_ACCESS_TOKEN:', !!accessToken);
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Supabase URL에서 프로젝트 ID를 추출할 수 없습니다');
  process.exit(1);
}

async function executeMigration() {
  console.log('🚀 Leads 테이블 스키마 업데이트 실행...\n');

  const sqlPath = path.join(__dirname, '../supabase/migrations/update-leads-schema-for-questions.sql');
  const migrationSQL = fs.readFileSync(sqlPath, 'utf-8');

  console.log('📝 실행할 SQL:');
  console.log('─'.repeat(60));
  console.log(migrationSQL);
  console.log('─'.repeat(60));
  console.log();

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

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (leads && leads.length > 0) {
      console.log('\n📋 업데이트된 테이블 구조:');
      console.log('컬럼 목록:', Object.keys(leads[0]).join(', '));

      const expectedColumns = [
        'id', 'welcome', 'experience', 'business_idea', 'region',
        'gender', 'age', 'name', 'phone', 'verified',
        'created_at', 'updated_at'
      ];

      const actualColumns = Object.keys(leads[0]);
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log('\n⚠️  누락된 컬럼:', missingColumns.join(', '));
      }
      if (extraColumns.length > 0) {
        console.log('\n⚠️  예상치 못한 컬럼:', extraColumns.join(', '));
      }

      if (missingColumns.length === 0 && extraColumns.length === 0) {
        console.log('\n✅ 모든 컬럼이 정상적으로 설정되었습니다!');
      }
    } else {
      console.log('\n⚠️  테이블에 데이터가 없어서 구조 확인 불가');
      console.log('💡 빈 데이터를 삽입해서 확인할 수 있습니다.');
    }

  } catch (error: any) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

executeMigration();
