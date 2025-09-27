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

async function analyzeCurrentData() {
  console.log('🔍 현재 Supabase 데이터베이스 상태 분석\n');
  console.log('=' .repeat(60));

  try {
    // 현재 데이터 조회
    const { data: currentQuestions, error } = await supabase
      .from('chat_questions')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('❌ 데이터 조회 실패:', error.message);
      return;
    }

    console.log(`📊 총 ${currentQuestions?.length || 0}개의 질문이 저장되어 있습니다.\n`);

    // 상세 정보 출력
    if (currentQuestions) {
      for (const q of currentQuestions) {
        console.log(`\n${q.order_index}. [${q.step}]`);
        console.log(`   질문: ${q.question}`);
        console.log(`   타입: ${q.type}`);
        if (q.options) {
          console.log(`   옵션: ${JSON.stringify(q.options)}`);
        }
        if (q.placeholder) {
          console.log(`   플레이스홀더: ${q.placeholder}`);
        }
        console.log(`   활성화: ${q.is_active ? '✅' : '❌'}`);
        console.log(`   수정시간: ${q.updated_at || q.created_at}`);
      }

      // 타임스탬프 분석
      console.log('\n' + '=' .repeat(60));
      console.log('\n⏰ 타임스탬프 분석:');

      const timestamps = currentQuestions.map(q => ({
        step: q.step,
        created: new Date(q.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        updated: q.updated_at ? new Date(q.updated_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : 'N/A'
      }));

      timestamps.forEach(t => {
        console.log(`\n   ${t.step}:`);
        console.log(`     생성: ${t.created}`);
        console.log(`     수정: ${t.updated}`);
      });

      // 현재 시간 기록
      const now = new Date();
      console.log('\n📅 현재 시간 (KST):', now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

      // 파일로 저장
      const snapshotPath = path.join(process.cwd(), 'data', 'questions_snapshot.json');
      await fs.writeFile(
        snapshotPath,
        JSON.stringify({
          timestamp: now.toISOString(),
          questions: currentQuestions
        }, null, 2)
      );
      console.log(`\n💾 스냅샷 저장: ${snapshotPath}`);
    }

  } catch (error) {
    console.error('❌ 예기치 않은 오류:', error);
  }
}

analyzeCurrentData();