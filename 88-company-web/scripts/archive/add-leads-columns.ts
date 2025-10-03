import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

console.log('Service Role Key로 Supabase 연결 중...\n');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addLeadsColumns() {
  console.log('leads 테이블에 education, occupation 컬럼 추가 중...\n');

  try {
    const sqlPath = path.join(__dirname, '..', 'supabase', 'add-education-occupation-columns.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    const queries = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*') && line.trim())
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    console.log('실행할 SQL:\n');
    console.log(queries);
    console.log('\n');

    const { data, error } = await supabase.rpc('exec_sql', { query: queries });

    if (error) {
      console.error('SQL 실행 실패:', error);
      console.log('\n대안: Supabase Dashboard SQL Editor에서 직접 실행하세요.');
      console.log('파일 위치:', sqlPath);
    } else {
      console.log('컬럼 추가 완료!');
      console.log('결과:', data);
    }

    console.log('\n컬럼 확인 중...');
    const { data: columns, error: columnError } = await supabase
      .from('leads')
      .select('*')
      .limit(1);

    if (columnError) {
      console.error('컬럼 확인 실패:', columnError);
    } else {
      console.log('\nleads 테이블 컬럼 목록:');
      if (columns && columns.length > 0) {
        console.log(Object.keys(columns[0]).join(', '));
      }
    }

  } catch (error) {
    console.error('\n오류 발생:', error);
    console.log('\nSupabase Dashboard에서 수동으로 실행하세요:');
    console.log('1. Supabase Dashboard → SQL Editor');
    console.log('2. supabase/add-education-occupation-columns.sql 파일 내용 복사');
    console.log('3. 실행');
  }
}

addLeadsColumns();
