import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN!;

const supabase = createClient(url, anonKey);

async function updateQuestions() {
  console.log('🚀 챗봇 질문 업데이트 시작...\n');

  try {
    // 1. 3번 질문 옵션 수정 (사업 아이템 유무)
    console.log('1️⃣ 3번 질문 옵션 수정 중...');
    const { error: e1 } = await supabase
      .from('chat_questions')
      .update({
        options: ["네, 있습니다", "아직 구체적이지 않아요", "아이디어만 있어요", "전혀 없습니다", "잘 모르겠어요"]
      })
      .eq('order_index', 3);

    if (e1) throw e1;
    console.log('✅ 3번 옵션 수정 완료\n');

    // 2. 4번 질문 옵션 수정 (등본상 주소 지역)
    console.log('2️⃣ 4번 질문 옵션 수정 중...');
    const { error: e2 } = await supabase
      .from('chat_questions')
      .update({
        options: ["서울", "경기", "인천", "지방 광역시 (부산/대구/광주/대전/울산)", "그 외 지역"]
      })
      .eq('order_index', 4);

    if (e2) throw e2;
    console.log('✅ 4번 옵션 수정 완료\n');

    // 3. 5번 성별 질문 추가
    console.log('3️⃣ 5번 성별 질문 추가 중...');
    const { error: e3 } = await supabase
      .from('chat_questions')
      .insert({
        type: 'select',
        question: '성별을 선택해주세요.',
        options: ["남성", "여성", "선택 안함"],
        validation: { required: true },
        order_index: 5
      });

    if (e3) throw e3;
    console.log('✅ 5번 성별 질문 추가 완료\n');

    // 4. 6번 질문 간소화 (이모티콘 제거)
    console.log('4️⃣ 6번 질문 간소화 중...');
    const { error: e4 } = await supabase
      .from('chat_questions')
      .update({
        question: '거의 다 왔습니다.\n\n무료 상담을 위해 성함을 알려주세요.\n\n견적과 상담은 언제나 무료입니다.',
        placeholder: '예: 홍길동'
      })
      .eq('order_index', 6);

    if (e4) throw e4;
    console.log('✅ 6번 질문 간소화 완료\n');

    // 5. 7번 질문 간소화 (이모티콘 제거)
    console.log('5️⃣ 7번 질문 간소화 중...');
    const { error: e5 } = await supabase
      .from('chat_questions')
      .update({
        question: '마지막 단계입니다.\n\n빠른 상담을 위해 연락처를 입력해주세요.\n\n다른 어떤 업체와 비교하셔도 좋습니다.\n88만원의 압도적 최저가를 확인하세요.',
        placeholder: '010-1234-5678'
      })
      .eq('order_index', 7);

    if (e5) throw e5;
    console.log('✅ 7번 질문 간소화 완료\n');

    console.log('🎉 모든 질문 업데이트 완료!');

    // 결과 확인
    console.log('\n📋 업데이트된 질문 목록:\n');
    const { data } = await supabase
      .from('chat_questions')
      .select('*')
      .order('order_index');

    data?.forEach(q => {
      const questionPreview = q.question.substring(0, 60).replace(/\n/g, ' ');
      console.log(`[${q.order_index}] ${questionPreview}...`);
      if (q.options) {
        console.log(`   옵션: ${q.options.join(', ')}`);
      }
    });

  } catch (error: any) {
    console.error('\n❌ 업데이트 실패:', error.message);
    process.exit(1);
  }
}

updateQuestions();
