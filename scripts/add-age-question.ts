import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(url, anonKey);

async function addAgeQuestion() {
  console.log('🚀 6번 나이 질문 추가 중...\n');

  try {
    const { error } = await supabase
      .from('chat_questions')
      .insert({
        type: 'select',
        question: '나이를 선택해주세요.',
        options: ["20대", "30대", "40대", "50대 이상"],
        validation: { required: true },
        order_index: 6
      });

    if (error) throw error;

    console.log('✅ 6번 나이 질문 추가 완료!\n');

    // 결과 확인
    const { data } = await supabase
      .from('chat_questions')
      .select('*')
      .order('order_index');

    console.log('📋 업데이트된 질문 목록:\n');
    data?.forEach(q => {
      const questionPreview = q.question.substring(0, 60).replace(/\n/g, ' ');
      console.log(`[${q.order_index}] ${questionPreview}...`);
      if (q.options) {
        console.log(`   옵션: ${q.options.join(', ')}`);
      }
    });

    console.log(`\n총 ${data?.length}개 질문`);

  } catch (error: any) {
    console.error('\n❌ 추가 실패:', error.message);
    process.exit(1);
  }
}

addAgeQuestion();
