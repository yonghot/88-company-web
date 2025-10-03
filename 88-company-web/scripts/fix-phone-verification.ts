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

async function fixPhoneVerification() {
  console.log('🔧 전화번호 인증 복구 작업 시작...\n');

  // 1. 8번 질문 타입을 'phone'으로 변경
  console.log('📝 1단계: 8번 질문 타입 변경 (text → phone)');
  const { error: updateError } = await supabase
    .from('chat_questions')
    .update({ type: 'phone' })
    .eq('order_index', 8);

  if (updateError) {
    console.error('❌ 8번 질문 업데이트 실패:', updateError);
    process.exit(1);
  }
  console.log('✅ 8번 질문 타입 변경 완료\n');

  // 2. 9번 질문 삭제
  console.log('📝 2단계: 9번 질문 삭제');
  const { error: deleteError } = await supabase
    .from('chat_questions')
    .delete()
    .eq('order_index', 9);

  if (deleteError) {
    console.error('❌ 9번 질문 삭제 실패:', deleteError);
    process.exit(1);
  }
  console.log('✅ 9번 질문 삭제 완료\n');

  // 3. 최종 확인
  console.log('📋 최종 질문 목록:\n');
  const { data: questions, error: fetchError } = await supabase
    .from('chat_questions')
    .select('*')
    .order('order_index');

  if (fetchError) {
    console.error('❌ 질문 조회 실패:', fetchError);
    process.exit(1);
  }

  questions?.forEach(q => {
    console.log(`[${q.order_index}] ${q.type}`);
    console.log(`   질문: ${q.question.substring(0, 60)}...`);
    if (q.options) {
      console.log(`   옵션: ${q.options.join(', ')}`);
    }
    console.log();
  });

  console.log(`총 ${questions?.length}개 질문\n`);

  console.log('✅ 전화번호 인증 복구 완료!');
  console.log('\n📌 구조:');
  console.log('   Q1-7: 기본 정보 수집');
  console.log('   Q8: 전화번호 입력 (phone 타입) → 인증 단계 자동 추가');
  console.log('   완료: 안내 메시지 표시');
}

fixPhoneVerification();
