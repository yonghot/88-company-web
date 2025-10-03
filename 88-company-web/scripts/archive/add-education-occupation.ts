import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const isServiceRole = supabaseKey.indexOf('service_role') >= 0;
console.log('Supabase 연결: ' + (isServiceRole ? 'Service Role Key' : 'Anon Key'));
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('학력/직업 질문 추가 마이그레이션 시작...\n');

  try {
    console.log('Step 1: chat_questions 테이블 업데이트 중...');

    console.log('  - 기존 질문 순서 조정 중...');
    await supabase.from('chat_questions').update({ order_index: 10 }).eq('order_index', 8);
    await supabase.from('chat_questions').update({ order_index: 9 }).eq('order_index', 7);
    await supabase.from('chat_questions').update({ order_index: 8 }).eq('order_index', 6);
    await supabase.from('chat_questions').update({ order_index: 7 }).eq('order_index', 5);
    await supabase.from('chat_questions').update({ order_index: 6 }).eq('order_index', 4);

    console.log('  - 새로운 질문 추가 중...');
    const newQuestions = [
      {
        type: 'select',
        question: '최종 학력과 전공을 선택해주세요.\n*학력에 따라 지원 가능한 사업이 달라집니다.',
        placeholder: null,
        options: ["고졸 이하","전문대졸","대졸 (학사)","석사","박사","재학 중","기타"],
        validation: null,
        order_index: 4
      },
      {
        type: 'select',
        question: '현재 직업 상태를 선택해주세요.\n*직업에 따라 맞춤형 지원사업을 추천해드립니다.',
        placeholder: null,
        options: ["학생","직장인 (재직 중)","프리랜서","자영업자","구직 중","주부","기타"],
        validation: null,
        order_index: 5
      }
    ];

    const result = await supabase.from('chat_questions').insert(newQuestions);

    if (result.error) {
      console.error('질문 추가 실패:', result.error);
      throw result.error;
    }

    console.log('Step 1 완료: chat_questions 업데이트 완료\n');

    console.log('Step 2: leads 테이블 컬럼 추가 안내\n');
    console.log('leads 테이블 컬럼 추가는 Supabase Dashboard에서 수동으로 진행:');
    console.log('  1. Supabase Dashboard -> Table Editor -> leads 테이블');
    console.log('  2. 새 컬럼 추가:');
    console.log('     - 컬럼명: education, 타입: text, Nullable: true');
    console.log('     - 컬럼명: occupation, 타입: text, Nullable: true\n');

    console.log('최종 질문 목록 확인 중...\n');
    const { data: questions, error: selectError } = await supabase
      .from('chat_questions')
      .select('order_index, type, question')
      .order('order_index');

    if (selectError) {
      console.error('조회 실패:', selectError);
      throw selectError;
    }

    console.log('현재 질문 목록:');
    questions?.forEach(q => {
      const preview = q.question.substring(0, 60).replace(/\n/g, ' ');
      console.log('  [' + q.order_index + '] ' + q.type.padEnd(10) + ' ' + preview + '...');
    });

    console.log('\n총 ' + questions?.length + '개 질문');
    console.log('\n마이그레이션 완료!');

  } catch (error) {
    console.error('\n마이그레이션 중 오류 발생:', error);
    process.exit(1);
  }
}

runMigration();
