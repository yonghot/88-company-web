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

async function cleanupExtraColumns() {
  console.log('🧹 불필요한 컬럼 제거 중...\n');

  const cleanupSQL = `
    ALTER TABLE leads DROP COLUMN IF EXISTS business_status;
    ALTER TABLE leads DROP COLUMN IF EXISTS pre_startup_package;
    ALTER TABLE leads DROP COLUMN IF EXISTS gov_support_knowledge;

    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'leads'
    ORDER BY ordinal_position;
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
        body: JSON.stringify({ query: cleanupSQL })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ 실패:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

    console.log('✅ 컬럼 제거 완료!\n');
    console.log('📋 최종 테이블 구조:');

    result.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

  } catch (error: any) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

cleanupExtraColumns();
