import { enhancedRealtimeService } from '../lib/chat/enhanced-realtime-service';

async function testChatbotStability() {
  console.log('🧪 챗봇 안정성 테스트\n');

  console.log('1️⃣ 초기 질문 로드 테스트');
  const questions = enhancedRealtimeService.getQuestions();
  console.log(`✅ ${questions.length}개 질문 로드됨\n`);

  console.log('2️⃣ 구독 리스너 테스트');
  let updateCount = 0;
  const unsubscribe = enhancedRealtimeService.subscribe(() => {
    updateCount++;
    console.log(`⚠️ 업데이트 감지 #${updateCount} - 챗봇이 리셋될 수 있음!`);
  });

  console.log('3️⃣ 질문 업데이트 시뮬레이션');
  const testQuestions = [...questions];
  testQuestions[0].question = '테스트 변경: ' + new Date().toISOString();

  await enhancedRealtimeService.saveQuestions(testQuestions);
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`\n📊 결과:`);
  console.log(`- 업데이트 횟수: ${updateCount}회`);

  if (updateCount === 0) {
    console.log('✅ 좋음: 챗봇이 업데이트에 반응하지 않음 (안정적)');
  } else if (updateCount === 1) {
    console.log('⚠️ 주의: 1회 업데이트 감지 (관리자 페이지에서만 사용)');
  } else {
    console.log('❌ 문제: 과도한 업데이트 감지 (챗봇이 리셋될 수 있음)');
  }

  // 원복
  await enhancedRealtimeService.saveQuestions(questions);
  unsubscribe();

  console.log('\n✅ 테스트 완료!');
  console.log('💡 챗봇은 이제 페이지 로드/새로고침 시에만 질문을 로드합니다.');

  return { questionsLoaded: questions.length, updateEvents: updateCount };
}

if (require.main === module) {
  testChatbotStability().catch(console.error);
}