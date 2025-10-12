import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjizerpeyteokqhufqea.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXplcnBleXRlb2txaHVmcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxMTEsImV4cCI6MjA3MzI2NTExMX0.lpw_F9T7tML76NyCm1_6NJ6kyFdXtYsoUehK9ZhZT7s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateWelcomeMessage() {
  console.log('🔄 Updating welcome message in production database...\n');

  try {
    const { data: existing, error: checkError } = await supabase
      .from('chat_questions')
      .select('*')
      .eq('order_index', 0)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Failed to check existing message:', checkError);
      process.exit(1);
    }

    if (existing) {
      console.log('📝 Existing welcome message:');
      console.log('  Type:', existing.type);
      console.log('  Content:', existing.question.substring(0, 100) + '...\n');
    }

    const newWelcomeMessage = {
      question: `안녕하세요! 88 Company입니다. 👋

예비창업자를 위한 정부지원사업 컨설팅을 도와드리고 있습니다.

📋 **간단한 질문**에 답변해주시면,
💰 **맞춤형 지원사업**을 추천해드립니다.

⏱️ 소요시간: 약 2~3분
🎯 목적: 최적의 정부지원사업 매칭

지금 바로 시작해볼까요?`,
      type: 'text',
    };

    const { data, error } = await supabase
      .from('chat_questions')
      .update(newWelcomeMessage)
      .eq('order_index', 0)
      .select();

    if (error) {
      console.error('❌ Failed to update welcome message:', error);
      process.exit(1);
    }

    console.log('✅ Welcome message updated successfully!\n');
    console.log('📊 New content:');
    console.log(newWelcomeMessage.question);

    console.log('\n🔄 Next steps:');
    console.log('1. Wait for Vercel deployment to complete');
    console.log('2. Go to https://www.88-company.com/admin');
    console.log('3. Click "캐시 새로고침" button');
    console.log('4. Test chatbot at https://www.88-company.com');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

updateWelcomeMessage();
