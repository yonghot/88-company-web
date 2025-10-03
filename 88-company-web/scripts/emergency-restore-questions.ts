#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function emergencyRestore() {
  console.log('\n🚨 긴급 질문 데이터 복구 시작\n');
  console.log('=' .repeat(60));

  // 사용자가 직접 편집했던 질문들 (어제 작업 내용)
  const userEditedQuestions = [
    {
      step: 'welcome',
      type: 'select',
      question: '안녕하세요! 88입니다 👋\n창업 지원 전문 컨설팅을 찾고 계신가요?',
      options: ['네. 전부터 생각하던게 있습니다!', '네. 하지만 어떤게 좋을지 잘 모르겠어요!', '아직 잘 모르겠어요.'],
      order_index: 0,
      is_active: true,
      placeholder: null,
      validation: null,
      next_step: 'business_status'
    },
    {
      step: 'business_status',
      type: 'select',
      question: '현재 사업자등록 상태가 어떻게 되시나요?',
      options: ['예비창업자 (사업자등록 전)', '사업자등록 완료 (1년 미만)', '사업자등록 완료 (1-3년)', '사업자등록 완료 (3년 이상)'],
      order_index: 1,
      is_active: true,
      placeholder: null,
      validation: null,
      next_step: 'pre_startup_package'
    },
    {
      step: 'pre_startup_package',
      type: 'select',
      question: '예비창업패키지에 대해 알고 계신가요?',
      options: ['네, 잘 알고 있습니다', '들어본 적은 있어요', '처음 들어봅니다'],
      order_index: 2,
      is_active: true,
      placeholder: null,
      validation: null,
      next_step: 'gov_support_knowledge'
    },
    {
      step: 'gov_support_knowledge',
      type: 'select',
      question: '정부지원사업에 대해 얼마나 알고 계신가요?',
      options: ['매우 잘 알고 있음', '어느 정도 알고 있음', '잘 모름', '전혀 모름'],
      order_index: 3,
      is_active: true,
      placeholder: null,
      validation: null,
      next_step: 'budget'
    },
    {
      step: 'budget',
      type: 'select',
      question: '희망하시는 지원금 규모는 어느 정도인가요?',
      options: ['1천만원 이하', '1천-3천만원', '3천-5천만원', '5천만원-1억', '1억 이상'],
      order_index: 4,
      is_active: true,
      placeholder: null,
      validation: null,
      next_step: 'timeline'
    },
    {
      step: 'timeline',
      type: 'select',
      question: '언제까지 지원받기를 원하시나요?',
      options: ['즉시', '1개월 이내', '3개월 이내', '6개월 이내', '상관없음'],
      order_index: 5,
      is_active: true,
      placeholder: null,
      validation: null,
      next_step: 'details'
    },
    {
      step: 'details',
      type: 'text',
      question: '구체적으로 어떤 도움이 필요하신지 알려주세요.',
      options: null,
      order_index: 6,
      is_active: true,
      placeholder: '예: 창업지원금 신청서 작성, 사업계획서 검토 등...',
      validation: null,
      next_step: 'name'
    },
    {
      step: 'name',
      type: 'text',
      question: '상담을 위해 성함을 알려주세요.',
      options: null,
      order_index: 7,
      is_active: true,
      placeholder: '홍길동',
      validation: { type: 'name', minLength: 2 },
      next_step: 'phone'
    },
    {
      step: 'phone',
      type: 'text',
      question: '연락 가능한 전화번호를 입력해주세요.',
      options: null,
      order_index: 8,
      is_active: true,
      placeholder: '010-0000-0000',
      validation: { type: 'phone', pattern: '^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$' },
      next_step: 'complete'
    }
  ];

  try {
    // 1. 현재 상태 백업
    const { data: currentQuestions } = await supabase
      .from('chat_questions')
      .select('*');

    if (currentQuestions && currentQuestions.length > 0) {
      const backupPath = path.join(process.cwd(), 'data', `backup_before_emergency_restore_${Date.now()}.json`);
      await fs.writeFile(backupPath, JSON.stringify(currentQuestions, null, 2));
      console.log(`📁 현재 상태 백업 완료: ${backupPath}`);
    }

    // 2. 기존 질문 모두 삭제 (트랜잭션처럼 처리)
    console.log('🗑️  기존 질문 삭제 중...');
    const { error: deleteError } = await supabase
      .from('chat_questions')
      .delete()
      .neq('step', '');

    if (deleteError) {
      console.error('❌ 삭제 실패:', deleteError);
      return;
    }

    // 3. 사용자가 편집한 질문들 복구
    console.log('📝 사용자 편집 질문 복구 중...\n');

    for (const question of userEditedQuestions) {
      console.log(`  → [${question.step}] ${question.question.substring(0, 30)}...`);

      const { error } = await supabase
        .from('chat_questions')
        .insert([question]);

      if (error) {
        console.error(`  ❌ 실패: ${error.message}`);
      } else {
        console.log(`  ✅ 복구 완료`);
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ 긴급 복구 완료!');
    console.log(`📊 복구된 질문: ${userEditedQuestions.length}개`);

    // 복구된 질문 요약
    console.log('\n📋 복구된 주요 질문들:');
    console.log('  1. 사업자등록 상태 확인');
    console.log('  2. 예비창업패키지 인지도');
    console.log('  3. 정부지원사업 지식 수준');
    console.log('  4. 희망 지원금 규모');
    console.log('  5. 지원 시기');
    console.log('  6. 구체적 요구사항');
    console.log('  7. 이름 및 연락처');

  } catch (error) {
    console.error('❌ 복구 중 오류 발생:', error);
  }
}

emergencyRestore();