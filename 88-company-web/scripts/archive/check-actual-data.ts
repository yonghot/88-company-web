import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkActualData() {
  console.log('🔍 실제 리드 데이터 확인 중...\n');

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, education, occupation, phone')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ 데이터 조회 실패:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ leads 테이블에 데이터가 없습니다.');
      console.log('   챗봇에서 테스트 리드를 생성한 후 다시 확인하세요.');
      process.exit(0);
    }

    console.log('📊 최근 리드 5개 데이터:\n');
    data.forEach((lead, index) => {
      console.log(`[${index + 1}] ID: ${lead.id}`);
      console.log(`    전화번호: ${lead.phone || 'null'}`);
      console.log(`    이름 (name): ${lead.name || 'null'}`);
      console.log(`    학력 (education): ${lead.education || 'null'}`);
      console.log(`    직업 (occupation): ${lead.occupation || 'null'}`);
      console.log('');
    });

    // Check for potential issues
    const issuesFound = data.filter(lead => {
      // name 컬럼에 학력/전공 같은 내용이 있는지 확인
      if (lead.name && (
        lead.name.includes('학력') || 
        lead.name.includes('전공') || 
        lead.name.includes('대학') ||
        lead.name.includes('고졸') ||
        lead.name.includes('석사') ||
        lead.name.includes('박사')
      )) {
        return true;
      }
      return false;
    });

    if (issuesFound.length > 0) {
      console.log('⚠️ 잠재적 문제 발견!');
      console.log(`   ${issuesFound.length}개의 리드에서 name 컬럼에 학력 정보가 포함되어 있습니다.`);
      console.log('\n   이것은 API 매핑 문제입니다. 수정 후 새로운 리드로 테스트하세요.\n');
    } else {
      console.log('✅ 데이터가 정상적으로 보입니다.');
      console.log('   새로운 리드를 생성하여 수정사항이 반영되었는지 확인하세요.\n');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

checkActualData();
