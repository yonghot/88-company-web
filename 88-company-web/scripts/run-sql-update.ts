import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env.local 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('필요한 환경 변수:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY 또는 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log(`🔑 Supabase 연결: ${supabaseKey.includes('service_role') ? 'Service Role Key' : 'Anon Key'}\n`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlUpdate() {
  console.log('🚀 챗봇 질문 업데이트 시작...\n');

  try {
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'update-chatbot-questions.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // 주석과 빈 줄 제거, 세미콜론으로 쿼리 분리
    const queries = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim())
      .join('\n')
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    console.log(`📝 총 ${queries.length}개의 쿼리를 실행합니다.\n`);

    // 1. 기존 데이터 삭제
    console.log('🗑️  기존 질문 삭제 중...');
    const { error: deleteError } = await supabase
      .from('chat_questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제

    if (deleteError) {
      console.error('❌ 삭제 실패:', deleteError);
      throw deleteError;
    }
    console.log('✅ 기존 질문 삭제 완료\n');

    // 2. 새로운 질문 데이터 삽입
    const newQuestions = [
      {
        step: 'welcome',
        type: 'select',
        question: `💡 "진짜 좋은 아이디어가 있는데..."
"돈만 있으면 바로 시작할 수 있는데..."

이런 고민, 저희가 해결해드립니다!

예비창업패키지 합격으로
**최소 4천만원 ~ 최대 6천만원** 지원받고
아이디어를 현실로 만들어보세요.

현재 어느 단계에 계신가요?`,
        placeholder: null,
        options: ["💭 아이디어만 있어요", "📝 사업계획서 작성 중", "🎯 정부지원사업 준비 중", "🚀 이미 신청했어요", "❓ 뭐부터 해야 할지 모르겠어요"],
        validation: { required: true },
        next_step: 'support_experience',
        is_active: true,
        order_index: 1
      },
      {
        step: 'support_experience',
        type: 'select',
        question: `정부지원사업에 도전해보신 적 있으신가요?

💡 **알고 계셨나요?**
2018년부터 시작된 예비창업패키지는
이제 열정만으로 합격하기 어려울 정도로
상향평준화되었습니다.

경쟁률이 무려 **10:1 ~ 30:1** 이에요! 😱`,
        placeholder: null,
        options: ["처음 도전합니다", "신청했다가 탈락했어요", "여러 번 도전했어요", "합격 경험 있어요", "잘 모르겠어요"],
        validation: { required: true },
        next_step: 'main_concern',
        is_active: true,
        order_index: 2
      },
      {
        step: 'main_concern',
        type: 'select',
        question: `예비창업패키지 합격을 위해
어떤 도움이 가장 필요하신가요?

저희는 다음을 **88만원**에 제공합니다:
✅ 합격에 유리한 아이템 추출
✅ 빠른 시제품(프로토타입) 제작
✅ 전문가 사업계획서 작성`,
        placeholder: null,
        options: ["🎯 아이템 발굴 & 구체화", "⚡ 프로토타입 제작", "📋 사업계획서 작성", "💯 전체 패키지 (토탈 솔루션)", "💬 상담 후 결정하고 싶어요"],
        validation: { required: true },
        next_step: 'timeline',
        is_active: true,
        order_index: 3
      },
      {
        step: 'timeline',
        type: 'select',
        question: `언제부터 시작하고 싶으신가요?

⏰ **2025년 예비창업패키지**
   모집 일정을 놓치지 마세요!

빠를수록 준비 기간이 길어져
합격률이 높아집니다! 💪`,
        placeholder: null,
        options: ["🚀 당장 시작! (이번주)", "📅 1개월 이내", "🗓️ 2-3개월 이내", "⏳ 6개월 이내", "💭 일정 미정"],
        validation: { required: true },
        next_step: 'details',
        is_active: true,
        order_index: 4
      },
      {
        step: 'details',
        type: 'textarea',
        question: `어떤 사업 아이디어를 준비 중이신가요?

간단하게라도 좋으니 알려주시면
**맞춤 컨설팅 견적**을 드릴 수 있습니다!

💡 예시:
"배달 음식 리뷰 플랫폼 창업 준비 중"
"친환경 화장품 브랜드 론칭 예정"`,
        placeholder: '아이디어를 자유롭게 적어주세요 (최소 10자)',
        options: null,
        validation: { required: true, minLength: 10, maxLength: 500 },
        next_step: 'name',
        is_active: true,
        order_index: 5
      },
      {
        step: 'name',
        type: 'text',
        question: `거의 다 왔습니다! 🎉

무료 상담을 위해
**성함**을 알려주세요.

💰 견적과 상담은 **언제나 무료**입니다!`,
        placeholder: '예: 홍길동',
        options: null,
        validation: { required: true, minLength: 2, maxLength: 50 },
        next_step: 'phone',
        is_active: true,
        order_index: 6
      },
      {
        step: 'phone',
        type: 'text',
        question: `마지막 단계입니다! 📱

빠른 상담을 위해
**연락처**를 입력해주세요.

✨ 다른 어떤 업체와 비교하셔도 좋습니다.
   88만원의 압도적 최저가를 확인하세요!`,
        placeholder: '010-1234-5678',
        options: null,
        validation: { required: true, pattern: '^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$' },
        next_step: 'complete',
        is_active: true,
        order_index: 7
      }
    ];

    console.log('📥 새로운 질문 삽입 중...');
    const { data, error: insertError } = await supabase
      .from('chat_questions')
      .insert(newQuestions)
      .select();

    if (insertError) {
      console.error('❌ 삽입 실패:', insertError);
      throw insertError;
    }

    console.log('✅ 새로운 질문 삽입 완료\n');

    // 3. 결과 확인
    console.log('📊 삽입된 질문 목록:\n');
    if (data) {
      data.forEach((q: any) => {
        const preview = q.question.substring(0, 50).replace(/\n/g, ' ');
        console.log(`  ${q.order_index}. [${q.step}] ${preview}...`);
      });
    }

    console.log('\n✅ 챗봇 질문 업데이트 완료!');
    console.log('\n💡 챗봇 페이지를 새로고침하면 새 질문이 적용됩니다.');

  } catch (error) {
    console.error('\n❌ 업데이트 중 오류 발생:', error);
    process.exit(1);
  }
}

runSqlUpdate();
