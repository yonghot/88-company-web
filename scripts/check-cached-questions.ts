#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 지워지기 직전에 사용했던 최신 질문 데이터 (어제 밤 기준)
const latestQuestions = [
  {
    step: 'welcome',
    type: 'quick-reply',
    question: '안녕하세요! 88입니다 👋\n창업 지원 전문 컨설팅을 찾고 계신가요?',
    options: ['네, 관심있어요', '어떤 서비스인가요?', '바로 상담받고 싶어요'],
    order_index: 1,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'service_type'
  },
  {
    step: 'service_type',
    type: 'quick-reply',
    question: '어떤 정부지원사업을 알아보고 계신가요?',
    options: ['창업지원금', '사업화 지원', 'R&D 지원', '수출지원', '기타 지원사업'],
    order_index: 2,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'experience'
  },
  {
    step: 'experience',
    type: 'quick-reply',
    question: '정부지원사업 신청 경험이 있으신가요?',
    options: ['처음이에요', '1-2회 경험', '여러 번 경험', '잘 모르겠어요'],
    order_index: 3,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'budget'
  },
  {
    step: 'budget',
    type: 'quick-reply',
    question: '희망하시는 지원금 규모는 어느 정도인가요?',
    options: ['1천만원 이하', '1천-3천만원', '3천-5천만원', '5천만원-1억', '1억 이상'],
    order_index: 4,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'timeline'
  },
  {
    step: 'timeline',
    type: 'quick-reply',
    question: '언제까지 지원받기를 원하시나요?',
    options: ['즉시', '1개월 이내', '3개월 이내', '6개월 이내', '상관없음'],
    order_index: 5,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'company_status'
  },
  {
    step: 'company_status',
    type: 'quick-reply',
    question: '현재 사업 상태는 어떻게 되시나요?',
    options: ['예비창업자', '1년 미만', '1-3년', '3-7년', '7년 이상'],
    order_index: 6,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'industry'
  },
  {
    step: 'industry',
    type: 'quick-reply',
    question: '어떤 분야의 사업을 운영하고 계신가요?',
    options: ['IT/소프트웨어', '제조업', '서비스업', '유통/판매', '기타'],
    order_index: 7,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'details'
  },
  {
    step: 'details',
    type: 'textarea',
    question: '구체적으로 어떤 도움이 필요하신지 알려주세요.',
    options: null,
    order_index: 8,
    is_active: true,
    validation: null,
    placeholder: '예: 창업지원금 신청서 작성, 사업계획서 검토 등...',
    next_step: 'name'
  },
  {
    step: 'name',
    type: 'text',
    question: '상담을 위해 성함을 알려주세요.',
    options: null,
    order_index: 9,
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
    order_index: 10,
    is_active: true,
    validation: { type: 'phone', pattern: '^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$' },
    placeholder: '010-0000-0000',
    next_step: 'complete'
  }
];

async function restoreLatestQuestions() {
  console.log('🔄 최신 질문 데이터로 복구를 시작합니다...');
  console.log('📊 복구할 질문 개수:', latestQuestions.length);

  try {
    // 기존 데이터 삭제
    console.log('🗑️ 기존 데이터를 삭제합니다...');
    const { error: deleteError } = await supabase
      .from('chat_questions')
      .delete()
      .neq('step', '');

    if (deleteError) {
      console.error('❌ 기존 데이터 삭제 실패:', deleteError.message);
      return;
    }

    // 새로운 질문 데이터 삽입
    console.log('📝 최신 질문 데이터를 복구합니다...');
    const { data, error: insertError } = await supabase
      .from('chat_questions')
      .insert(latestQuestions)
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
        console.log(`  ${q.order_index}. [${q.step}] ${q.question.substring(0, 40)}...`);
      });
    }

    // 로컬 파일에도 백업
    const backupPath = path.join(process.cwd(), 'data', 'questions_backup.json');
    await fs.writeFile(
      backupPath,
      JSON.stringify({
        questions: latestQuestions,
        restoredAt: new Date().toISOString()
      }, null, 2)
    );
    console.log(`\n💾 로컬 백업 파일 생성: ${backupPath}`);

  } catch (error) {
    console.error('❌ 예기치 않은 오류 발생:', error);
  }
}

restoreLatestQuestions();