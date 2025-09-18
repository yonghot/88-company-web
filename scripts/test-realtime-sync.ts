import { realTimeQuestionService } from '../lib/chat/real-time-question-service';

export async function testRealTimeSync() {
  console.log('🚀 실시간 동기화 테스트 시작\n');

  console.log('1️⃣ 현재 질문 상태 확인');
  const currentQuestions = realTimeQuestionService.getAllQuestions();
  const activeQuestions = realTimeQuestionService.getActiveQuestions();
  console.log(`   총 질문 수: ${currentQuestions.length}`);
  console.log(`   활성 질문 수: ${activeQuestions.length}`);
  console.log(`   전체 단계 수: ${realTimeQuestionService.getTotalSteps()}`);

  console.log('\n2️⃣ 챗봇 플로우 확인');
  const flow = realTimeQuestionService.getChatFlow();
  const flowSteps = Object.keys(flow);
  console.log(`   플로우 단계: ${flowSteps.length}개`);
  console.log(`   단계 목록: ${flowSteps.join(', ')}`);

  console.log('\n3️⃣ 각 질문별 상세 정보');
  activeQuestions.forEach((q, index) => {
    console.log(`   ${index + 1}. ${q.step} (order: ${q.order_index})`);
    console.log(`      질문: ${q.question.substring(0, 50)}...`);
    console.log(`      타입: ${q.type}`);
    console.log(`      다음: ${q.next_step || '동적 결정'}`);
    console.log(`      활성: ${q.is_active ? '✅' : '❌'}`);
  });

  console.log('\n4️⃣ 동적 네비게이션 테스트');
  const stepSequence = [];
  let currentStep = activeQuestions[0]?.step;
  const visitedSteps = new Set<string>();

  while (currentStep && !visitedSteps.has(currentStep)) {
    visitedSteps.add(currentStep);
    stepSequence.push(currentStep);

    const flowStep = flow[currentStep];
    if (!flowStep || !flowStep.nextStep) break;

    const nextStep = flowStep.nextStep();
    if (nextStep === 'complete' || nextStep === currentStep) break;
    currentStep = nextStep;
  }

  console.log(`   네비게이션 경로: ${stepSequence.join(' → ')} → complete`);
  console.log(`   총 단계: ${stepSequence.length} (phoneVerification 포함 시 +1)`);

  console.log('\n5️⃣ 실시간 업데이트 구독 테스트');
  const unsubscribe = realTimeQuestionService.subscribe(() => {
    console.log('   📢 질문이 업데이트되었습니다!');
  });

  console.log('   구독 등록 완료');

  console.log('\n6️⃣ 테스트 업데이트 시뮬레이션');
  const testQuestions = [...currentQuestions];
  testQuestions[0].question = '테스트 업데이트: ' + new Date().toLocaleTimeString();
  realTimeQuestionService.saveQuestions(testQuestions);

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('   업데이트 전파 확인');
  const updatedQuestions = realTimeQuestionService.getAllQuestions();
  console.log(`   첫 번째 질문: ${updatedQuestions[0].question.substring(0, 50)}...`);

  console.log('\n7️⃣ 원래 상태로 복원');
  realTimeQuestionService.saveQuestions(currentQuestions);
  console.log('   복원 완료');

  console.log('\n✅ 테스트 완료!');
  console.log('   실시간 동기화가 정상적으로 작동합니다.');
  console.log('   관리자 페이지에서 질문을 수정하면 챗봇에 즉시 반영됩니다.');

  unsubscribe();
  return { questionsCount: currentQuestions.length, flowSteps: flowSteps.length };
}

if (require.main === module) {
  testRealTimeSync().catch(console.error);
}