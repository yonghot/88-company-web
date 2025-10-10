import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log('❌ Supabase 환경 변수 없음');
  process.exit(1);
}

const supabase = createClient(url, key);

async function checkQuestions() {
  console.log('🔍 데이터베이스 질문 순서 확인 중...\n');
  
  const { data, error } = await supabase
    .from('chat_questions')
    .select('order_index, question, type')
    .order('order_index', { ascending: true });
  
  if (error) {
    console.log('❌ 쿼리 실패:', error.message);
    process.exit(1);
  }
  
  if (!data || data.length === 0) {
    console.log('❌ 질문이 없습니다');
    process.exit(1);
  }
  
  console.log('=== 현재 질문 순서 ===\n');
  
  data.forEach((q) => {
    const questionPreview = q.question.length > 60 
      ? q.question.substring(0, 60) + '...'
      : q.question;
    
    let label = '';
    if (q.order_index === 0) {
      label = '[웰컴 메시지]';
    } else if (q.order_index === 999) {
      label = '[완료 메시지]';
    } else {
      label = `[질문 ${q.order_index}]`;
    }
    
    console.log(`${label}`);
    console.log(`  order_index: ${q.order_index}`);
    console.log(`  type: ${q.type}`);
    console.log(`  question: ${questionPreview}`);
    console.log('');
  });
  
  console.log('=== 매핑 추천 ===\n');
  
  const regularQuestions = data.filter(q => q.order_index !== 0 && q.order_index !== 999);
  
  regularQuestions.forEach((q, index) => {
    const stepNum = index + 1;
    const questionPreview = q.question.substring(0, 50);
    console.log(`step_${stepNum} (order_index ${q.order_index}): ${questionPreview}...`);
  });
}

checkQuestions();
