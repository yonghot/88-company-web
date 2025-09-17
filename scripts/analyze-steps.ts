import { questionManager } from '../lib/chat/question-manager';

console.log('📊 진행도 단계 분석\n');
console.log('='.repeat(50));

const questions = questionManager.getQuestions();
const activeQuestions = questions.filter(q => q.is_active !== false);

console.log('\n📝 현재 질문 목록:');
activeQuestions.forEach((q, i) => {
  console.log(`  ${i + 1}. [${q.step}] ${q.question.substring(0, 30)}...`);
});

console.log(`\n📈 단계 계산:`);
console.log(`  - 활성 질문 수: ${activeQuestions.length}개`);

const hasPhoneStep = activeQuestions.some(q => q.step === 'phone');
console.log(`  - phone 단계 포함: ${hasPhoneStep ? '✅ 예' : '❌ 아니오'}`);

if (hasPhoneStep) {
  console.log(`  - phoneVerification 자동 추가: +1`);
}

const totalSteps = activeQuestions.length + (hasPhoneStep ? 1 : 0);
console.log(`\n💡 결과:`);
console.log(`  질문 ${activeQuestions.length}개 + ${hasPhoneStep ? 'phoneVerification 1개' : '추가 없음'} = 총 ${totalSteps}단계`);

console.log('\n📋 단계별 진행 시뮬레이션:');
let stepCount = 1;
activeQuestions.forEach((q) => {
  console.log(`  ${stepCount}/${totalSteps} - ${q.step}`);
  stepCount++;
});

if (hasPhoneStep) {
  console.log(`  ${stepCount}/${totalSteps} - phoneVerification (자동 추가)`);
}

console.log('\n='.repeat(50));
console.log('분석 완료\n');