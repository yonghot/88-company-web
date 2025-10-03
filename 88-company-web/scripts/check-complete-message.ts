import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in .env.local');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompleteQuestion() {
  console.log('🔍 Checking for complete question in database...\n');

  const { data, error } = await supabase
    .from('chat_questions')
    .select('*')
    .eq('step_name', 'complete')
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\n❌ complete 질문이 데이터베이스에 없습니다.');
    console.log('   하드코딩된 메시지가 사용됩니다.');
    return;
  }

  console.log('✅ Complete 질문 발견:\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('step_name:', data.step_name);
  console.log('order_index:', data.order_index);
  console.log('type:', data.type);
  console.log('is_active:', data.is_active);
  console.log('\n📝 Question (데이터베이스):');
  console.log(data.question);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\n📝 Hardcoded Fallback (ChatInterface.tsx):');
  console.log('🎉 등록이 완료되었습니다!\n\n빠른 시일 내에 연락드리겠습니다.\n88 Company와 함께 성공적인 창업을 시작하세요!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (data.question !== '🎉 등록이 완료되었습니다!\n\n빠른 시일 내에 연락드리겠습니다.\n88 Company와 함께 성공적인 창업을 시작하세요!') {
    console.log('\n⚠️  메시지가 다릅니다! 데이터베이스 메시지가 우선 사용됩니다.');
  } else {
    console.log('\n✅ 메시지가 일치합니다.');
  }
}

checkCompleteQuestion();
