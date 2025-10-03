import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !accessToken) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const projectRef = supabaseUrl.split('//')[1].split('.')[0];

async function addColumns() {
  console.log('Supabase Management API로 컬럼 추가 중...\n');
  console.log('Project:', projectRef);

  const sql = `
ALTER TABLE leads ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS occupation TEXT;
COMMENT ON COLUMN leads.education IS '질문4: 최종 학력';
COMMENT ON COLUMN leads.occupation IS '질문5: 현재 직업 상태';
  `.trim();

  try {
    const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    
    console.log('API URL:', apiUrl);
    console.log('실행할 SQL:\n', sql, '\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query: sql })
    });

    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }

    console.log('응답 상태:', response.status);
    console.log('응답 내용:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ 컬럼 추가 성공!');
    } else {
      console.log('\n❌ 실패');
      throw new Error(JSON.stringify(result));
    }
  } catch (error) {
    console.error('오류:', error);
    process.exit(1);
  }
}

addColumns();
