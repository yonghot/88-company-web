import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(url, key);

async function checkQuestions() {
  const { data, error } = await supabase
    .from('chat_questions')
    .select('*')
    .order('order_index');

  if (error) {
    console.error('❌ 에러:', error);
    return;
  }

  console.log('📋 현재 질문 목록:\n');
  data?.forEach(q => {
    console.log(`${q.order_index}. [${q.type}]`);
    console.log(`   질문: ${q.question.substring(0, 100).replace(/\n/g, ' ')}...`);
    if (q.options) {
      console.log(`   옵션: ${JSON.stringify(q.options).substring(0, 100)}...`);
    }
    console.log('');
  });
}

checkQuestions();
