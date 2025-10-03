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

async function addFinalMessageQuestion() {
  console.log('📝 9번 안내 메시지 질문 추가...\n');

  const { data: existing, error: checkError } = await supabase
    .from('chat_questions')
    .select('*')
    .eq('order_index', 9);

  if (checkError) {
    console.error('❌ 질문 확인 실패:', checkError);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    console.log('⚠️  9번 질문이 이미 존재합니다.');
    console.log('기존 질문:', existing[0].question);
    console.log('\n삭제 후 다시 추가하시겠습니까? (scripts에서 수동으로 삭제 필요)');
    return;
  }

  const finalMessage = {
    type: 'quick-reply',
    question: `등록이 완료되었습니다! 🎉

빠른 시일 내에 88 Company에서 무료 유선 상담 연락을 드릴 예정입니다.

창업 여정의 시작을 함께 하게 되어 기쁩니다.`,
    options: ['확인'],
    validation: { required: true },
    order_index: 9
  };

  const { data, error } = await supabase
    .from('chat_questions')
    .insert([finalMessage])
    .select();

  if (error) {
    console.error('❌ 질문 추가 실패:', error);
    process.exit(1);
  }

  console.log('✅ 9번 안내 메시지 추가 완료!\n');

  if (data && data.length > 0) {
    console.log('📋 추가된 질문:');
    console.log(`   순서: ${data[0].order_index}`);
    console.log(`   타입: ${data[0].type}`);
    console.log(`   질문:\n${data[0].question}`);
    console.log(`   옵션: ${data[0].options.join(', ')}`);
  }

  console.log('\n💡 챗봇 페이지를 새로고침하면 반영됩니다.');
  console.log('💡 Supabase Dashboard에서 직접 수정 가능합니다.');
}

addFinalMessageQuestion();
