import { DynamicQuestionService } from '../lib/chat';

export async function testChatFlow() {
  const service = new DynamicQuestionService();

  console.log('Loading questions from localStorage...');
  const questions = await service.loadQuestions();
  console.log(`Found ${questions.size} questions`);

  const activeQuestions = Array.from(questions.values())
    .filter(q => q.is_active)
    .sort((a, b) => a.order_index - b.order_index);

  console.log(`Active questions: ${activeQuestions.length}`);

  if (activeQuestions.length === 0) {
    throw new Error('No active questions found');
  }

  console.log('\nChat flow sequence:');
  activeQuestions.forEach((q, index) => {
    console.log(`  ${index + 1}. [${q.step}] ${q.question.substring(0, 50)}...`);
  });

  console.log('\n✅ Chat flow validated');
  return { questions: activeQuestions };
}