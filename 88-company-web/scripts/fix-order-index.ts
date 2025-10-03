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

async function fixOrderIndex() {
  console.log('🔧 order_index 수정 시작...\n');

  const { data: questions, error: fetchError } = await supabase
    .from('chat_questions')
    .select('*')
    .order('order_index');

  if (fetchError) {
    console.error('❌ 질문 조회 실패:', fetchError);
    process.exit(1);
  }

  console.log(`📋 현재 질문 ${questions?.length}개 발견\n`);

  if (!questions || questions.length === 0) {
    console.log('질문이 없습니다.');
    return;
  }

  questions.forEach((q, idx) => {
    console.log(`[${q.order_index}] ${q.question.substring(0, 40)}...`);
  });

  console.log('\n🔄 order_index를 1부터 순차적으로 재정렬...\n');

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const newOrderIndex = i + 1;

    if (question.order_index !== newOrderIndex) {
      console.log(`  ${question.order_index} → ${newOrderIndex}: ${question.question.substring(0, 40)}...`);

      const { error: updateError } = await supabase
        .from('chat_questions')
        .update({ order_index: newOrderIndex })
        .eq('id', question.id);

      if (updateError) {
        console.error(`❌ 업데이트 실패 (ID: ${question.id}):`, updateError);
        process.exit(1);
      }
    }
  }

  console.log('\n✅ order_index 재정렬 완료!\n');

  const { data: updatedQuestions, error: verifyError } = await supabase
    .from('chat_questions')
    .select('*')
    .order('order_index');

  if (verifyError) {
    console.error('❌ 검증 실패:', verifyError);
    process.exit(1);
  }

  console.log('📋 수정 후 질문 순서:\n');
  updatedQuestions?.forEach(q => {
    console.log(`[${q.order_index}] ${q.question.substring(0, 60)}...`);
  });
}

fixOrderIndex();
