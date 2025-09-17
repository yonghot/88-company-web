/**
 * 통일된 플로우 테스트
 * 모든 선택지가 동일한 플로우를 따르는지 확인
 */

import { questionManager } from '../lib/chat/question-manager';

console.log('🧪 통일된 플로우 테스트');
console.log('='.repeat(50));

// 질문 로드
const questions = questionManager.getQuestions();
const flow = questionManager.getFlow();

console.log('\n📋 현재 활성 질문:');
const activeQuestions = questions.filter(q => q.is_active !== false);
activeQuestions.forEach(q => {
  console.log(`  - [${q.step}] ${q.question.substring(0, 40)}...`);
});

console.log('\n🔍 customService 상태 확인:');
const customService = questions.find(q => q.step === 'customService');
if (customService) {
  console.log(`  - customService.is_active: ${customService.is_active}`);
  console.log(`  - 상태: ${customService.is_active === false ? '✅ 비활성화됨' : '⚠️ 활성화됨'}`);
} else {
  console.log('  - customService 질문이 없음');
}

console.log('\n🎯 welcome 단계 테스트:');
const welcomeStep = flow['welcome'];
const testOptions = ['창업 컨설팅', '경영 전략 수립', '마케팅 전략', '투자 유치 지원', '기타 문의'];

if (welcomeStep) {
  console.log('  선택 가능한 옵션:');
  if (welcomeStep.options) {
    welcomeStep.options.forEach((option: string) => {
      console.log(`    - "${option}"`);
    });
  }

  console.log('\n  각 옵션의 다음 단계:');
  testOptions.forEach(option => {
    const nextStep = welcomeStep.nextStep ? welcomeStep.nextStep(option) : 'unknown';
    const isCorrect = nextStep === 'budget';
    console.log(`    "${option}" → ${nextStep} ${isCorrect ? '✅' : '❌'}`);
  });
}

console.log('\n📊 플로우 순서 확인:');
console.log('  기대되는 플로우:');
console.log('  welcome → budget → timeline → details → name → phone → phoneVerification → complete');

console.log('\n  실제 플로우:');
let currentStep = 'welcome';
let visited = new Set<string>();
let flowPath = [currentStep];

while (currentStep && currentStep !== 'complete' && !visited.has(currentStep)) {
  visited.add(currentStep);
  const step = flow[currentStep];

  if (step && step.nextStep) {
    // '기타 문의'를 선택한 경우의 플로우 테스트
    currentStep = step.nextStep('기타 문의');
    flowPath.push(currentStep);
  } else {
    break;
  }

  // 무한 루프 방지
  if (flowPath.length > 20) {
    console.log('  ⚠️ 무한 루프 감지!');
    break;
  }
}

console.log(`  ${flowPath.join(' → ')}`);

console.log('\n✅ 테스트 결과:');
const allOptionsGoBudget = testOptions.every(option => {
  const nextStep = welcomeStep?.nextStep ? welcomeStep.nextStep(option) : 'unknown';
  return nextStep === 'budget';
});

if (allOptionsGoBudget && customService?.is_active === false) {
  console.log('  🎉 성공! 모든 선택지가 동일한 플로우를 따릅니다.');
  console.log('  - "기타 문의"를 선택해도 budget으로 이동');
  console.log('  - customService 단계는 비활성화됨');
} else {
  console.log('  ⚠️ 문제 발견:');
  if (!allOptionsGoBudget) {
    console.log('    - 일부 선택지가 budget이 아닌 다른 단계로 이동');
  }
  if (customService?.is_active !== false) {
    console.log('    - customService가 여전히 활성화되어 있음');
  }
  console.log('\n  💡 해결 방법:');
  console.log('  1. 브라우저 콘솔에서 localStorage 초기화');
  console.log('  2. 페이지 새로고침');
  console.log('  3. 다시 테스트');
}

console.log('\n' + '='.repeat(50));
console.log('테스트 완료!\n');