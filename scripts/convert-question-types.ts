#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function convertQuestionTypes() {
  console.log('\n🔄 질문 타입 자동 변환 시작\n');
  console.log('=' .repeat(60));

  try {
    // 모든 질문 가져오기
    const { data: questions, error } = await supabase
      .from('chat_questions')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('❌ 데이터 조회 실패:', error.message);
      return;
    }

    console.log(`📊 총 ${questions?.length || 0}개 질문 확인\n`);

    let convertedCount = 0;

    // 각 질문 변환
    for (const question of questions || []) {
      let needsUpdate = false;
      let newType = question.type;

      // quick-reply → select 변환
      if (question.type === 'quick-reply') {
        newType = 'select';
        needsUpdate = true;
        console.log(`🔄 [${question.step}] quick-reply → select 변환`);
      }

      // textarea → text 변환
      if (question.type === 'textarea') {
        newType = 'text';
        needsUpdate = true;
        console.log(`🔄 [${question.step}] textarea → text 변환`);
      }

      // 업데이트 필요한 경우
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('chat_questions')
          .update({ type: newType })
          .eq('step', question.step);

        if (updateError) {
          console.error(`❌ [${question.step}] 업데이트 실패:`, updateError.message);
        } else {
          convertedCount++;
          console.log(`  ✅ 성공적으로 변환됨`);
        }
      }
    }

    console.log('\n' + '=' .repeat(60));

    if (convertedCount > 0) {
      console.log(`\n✅ ${convertedCount}개 질문이 성공적으로 변환되었습니다!\n`);

      // 변환 후 확인
      const { data: updatedQuestions } = await supabase
        .from('chat_questions')
        .select('type')
        .order('order_index');

      const typeCount: Record<string, number> = {};
      updatedQuestions?.forEach(q => {
        typeCount[q.type] = (typeCount[q.type] || 0) + 1;
      });

      console.log('📈 업데이트된 타입 분포:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}개`);
      });
    } else {
      console.log('\n✨ 이미 모든 질문이 유효한 타입을 사용 중입니다!\n');
    }

  } catch (error) {
    console.error('❌ 예기치 않은 오류:', error);
  }
}

convertQuestionTypes();