import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tjizerpeyteokqhufqea.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXplcnBleXRlb2txaHVmcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxMTEsImV4cCI6MjA3MzI2NTExMX0.lpw_F9T7tML76NyCm1_6NJ6kyFdXtYsoUehK9ZhZT7s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProductionQuestions() {
  console.log('🔍 Checking production database questions...\n');

  try {
    const { data: allQuestions, error } = await supabase
      .from('chat_questions')
      .select('order_index, type, question')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Failed to fetch questions:', error);
      process.exit(1);
    }

    console.log('📊 Total questions in database:', allQuestions?.length || 0);
    console.log('\n┌─────────────┬──────────────┬────────────────────────────┐');
    console.log('│ Order Index │ Type         │ Question Preview          │');
    console.log('├─────────────┼──────────────┼────────────────────────────┤');

    allQuestions?.forEach((q) => {
      const orderStr = String(q.order_index).padEnd(11);
      const typeStr = String(q.type || '-').padEnd(12);
      const questionPreview = (q.question || '').substring(0, 25).padEnd(26);
      console.log(`│ ${orderStr} │ ${typeStr} │ ${questionPreview} │`);
    });

    console.log('└─────────────┴──────────────┴────────────────────────────┘\n');

    const welcomeMsg = allQuestions?.find(q => q.order_index === 0);
    const regularQuestions = allQuestions?.filter(q => q.order_index !== 999 && q.order_index !== 0);
    const completeMsg = allQuestions?.find(q => q.order_index === 999);

    console.log('📋 Question breakdown:');
    console.log(`  - Welcome message (0): ${welcomeMsg ? '✓' : '✗'}`);
    console.log(`  - Regular questions (1-N): ${regularQuestions?.length || 0}`);
    console.log(`  - Complete message (999): ${completeMsg ? '✓' : '✗'}`);
    console.log(`  - Total steps (excluding 0 and 999): ${regularQuestions?.length || 0}`);

    console.log('\n🎯 Expected flow:');
    console.log('  1. Welcome message (order_index=0) - NO INPUT REQUIRED');
    console.log('  2. First question (order_index=1) - INPUT REQUIRED');
    console.log('  3. Progress: 0/10 → 1/10 → ... → 10/10');

    if (welcomeMsg) {
      console.log('\n✅ Welcome message found:');
      console.log('  Type:', welcomeMsg.type);
      console.log('  Content:', welcomeMsg.question.substring(0, 100) + '...');
    } else {
      console.log('\n❌ Welcome message NOT found!');
      console.log('  Run: npx tsx scripts/add-welcome-final.ts');
    }

    if (regularQuestions && regularQuestions.length > 0) {
      console.log('\n✅ First question found:');
      const firstQ = regularQuestions[0];
      console.log('  Order index:', firstQ.order_index);
      console.log('  Type:', firstQ.type);
      console.log('  Content:', firstQ.question.substring(0, 100) + '...');
    }

    console.log('\n💡 Debug checklist:');
    console.log('  [ ] Welcome message exists (order_index=0)');
    console.log('  [ ] First question exists (order_index=1)');
    console.log('  [ ] Total regular questions = 10');
    console.log('  [ ] No duplicate order_index values');
    console.log('  [ ] All question types are valid');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

checkProductionQuestions();
