import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjizerpeyteokqhufqea.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXplcnBleXRlb2txaHVmcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxMTEsImV4cCI6MjA3MzI2NTExMX0.lpw_F9T7tML76NyCm1_6NJ6kyFdXtYsoUehK9ZhZT7s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      type: 'text',  // Changed from 'welcome' to 'text'
      placeholder: null,
      options: null,
      validation: null,
    };

    // First, check if order_index=0 already exists
    const { data: existing, error: checkError } = await supabase
      .from('chat_questions')
      .select('*')
      .eq('order_index', 0)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Failed to check existing message:', checkError);
      process.exit(1);
    }

    let result;
    if (existing) {
      console.log('📝 Updating existing welcome message...');
      const { data, error } = await supabase
        .from('chat_questions')
        .update(welcomeMessage)
        .eq('order_index', 0)
        .select();

      result = { data, error };
    } else {
      console.log('✨ Creating new welcome message...');
      const { data, error } = await supabase
        .from('chat_questions')
        .insert([welcomeMessage])
        .select();

      result = { data, error };
    }

    if (result.error) {
      console.error('❌ Failed to add welcome message:', result.error);
      console.error('Error details:', JSON.stringify(result.error, null, 2));
      process.exit(1);
    }

    console.log('✅ Welcome message added successfully!\n');
    console.log('📊 Result:');
    console.log(JSON.stringify(result.data, null, 2));

    // Fetch all questions to show the structure
    const { data: allQuestions, error: fetchError } = await supabase
      .from('chat_questions')
      .select('order_index, type, question')
      .order('order_index', { ascending: true });

    if (fetchError) {
      console.error('❌ Failed to fetch questions:', fetchError);
      process.exit(1);
    }

    console.log('\n📋 Current question structure:');
    console.log('┌─────────────┬──────────────┬────────────────────────────┐');
    console.log('│ Order Index │ Type         │ Question Preview          │');
    console.log('├─────────────┼──────────────┼────────────────────────────┤');
    allQuestions?.forEach((q) => {
      const orderStr = String(q.order_index).padEnd(11);
      const typeStr = String(q.type || '-').padEnd(12);
      const questionPreview = (q.question || '').substring(0, 25).padEnd(26);
      console.log(`│ ${orderStr} │ ${typeStr} │ ${questionPreview} │`);
    });
    console.log('└─────────────┴──────────────┴────────────────────────────┘\n');

    console.log('✨ Welcome message is now available!');
    console.log('💡 Refresh your chatbot page to see the changes.');
    console.log('\n🔄 To apply changes:');
    console.log('1. Go to http://localhost:3000/admin');
    console.log('2. Click "캐시 새로고침" button');
    console.log('3. Or just reload the chatbot page');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

addWelcomeMessage();
