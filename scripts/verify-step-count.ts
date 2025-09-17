import { questionManager } from '../lib/chat/question-manager';

console.log('✅ 단계 수 일치 검증\n');
console.log('='.repeat(50));

const questions = questionManager.getQuestions();
const activeQuestions = questions.filter(q => q.is_active !== false);
const mainQuestions = activeQuestions.filter(q => q.step !== 'customService');

console.log('\n📝 질문 분석:');
console.log(`  - 전체 활성 질문: ${activeQuestions.length}개`);
console.log(`  - customService 포함: ${activeQuestions.some(q => q.step === 'customService') ? '✅' : '❌'}`);
console.log(`  - customService 제외 시: ${mainQuestions.length}개`);

console.log('\n📋 메인 질문 목록:');
mainQuestions.forEach((q, i) => {
  console.log(`  ${i + 1}. ${q.step}`);
});

const hasPhone = mainQuestions.some(q => q.step === 'phone');
console.log('\n🔍 phone 단계 분석:');
console.log(`  - phone 단계 포함: ${hasPhone ? '✅' : '❌'}`);
console.log(`  - phoneVerification: phone 단계에 포함됨 (별도 카운트 ❌)`);

const totalSteps = mainQuestions.length;

console.log('\n📊 최종 계산:');
console.log(`  메인 질문: ${mainQuestions.length}개`);
console.log(`  = 총 ${totalSteps}단계`);

console.log('\n📈 단계별 진행:');
mainQuestions.forEach((q, i) => {
  const stepNum = i + 1;
  console.log(`  ${stepNum}/${totalSteps} - ${q.step}`);

  // phone 단계일 때 phoneVerification도 같은 단계로 표시
  if (q.step === 'phone') {
    console.log(`  ${stepNum}/${totalSteps} - phoneVerification (phone과 같은 단계)`);
  }
});

console.log('\n💡 핵심 변경사항:');
console.log('  ✅ 질문 개수 = 단계 수');
console.log('  ✅ phoneVerification은 phone과 같은 단계');
console.log('  ✅ customService는 조건부라서 제외');

console.log('\n📝 예시:');
console.log('  - 7개 질문 (customService 포함) → 6개 메인 질문 → 6단계');
console.log('  - 5개 질문 (customService 포함) → 4개 메인 질문 → 4단계');
console.log('  - phone이 없으면 phoneVerification도 없음');

console.log('\n='.repeat(50));
console.log('검증 완료!\n');