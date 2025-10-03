import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCompleteMessage() {
  console.log('🔄 Adding complete message to database...\n');

  const completeMessage = {
    order_index: 999,
    question: '등록이 완료되었습니다! 🎉\n\n빠른 시일 내에 88 Company에서 무료 유선 상담 연락을 드릴 예정입니다.\n\n창업 여정의 시작을 함께 하게 되어 기쁩니다.',
    type: 'text',
    placeholder: null,
    options: null,
    validation: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: existing, error: checkError } = await supabase
    .from('chat_questions')
    .select('*')
    .eq('order_index', 999)
    .maybeSingle();

  if (existing) {
    console.log('ℹ️  Complete message already exists (order_index=999), updating...');

    const { error: updateError } = await supabase
      .from('chat_questions')
      .update({
        question: completeMessage.question,
        type: completeMessage.type,
        updated_at: new Date().toISOString()
      })
      .eq('order_index', 999);

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      process.exit(1);
    }

    console.log('✅ Complete message updated successfully!');
  } else {
    const { error: insertError } = await supabase
      .from('chat_questions')
      .insert([completeMessage]);

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      process.exit(1);
    }

    console.log('✅ Complete message added successfully!');
  }

  const { data: result } = await supabase
    .from('chat_questions')
    .select('*')
    .eq('order_index', 999)
    .single();

  console.log('\n📝 Current complete message (order_index=999):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(result?.question);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 이제 Supabase 대시보드에서 이 메시지를 수정할 수 있습니다.');
  console.log('   order_index가 999인 질문을 찾아서 question 필드를 수정하세요.');
}

addCompleteMessage();
