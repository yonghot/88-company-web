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

const defaultQuestions = [
  {
    step: 'welcome',
    type: 'quick-reply',
    question: '안녕하세요! 88입니다. 어떤 서비스를 찾고 계신가요?',
    options: ['창업 컨설팅', '경영 전략 수립', '마케팅 전략', '투자 유치 지원', '기타 문의'],
    order_index: 1,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'budget'
  },
  {
    step: 'budget',
    type: 'quick-reply',
    question: '예상하시는 예산 규모는 어느 정도인가요?',
    options: ['500만원 미만', '500만원 - 1,000만원', '1,000만원 - 3,000만원', '3,000만원 - 5,000만원', '5,000만원 이상', '협의 필요'],
    order_index: 2,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'timeline'
  },
  {
    step: 'timeline',
    type: 'quick-reply',
    question: '프로젝트는 언제 시작하실 예정인가요?',
    options: ['즉시 시작', '1주일 이내', '1개월 이내', '3개월 이내', '아직 미정'],
    order_index: 3,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'details'
  },
  {
    step: 'details',
    type: 'textarea',
    question: '프로젝트에 대해 추가로 알려주실 내용이 있나요?',
    options: null,
    order_index: 4,
    is_active: true,
    validation: null,
    placeholder: '현재 상황, 목표, 특별한 요구사항 등을 자유롭게 작성해주세요...',
    next_step: 'name'
  },
  {
    step: 'name',
    type: 'text',
    question: '성함을 알려주세요.',
    options: null,
    order_index: 5,
    is_active: true,
    validation: { type: 'name', minLength: 2 },
    placeholder: '홍길동',
    next_step: 'phone'
  },
  {
    step: 'phone',
    type: 'text',
    question: '연락 가능한 전화번호를 입력해주세요.',
    options: null,
    order_index: 6,
    is_active: true,
    validation: { type: 'phone', pattern: '^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$' },
    placeholder: '010-0000-0000',
    next_step: 'complete'
  }
];

async function restoreQuestions() {
  console.log('🔄 질문 데이터 복구를 시작합니다...');

  try {
    // 기존 데이터 확인
    const { data: existingQuestions, error: fetchError } = await supabase
      .from('chat_questions')
      .select('*');

    if (fetchError) {
      console.error('❌ 기존 데이터 조회 실패:', fetchError.message);
      return;
    }

    console.log(`📊 현재 데이터베이스 상태: ${existingQuestions?.length || 0}개의 질문이 있습니다.`);

    // 모든 기존 질문 삭제
    if (existingQuestions && existingQuestions.length > 0) {
      console.log('🗑️ 기존 데이터를 삭제합니다...');
      const { error: deleteError } = await supabase
        .from('chat_questions')
        .delete()
        .neq('step', ''); // 모든 행 삭제

      if (deleteError) {
        console.error('❌ 기존 데이터 삭제 실패:', deleteError.message);
        return;
      }
    }

    // 새로운 질문 데이터 삽입
    console.log('📝 기본 질문 데이터를 복구합니다...');
    const { data, error: insertError } = await supabase
      .from('chat_questions')
      .insert(defaultQuestions)
      .select();

    if (insertError) {
      console.error('❌ 질문 데이터 복구 실패:', insertError.message);
      return;
    }

    console.log(`✅ ${data?.length || 0}개의 질문을 성공적으로 복구했습니다!`);

    // 복구된 데이터 확인
    const { data: restoredQuestions } = await supabase
      .from('chat_questions')
      .select('*')
      .order('order_index');

    if (restoredQuestions) {
      console.log('\n📋 복구된 질문 목록:');
      restoredQuestions.forEach(q => {
        console.log(`  ${q.order_index}. [${q.step}] ${q.question.substring(0, 30)}...`);
      });
    }

  } catch (error) {
    console.error('❌ 예기치 않은 오류 발생:', error);
  }
}

restoreQuestions();