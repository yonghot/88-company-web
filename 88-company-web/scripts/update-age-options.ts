import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAgeOptions() {
  console.log('📝 연령대 옵션 업데이트 시작...\n');

  const ageOptions: string[] = [
    '20세 이하'
  ];

  for (let age = 21; age <= 49; age++) {
    ageOptions.push(`${age}세`);
  }

  ageOptions.push('50세 이상');

  console.log(`✅ 생성된 옵션 개수: ${ageOptions.length}개`);
  console.log(`   첫 5개: ${ageOptions.slice(0, 5).join(', ')}`);
  console.log(`   마지막 5개: ${ageOptions.slice(-5).join(', ')}\n`);

  const { data, error } = await supabase
    .from('chat_questions')
    .update({
      question: '나이를 선택해주세요.',
      options: ageOptions,
      placeholder: '나이를 선택하세요'
    })
    .eq('order_index', 6)
    .select();

  if (error) {
    console.error('❌ 업데이트 실패:', error);
    process.exit(1);
  }

  console.log('✅ 6번 질문 업데이트 완료!\n');

  if (data && data.length > 0) {
    const question = data[0];
    console.log('📋 업데이트된 질문:');
    console.log(`   질문: ${question.question}`);
    console.log(`   타입: ${question.type}`);
    console.log(`   옵션 개수: ${question.options?.length}개`);
    console.log(`   첫 5개 옵션: ${question.options?.slice(0, 5).join(', ')}`);
    console.log(`   마지막 5개 옵션: ${question.options?.slice(-5).join(', ')}`);
  }
}

updateAgeOptions();
