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

// 사용자가 어제 편집한 실제 질문들 (설명 기반 재구성)
const actualQuestions = [
  {
    step: 'welcome',
    type: 'quick-reply',
    question: '안녕하세요! 88입니다 👋\n정부지원사업 컨설팅 전문 업체입니다.\n어떤 도움이 필요하신가요?',
    options: ['창업 지원 상담', '정부지원사업 안내', '맞춤형 컨설팅'],
    order_index: 1,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'business_status'
  },
  {
    step: 'business_status',
    type: 'quick-reply',
    question: '현재 사업자등록 상태가 어떻게 되시나요?',
    options: [
      '예비창업자 (사업자등록 전)',
      '사업자등록 완료 (1년 미만)',
      '사업자등록 완료 (1년 이상)',
      '폐업 후 재창업 준비'
    ],
    order_index: 2,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'pre_startup_package'
  },
  {
    step: 'pre_startup_package',
    type: 'quick-reply',
    question: '예비창업패키지에 대해 알고 계신가요?',
    options: [
      '잘 알고 있어요',
      '들어본 적은 있어요',
      '처음 들어봐요',
      '이미 신청해봤어요'
    ],
    order_index: 3,
    is_active: true,
    validation: null,
    placeholder: null,
    next_step: 'gov_support_knowledge'
  },
  {
    step: 'gov_support_knowledge',
    type: 'quick-reply',
    question: '다른 정부지원사업(창업지원금, R&D 등)에 대해 얼마나 알고 계신가요?',
    options: [
      '여러 사업을 잘 알고 있어요',
      '일부만 알고 있어요',
      '거의 모르고 있어요',
      '신청 경험이 있어요'
    ],
    order_index: 4,
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
    order_index: 5,
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
    order_index: 6,
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
    order_index: 7,
    is_active: true,
    validation: null,
    placeholder: '예: 예비창업패키지 신청서 작성, 사업계획서 검토 등...',
    next_step: 'name'
  },
  {
    step: 'name',
    type: 'text',
    question: '상담을 위해 성함을 알려주세요.',
    options: null,
    order_index: 8,
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
    order_index: 9,
    is_active: true,
    validation: { type: 'phone', pattern: '^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$' },
    placeholder: '010-0000-0000',
    next_step: 'complete'
  }
];

async function restoreActualQuestions() {
  console.log('🔄 실제 편집 내용 기반 질문 데이터 복구를 시작합니다...');
  console.log('\n📝 사용자 설명 기반 재구성:');
  console.log('  - 사업자등록 상태 확인');
  console.log('  - 예비창업패키지 인지도');
  console.log('  - 정부지원사업 지식 수준');
  console.log('  - 관련 추가 질문들\n');

  try {
    // 기존 데이터 백업
    const { data: existingData } = await supabase
      .from('chat_questions')
      .select('*');

    if (existingData && existingData.length > 0) {
      const backupPath = path.join(process.cwd(), 'data', `backup_before_restore_${Date.now()}.json`);
      await fs.writeFile(backupPath, JSON.stringify(existingData, null, 2));
      console.log(`💾 기존 데이터 백업: ${backupPath}`);
    }

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
    console.log('📝 재구성된 질문 데이터를 복구합니다...');
    const { data, error: insertError } = await supabase
      .from('chat_questions')
      .insert(actualQuestions)
      .select();

    if (insertError) {
      console.error('❌ 질문 데이터 복구 실패:', insertError.message);
      return;
    }

    console.log(`\n✅ ${data?.length || 0}개의 질문을 성공적으로 복구했습니다!`);

    // 복구된 데이터 확인
    const { data: restoredQuestions } = await supabase
      .from('chat_questions')
      .select('*')
      .order('order_index');

    if (restoredQuestions) {
      console.log('\n📋 복구된 질문 목록:');
      console.log('=' .repeat(60));
      restoredQuestions.forEach(q => {
        console.log(`\n${q.order_index}. [${q.step}]`);
        console.log(`   ${q.question.replace(/\n/g, ' ')}`);
        if (q.options) {
          console.log(`   옵션: ${q.options.slice(0, 2).join(', ')}...`);
        }
      });
    }

    // 로컬 파일에도 저장
    const finalBackupPath = path.join(process.cwd(), 'data', 'questions_restored.json');
    await fs.writeFile(
      finalBackupPath,
      JSON.stringify({
        questions: actualQuestions,
        restoredAt: new Date().toISOString(),
        description: '사용자 설명 기반 재구성된 질문 데이터'
      }, null, 2)
    );
    console.log(`\n💾 복구된 데이터 저장: ${finalBackupPath}`);

    console.log('\n✨ 복구 완료!');
    console.log('🌐 /admin/questions 페이지에서 확인하고 추가 수정이 가능합니다.');

  } catch (error) {
    console.error('❌ 예기치 않은 오류 발생:', error);
  }
}

restoreActualQuestions();