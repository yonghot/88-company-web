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

async function checkQuestionTypes() {
  console.log('\n🔍 질문 타입 검증 시작\n');
  console.log('=' .repeat(60));

  try {
    // 데이터베이스에서 질문 가져오기
    const { data: questions, error } = await supabase
      .from('chat_questions')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('❌ 데이터 조회 실패:', error.message);
      return;
    }

    console.log(`\n📊 총 ${questions?.length || 0}개 질문 발견\n`);

    // 타입별 분류
    const typeCount: Record<string, number> = {};
    const invalidTypes: string[] = [];

    questions?.forEach(q => {
      typeCount[q.type] = (typeCount[q.type] || 0) + 1;

      // textarea와 quick-reply 체크
      if (q.type === 'textarea' || q.type === 'quick-reply') {
        invalidTypes.push(`[${q.step}]: ${q.type}`);
      }
    });

    // 결과 출력
    console.log('📈 질문 타입 분포:');
    console.log('-' .repeat(40));
    Object.entries(typeCount).forEach(([type, count]) => {
      const icon = getTypeIcon(type);
      const status = isValidType(type) ? '✅' : '❌';
      console.log(`  ${status} ${icon} ${type}: ${count}개`);
    });

    console.log('\n✅ 유효한 타입 (3개):');
    console.log('  1. text (텍스트 입력)');
    console.log('  2. select (선택지)');
    console.log('  3. verification (인증)');

    if (invalidTypes.length > 0) {
      console.log('\n❌ 제거되어야 할 타입 발견:');
      invalidTypes.forEach(t => console.log(`  - ${t}`));
      console.log('\n💡 해결방법: /admin/questions 페이지에서 해당 질문 수정');
    } else {
      console.log('\n✨ 완벽! 모든 질문이 유효한 타입만 사용 중입니다.');
    }

    // select 타입 옵션 검증
    const selectQuestions = questions?.filter(q => q.type === 'select' || q.type === 'quick-reply');
    if (selectQuestions && selectQuestions.length > 0) {
      console.log('\n🎯 선택지 타입 질문 상세:');
      console.log('-' .repeat(40));
      selectQuestions.forEach(q => {
        const optionCount = q.options ? q.options.length : 0;
        console.log(`\n  [${q.step}] ${q.question.substring(0, 30)}...`);
        console.log(`    옵션 개수: ${optionCount}개`);
        if (optionCount > 0) {
          console.log(`    옵션: ${q.options.slice(0, 3).join(', ')}${optionCount > 3 ? '...' : ''}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ 예기치 않은 오류:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✅ 검증 완료!\n');
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'text': '📝',
    'textarea': '📄',
    'select': '📋',
    'quick-reply': '⚡',
    'verification': '🔐'
  };
  return icons[type] || '❓';
}

function isValidType(type: string): boolean {
  const validTypes = ['text', 'select', 'verification'];
  return validTypes.includes(type);
}

checkQuestionTypes();