import { StaticQuestionService } from '../lib/chat/static-question-service';

export async function testChatFlow() {
  const service = StaticQuestionService.getInstance();

  console.log('Loading questions from Supabase...');
  const questions = await service.loadQuestions();
  console.log(`Found ${questions.length} questions`);

  const activeQuestions = service.getActiveQuestions();

  console.log(`Active questions: ${activeQuestions.length}`);

  if (activeQuestions.length === 0) {
    throw new Error('No active questions found');
  }

  console.log('\nChat flow sequence:');
  activeQuestions.forEach((q, index) => {
    console.log(`  ${index + 1}. [step_${q.order_index}] ${q.question.substring(0, 50)}...`);
  });

  const flow = service.getChatFlow();
  console.log(`\nTotal steps in flow: ${Object.keys(flow).length}`);

  console.log('\n✅ Chat flow validated');
  return { questions: activeQuestions };
}