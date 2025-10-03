import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const projectRef = supabaseUrl.split('//')[1].split('.')[0];

async function addColumns() {
  console.log('Supabase Management API로 컬럼 추가 시도 중...\n');
  console.log('Project Ref:', projectRef);

  const sql = `
ALTER TABLE leads ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS occupation TEXT;
COMMENT ON COLUMN leads.education IS '질문4: 최종 학력';
COMMENT ON COLUMN leads.occupation IS '질문5: 현재 직업 상태';
  `.trim();

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.text();
    console.log('응답 상태:', response.status);
    console.log('응답 내용:', result);

    if (response.ok) {
      console.log('\n✅ 컬럼 추가 성공!');
    } else {
      console.log('\n❌ 실패 - Supabase Dashboard SQL Editor에서 수동 실행 필요');
      console.log('\n실행할 SQL:');
      console.log(sql);
    }
  } catch (error) {
    console.error('오류:', error);
    console.log('\n수동으로 실행하세요:');
    console.log(sql);
  }
}

addColumns();
