/**
 * 동적 플로우 디버깅 테스트
 * 질문이 order_index에 따라 동적으로 다음 질문으로 이동하는지 확인
 */

import { questionManager } from '../lib/chat/question-manager';

console.log('🔍 동적 플로우 디버깅 테스트');
console.log('='.repeat(50));

// 질문 로드
const questions = questionManager.getQuestions();
const flow = questionManager.getFlow();

console.log('\n📋 모든 질문 상세 정보:');
questions
  .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  .forEach((q, idx) => {
    console.log(`\n${idx + 1}. [${q.step}]`);
    console.log(`   - question: ${q.question.substring(0, 50)}...`);
    console.log(`   - order_index: ${q.order_index}`);
    console.log(`   - next_step: "${q.next_step}"`);
    console.log(`   - is_active: ${q.is_active}`);
    console.log(`   - type: ${q.type}`);
    if (q.options) {
      console.log(`   - options: [${q.options.slice(0, 2).join(', ')}...]`);
    }
  });

console.log('\n🎯 플로우 객체 분석:');
const stepOrder = ['welcome', 'budget', 'timeline', 'details', 'name', 'phone'];
stepOrder.forEach(step => {
  const flowStep = flow[step];
  if (flowStep) {
    console.log(`\n[${step}]`);
    console.log(`  - question: ${flowStep.question?.substring(0, 50)}...`);

    // nextStep 함수 테스트
    if (flowStep.nextStep) {
      if (step === 'welcome' && flowStep.options && flowStep.nextStep) {
        // welcome의 각 옵션에 대한 nextStep 테스트
        flowStep.options.forEach((option: string) => {
          const next = flowStep.nextStep!(option);
          console.log(`  - nextStep("${option}"): ${next}`);
        });
      } else if (flowStep.nextStep) {
        // 다른 단계는 value 없이 호출
        const next = flowStep.nextStep();
        console.log(`  - nextStep(): ${next}`);
      }
    }
  }
});

console.log('\n🔗 실제 플로우 시뮬레이션:');
let currentStep = 'welcome';
let path = [currentStep];
let iterations = 0;
const maxIterations = 15;

console.log('선택: "기타 문의"를 선택한 경우의 플로우');
while (currentStep && currentStep !== 'complete' && iterations < maxIterations) {
  const step = flow[currentStep];
  if (!step) {
    console.log(`  ❌ ${currentStep} 단계를 찾을 수 없음`);
    break;
  }

  let nextStep: string;
  if (currentStep === 'welcome') {
    // welcome에서 '기타 문의' 선택
    nextStep = step.nextStep ? step.nextStep('기타 문의') : 'unknown';
  } else {
    nextStep = step.nextStep ? step.nextStep() : 'unknown';
  }

  if (nextStep && nextStep !== currentStep) {
    path.push(nextStep);
    currentStep = nextStep;
  } else {
    break;
  }

  iterations++;
}

console.log(`플로우 경로: ${path.join(' → ')}`);

console.log('\n✅ 기대하는 동작:');
console.log('  1. 모든 welcome 선택지가 다음 활성 질문(budget)으로 이동');
console.log('  2. customService가 비활성화되어 건너뜀');
console.log('  3. 질문 순서는 order_index에 따름');
console.log('  4. 질문을 재정렬하면 플로우도 자동으로 변경됨');

console.log('\n='.repeat(50));
console.log('테스트 완료!\n');