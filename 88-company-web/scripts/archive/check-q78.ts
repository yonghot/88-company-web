import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase configuration not found');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📋 모든 질문 확인 중 (7, 8번 찾기)...\n');

  const { data, error } = await supabase
    .from('chat_questions')
    .select('id, question, type, options, order_index')
    .order('order_index');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ 질문을 찾을 수 없습니다.');
    return;
  }

  console.log(`총 ${data.length}개 질문 발견\n`);

  data.forEach((q, index) => {
    const questionNum = index + 1;
    console.log(`${questionNum}번 질문 (order: ${q.order_index}, id: ${q.id})`);
    console.log(`질문: ${q.question}`);
    console.log(`타입: ${q.type}`);
    if (q.options) {
      const optionsArray = Array.isArray(q.options) ? q.options : [];
      console.log(`옵션 개수: ${optionsArray.length}`);
      if (optionsArray.length > 0) {
        console.log(`옵션:`, optionsArray.slice(0, 3).join(', '), optionsArray.length > 3 ? '...' : '');
      }
    }
    console.log('---\n');
  });
}

main().catch(console.error);
