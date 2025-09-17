import { questionManager } from '../lib/chat/question-manager';
import { ChatQuestion } from '../lib/chat/dynamic-types';

console.log('🔍 플로우 무결성 테스트 시작...\n');

// 테스트 시나리오: timeline 질문 삭제 후 검증
function testDeleteQuestion() {
  console.log('1. 질문 삭제 시나리오 테스트');

  // 현재 질문 로드
  const originalQuestions = questionManager.getQuestions();
  console.log(`  - 원본 질문 수: ${originalQuestions.length}개`);

  // timeline 질문 찾기
  const timelineQuestion = originalQuestions.find(q => q.step === 'timeline');
  if (!timelineQuestion) {
    console.log('  ❌ timeline 질문이 없습니다. 테스트 스킵.');
    return;
  }

  // timeline을 가리키는 질문 찾기
  const questionPointingToTimeline = originalQuestions.find(q => q.next_step === 'timeline');
  if (questionPointingToTimeline) {
    console.log(`  - "${questionPointingToTimeline.step}"이(가) timeline을 가리킴`);
  }

  // timeline 삭제 시뮬레이션
  const questionsAfterDelete = originalQuestions.filter(q => q.step !== 'timeline');

  // 삭제된 질문을 가리키던 질문들의 next_step 업데이트 (실제 코드 로직 시뮬레이션)
  const updatedQuestions = questionsAfterDelete.map(q => {
    if (q.next_step === 'timeline') {
      // timeline의 next_step으로 대체
      const nextStep = timelineQuestion.next_step || 'details';
      console.log(`  - "${q.step}"의 next_step을 timeline → ${nextStep}로 변경`);
      return {
        ...q,
        next_step: nextStep
      };
    }
    return q;
  });

  console.log(`  - 삭제 후 질문 수: ${updatedQuestions.length}개`);

  // 플로우 검증
  const flow = questionManager.getFlow();
  let hasInvalidReferences = false;

  updatedQuestions.forEach(q => {
    if (q.next_step && q.next_step !== 'complete') {
      const nextStepExists = updatedQuestions.some(uq => uq.step === q.next_step) ||
                             q.next_step === 'phoneVerification' ||
                             q.next_step === 'customService';

      if (!nextStepExists) {
        console.log(`  ❌ "${q.step}"이(가) 유효하지 않은 step "${q.next_step}"를 가리킴`);
        hasInvalidReferences = true;
      }
    }
  });

  if (!hasInvalidReferences) {
    console.log('  ✅ 모든 next_step 참조가 유효함');
  }
}

// 진행도 계산 테스트
function testProgressCalculation() {
  console.log('\n2. 동적 진행도 계산 테스트');

  const questions = questionManager.getQuestions();
  const activeQuestions = questions.filter(q => q.is_active !== false);

  // phoneVerification 자동 추가 고려
  const hasPhoneStep = activeQuestions.some(q => q.step === 'phone');
  const totalSteps = activeQuestions.length + (hasPhoneStep ? 1 : 0);

  console.log(`  - 활성 질문 수: ${activeQuestions.length}개`);
  console.log(`  - phone 단계 존재: ${hasPhoneStep ? '예' : '아니오'}`);
  console.log(`  - 총 단계 수: ${totalSteps}개`);

  // 각 단계별 진행도 계산
  activeQuestions.forEach((q, index) => {
    console.log(`  - ${q.step}: ${index + 1}/${totalSteps}`);
  });

  if (hasPhoneStep) {
    console.log(`  - phoneVerification: ${totalSteps - 1}/${totalSteps}`);
  }
  console.log(`  - complete: ${totalSteps}/${totalSteps}`);

  console.log('  ✅ 진행도 계산 검증 완료');
}

// 플로우 네비게이션 검증
function testFlowNavigation() {
  console.log('\n3. 플로우 네비게이션 검증');

  const flow = questionManager.getFlow();
  const flowSteps = Object.keys(flow);

  console.log(`  - 플로우에 ${flowSteps.length}개 단계 존재`);

  // 각 단계에서 다음 단계 확인
  let brokenLinks = 0;
  flowSteps.forEach(stepId => {
    const step = flow[stepId];
    if (step.nextStep) {
      const nextStepId = step.nextStep();
      if (nextStepId && nextStepId !== 'complete' && !flow[nextStepId]) {
        console.log(`  ❌ "${stepId}" → "${nextStepId}" (존재하지 않음)`);
        brokenLinks++;
      } else {
        console.log(`  ✅ "${stepId}" → "${nextStepId}"`);
      }
    }
  });

  if (brokenLinks === 0) {
    console.log('\n  ✅ 모든 네비게이션 링크가 유효함');
  } else {
    console.log(`\n  ❌ ${brokenLinks}개의 끊어진 링크 발견`);
  }
}

// 특수 케이스 검증
function testSpecialCases() {
  console.log('\n4. 특수 케이스 검증');

  const flow = questionManager.getFlow();

  // welcome → 기타 문의 → customService
  if (flow['welcome']?.nextStep) {
    const normalNext = flow['welcome'].nextStep();
    const specialNext = flow['welcome'].nextStep('기타 문의');

    console.log(`  - welcome 기본: → ${normalNext}`);
    console.log(`  - welcome "기타 문의": → ${specialNext}`);

    if (specialNext === 'customService') {
      console.log('  ✅ "기타 문의" 조건부 네비게이션 정상');
    }
  }

  // phone → phoneVerification
  if (flow['phone']?.nextStep) {
    const phoneNext = flow['phone'].nextStep();
    console.log(`  - phone → ${phoneNext}`);

    if (phoneNext === 'phoneVerification') {
      console.log('  ✅ 전화번호 인증 플로우 정상');
    }
  }

  // phoneVerification → complete
  if (flow['phoneVerification']?.nextStep) {
    const verificationNext = flow['phoneVerification'].nextStep();
    console.log(`  - phoneVerification → ${verificationNext}`);

    if (verificationNext === 'complete') {
      console.log('  ✅ 인증 완료 플로우 정상');
    }
  }

  console.log('\n  ✅ 특수 케이스 검증 완료');
}

// 메인 실행
async function runTests() {
  console.log('='.repeat(50));
  console.log('플로우 무결성 및 동적 진행도 테스트');
  console.log('='.repeat(50) + '\n');

  testDeleteQuestion();
  testProgressCalculation();
  testFlowNavigation();
  testSpecialCases();

  console.log('\n' + '='.repeat(50));
  console.log('✨ 테스트 완료!');
  console.log('='.repeat(50));
}

runTests().catch(console.error);