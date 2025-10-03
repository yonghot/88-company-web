import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(url, anonKey);

async function updateToBirthYear() {
  console.log('🎨 나이 질문을 생년 선택 드롭다운으로 변경 중...\n');

  try {
    // 생년 옵션 생성 (2007년 ~ 1945년, 역순)
    const currentYear = 2025;
    const minYear = 1945; // 80세
    const maxYear = 2007; // 18세

    const birthYears: string[] = [];
    for (let year = maxYear; year >= minYear; year--) {
      birthYears.push(`${year}년`);
    }

    console.log(`📅 생년 옵션 생성: ${birthYears.length}개 (${maxYear}년 ~ ${minYear}년)\n`);

    // 데이터베이스 업데이트
    const { error } = await supabase
      .from('chat_questions')
      .update({
        question: '생년을 선택해주세요.',
        options: birthYears,
        placeholder: '생년을 선택하세요'
      })
      .eq('order_index', 6);

    if (error) throw error;

    console.log('✅ 6번 질문 업데이트 완료!\n');

    // 결과 확인
    const { data } = await supabase
      .from('chat_questions')
      .select('*')
      .eq('order_index', 6)
      .single();

    if (data) {
      console.log('📋 업데이트된 질문:');
      console.log(`   질문: ${data.question}`);
      console.log(`   타입: ${data.type}`);
      console.log(`   옵션 개수: ${data.options?.length}개`);
      console.log(`   첫 5개 옵션: ${data.options?.slice(0, 5).join(', ')}`);
      console.log(`   마지막 5개 옵션: ${data.options?.slice(-5).join(', ')}`);
    }

    console.log('\n🎉 생년 드롭다운 UI 적용 완료!');
    console.log('💡 챗봇 페이지를 새로고침하면 변경사항이 반영됩니다.');

  } catch (error: any) {
    console.error('\n❌ 업데이트 실패:', error.message);
    process.exit(1);
  }
}

updateToBirthYear();
