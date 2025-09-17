import { questionManager } from '../lib/chat/question-manager';

console.log('✅ 진행도 단계 수정 검증\n');
console.log('='.repeat(50));

const questions = questionManager.getQuestions();
const activeQuestions = questions.filter(q => q.is_active !== false);
const mainQuestions = activeQuestions.filter(q => q.step !== 'customService');

console.log('\n📝 전체 질문 목록:');
activeQuestions.forEach((q, i) => {
  const isConditional = q.step === 'customService' ? ' (조건부 - 제외)' : '';
  console.log(`  ${i + 1}. [${q.step}]${isConditional}`);
});

console.log('\n📊 단계 계산 (customService 제외):');
console.log(`  - 전체 활성 질문: ${activeQuestions.length}개`);
console.log(`  - customService 제외: -1`);
console.log(`  - 메인 질문: ${mainQuestions.length}개`);

const hasPhoneStep = mainQuestions.some(q => q.step === 'phone');
console.log(`  - phone 단계 포함: ${hasPhoneStep ? '✅' : '❌'}`);

if (hasPhoneStep) {
  console.log(`  - phoneVerification 추가: +1`);
}

const totalSteps = mainQuestions.length + (hasPhoneStep ? 1 : 0);

console.log(`\n🎯 최종 계산:`);
console.log(`  ${mainQuestions.length}개 (메인 질문)`);
if (hasPhoneStep) {
  console.log(`  + 1 (phoneVerification)`);
}
console.log(`  = ${totalSteps}단계`);

console.log('\n📋 진행 단계:');
let stepNum = 1;
mainQuestions.forEach(q => {
  console.log(`  ${stepNum}/${totalSteps} - ${q.step}`);
  stepNum++;
});
if (hasPhoneStep) {
  console.log(`  ${stepNum}/${totalSteps} - phoneVerification`);
}

console.log('\n💡 특수 케이스:');
console.log('  - customService가 나타나도 진행도는 증가하지 않음');
console.log('  - "기타 문의" 선택 시에만 customService 표시');
console.log('  - phoneVerification은 phone 단계가 있을 때만 추가');

console.log('\n='.repeat(50));
console.log('검증 완료!\n');