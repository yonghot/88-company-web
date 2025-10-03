import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(url, key);

async function verify() {
  console.log('🔍 step/next_step 제거 최종 검증...\n');

  const { data, error } = await supabase
    .from('chat_questions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ 에러:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('📋 테이블 구조:');
    console.log(Object.keys(data[0]));

    const hasStep = 'step' in data[0];
    const hasNextStep = 'next_step' in data[0];

    console.log('\n🔍 컬럼 확인:');
    console.log('  step:', hasStep ? '❌ 존재함' : '✅ 제거됨');
    console.log('  next_step:', hasNextStep ? '❌ 존재함' : '✅ 제거됨');

    if (!hasStep && !hasNextStep) {
      console.log('\n✅ step, next_step 컬럼이 성공적으로 제거되었습니다!');
    }
  }
}

verify();
