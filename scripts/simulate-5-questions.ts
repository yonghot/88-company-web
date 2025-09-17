import { questionManager } from '../lib/chat/question-manager';

console.log('🔬 5개 질문 시뮬레이션\n');
console.log('='.repeat(50));

// 현재 질문 백업
const originalQuestions = questionManager.getQuestions();

// 5개로 줄이기 (timeline과 details 제거 시뮬레이션)
const reducedQuestions = originalQuestions.filter(
  q => q.step !== 'timeline' && q.step !== 'details'
);

console.log('\n📝 시나리오: timeline과 details 삭제');
console.log('  삭제 전: 7개 질문');
console.log('  삭제 후: ' + reducedQuestions.length + '개 질문');

console.log('\n📋 남은 질문:');
reducedQuestions.forEach((q, i) => {
  console.log(`  ${i + 1}. ${q.step}`);
});

// customService 제외
const mainQuestions = reducedQuestions.filter(q => q.step !== 'customService');
const hasPhone = mainQuestions.some(q => q.step === 'phone');

console.log('\n📊 진행도 계산:');
console.log(`  - 전체 질문: ${reducedQuestions.length}개`);
console.log(`  - customService 제외: ${mainQuestions.length}개`);
console.log(`  - phone 포함: ${hasPhone ? '예' : '아니오'}`);
console.log(`  - phoneVerification 추가: ${hasPhone ? '+1' : '0'}`);

const totalSteps = mainQuestions.length + (hasPhone ? 1 : 0);
console.log(`\n🎯 결과: ${totalSteps}단계`);

console.log('\n📈 진행 단계:');
let step = 1;
mainQuestions.forEach(q => {
  console.log(`  ${step}/${totalSteps} - ${q.step}`);
  step++;
});
if (hasPhone) {
  console.log(`  ${step}/${totalSteps} - phoneVerification`);
}

console.log('\n💬 사용자 관점:');
console.log('  - "질문이 5개인데" → customService를 포함한 경우');
console.log('  - "질문이 4개인데" → customService를 제외한 경우');
console.log(`  - "왜 ${totalSteps}단계?" → phone이 있어서 phoneVerification 추가`);

console.log('\n='.repeat(50));
console.log('시뮬레이션 완료!\n');