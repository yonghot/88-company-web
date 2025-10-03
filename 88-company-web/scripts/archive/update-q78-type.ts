import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateQuestionTypes() {
  console.log('🔄 7, 8번 질문 타입 변경: select → text\n');

  try {
    console.log('1️⃣ 7번 질문 (최종 학력과 전공) 업데이트 중...');
    console.log('   order_index: 7\n');
    const { data: q7, error: error7 } = await supabase
      .from('chat_questions')
      .update({
        type: 'text',
        options: null,
        updated_at: new Date().toISOString()
      })
      .eq('order_index', 7)
      .select();

    if (error7) {
      console.error('❌ 7번 질문 업데이트 실패:', error7);
      return;
    }

    console.log('✅ 7번 질문 업데이트 성공');
    if (q7 && q7.length > 0) {
      console.log(`   변경된 질문: ${q7[0].question}`);
    }

    console.log('\n2️⃣ 8번 질문 (현재 직업 상태) 업데이트 중...');
    console.log('   order_index: 8\n');
    const { data: q8, error: error8 } = await supabase
      .from('chat_questions')
      .update({
        type: 'text',
        options: null,
        updated_at: new Date().toISOString()
      })
      .eq('order_index', 8)
      .select();

    if (error8) {
      console.error('❌ 8번 질문 업데이트 실패:', error8);
      return;
    }

    console.log('✅ 8번 질문 업데이트 성공');
    if (q8 && q8.length > 0) {
      console.log(`   변경된 질문: ${q8[0].question}`);
    }

    console.log('\n📋 업데이트 결과 확인:\n');
    const { data: result, error: selectError } = await supabase
      .from('chat_questions')
      .select('id, question, type, options, order_index')
      .in('order_index', [7, 8])
      .order('order_index');

    if (selectError) {
      console.error('❌ 결과 조회 실패:', selectError);
      return;
    }

    result?.forEach(q => {
      console.log(`${q.order_index}번 질문`);
      console.log(`질문: ${q.question}`);
      console.log(`타입: ${q.type}`);
      console.log(`옵션: ${q.options || 'null'}`);
      console.log('---\n');
    });

    console.log('🎉 모든 업데이트 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateQuestionTypes();
