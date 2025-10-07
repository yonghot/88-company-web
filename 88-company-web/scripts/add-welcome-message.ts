import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addWelcomeMessage() {
  console.log('🚀 Adding welcome message (order_index=0)...\n');

  try {
    const welcomeMessage = {
      order_index: 0,
      question: `안녕하세요! 88 Company입니다. 👋

예비창업자를 위한 정부지원사업 컨설팅을 도와드리고 있습니다.

📋 **간단한 질문**에 답변해주시면,
💰 **맞춤형 지원사업**을 추천해드립니다.

⏱️ 소요시간: 약 2~3분
🎯 목적: 최적의 정부지원사업 매칭

지금 바로 시작해볼까요?`,
      type: 'welcome',
      placeholder: null,
      options: null,
      validation: null,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('chat_questions')
      .upsert(welcomeMessage, {
        onConflict: 'order_index',
      })
      .select();

    if (error) {
      console.error('❌ Failed to add welcome message:', error);
      process.exit(1);
    }

    console.log('✅ Welcome message added successfully!\n');
    console.log('📊 Result:');
    console.log(JSON.stringify(data, null, 2));

    const { data: allQuestions, error: fetchError } = await supabase
      .from('chat_questions')
      .select('order_index, type, is_active')
      .order('order_index', { ascending: true });

    if (fetchError) {
      console.error('❌ Failed to fetch questions:', fetchError);
      process.exit(1);
    }

    console.log('\n📋 Current question structure:');
    console.log('┌─────────────┬──────────────┬───────────┐');
    console.log('│ Order Index │ Type         │ Active    │');
    console.log('├─────────────┼──────────────┼───────────┤');
    allQuestions?.forEach((q) => {
      const orderStr = String(q.order_index).padEnd(11);
      const typeStr = String(q.type || '-').padEnd(12);
      const activeStr = q.is_active ? '✓' : '✗';
      console.log(`│ ${orderStr} │ ${typeStr} │ ${activeStr.padEnd(9)} │`);
    });
    console.log('└─────────────┴──────────────┴───────────┘\n');

    console.log('✨ Welcome message is now available!');
    console.log('💡 Refresh your chatbot page to see the changes.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

addWelcomeMessage();
