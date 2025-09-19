import { enhancedRealtimeService } from '../lib/chat/enhanced-realtime-service';

async function testStepCount() {
  console.log('🧪 단계 수 계산 테스트\n');

  console.log('1️⃣ 질문 로드 중...');
  const questions = enhancedRealtimeService.getQuestions();
  console.log(`📊 전체 질문: ${questions.length}개`);

  const activeQuestions = enhancedRealtimeService.getActiveQuestions();
  console.log(`✅ 활성 질문: ${activeQuestions.length}개`);

  const totalSteps = enhancedRealtimeService.getTotalSteps();
  console.log(`📈 단계 수: ${totalSteps}단계`);

  console.log('\n📝 활성 질문 목록:');
  activeQuestions.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.step}: ${q.question.substring(0, 50)}...`);
  });

  console.log('\n✅ 테스트 결과:');
  if (totalSteps === activeQuestions.length) {
    console.log(`✅ 성공: 단계 수(${totalSteps})가 활성 질문 수(${activeQuestions.length})와 일치합니다.`);
  } else {
    console.log(`❌ 실패: 단계 수(${totalSteps})가 활성 질문 수(${activeQuestions.length})와 일치하지 않습니다.`);
  }

  return { questions: questions.length, active: activeQuestions.length, steps: totalSteps };
}

if (require.main === module) {
  testStepCount().catch(console.error);
}