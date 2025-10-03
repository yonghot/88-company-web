import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('leads 테이블 구조 확인 중...\n');

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .limit(1);

  if (error) {
    console.error('조회 실패:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ leads 테이블 컬럼 목록:\n');
    const columns = Object.keys(data[0]);
    columns.forEach(col => console.log('  -', col));
    
    const hasEducation = columns.includes('education');
    const hasOccupation = columns.includes('occupation');
    
    console.log('\n검증 결과:');
    console.log('  education 컬럼:', hasEducation ? '✅ 존재' : '❌ 없음');
    console.log('  occupation 컬럼:', hasOccupation ? '✅ 존재' : '❌ 없음');
    
    if (hasEducation && hasOccupation) {
      console.log('\n🎉 모든 컬럼이 정상적으로 추가되었습니다!');
    }
  } else {
    console.log('데이터가 없어 빈 row를 삽입하여 구조 확인...');
    console.log('(컬럼 확인 후 삭제 예정)');
    
    const testId = 'test-column-check';
    await supabase.from('leads').insert({ 
      id: testId, 
      name: 'test', 
      phone: 'test', 
      verified: false 
    });
    
    const { data: testData } = await supabase
      .from('leads')
      .select('*')
      .eq('id', testId)
      .single();
    
    if (testData) {
      console.log('\n컬럼 목록:');
      Object.keys(testData).forEach(col => console.log('  -', col));
    }
    
    await supabase.from('leads').delete().eq('id', testId);
  }

  console.log('\nchat_questions 질문 수 확인...');
  const { data: questions } = await supabase
    .from('chat_questions')
    .select('order_index')
    .order('order_index');

  console.log('총 질문 수:', questions?.length);
  console.log('질문 순서:', questions?.map(q => q.order_index).join(', '));
}

verify();
