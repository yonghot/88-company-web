/**
 * 질문 설정 초기화 스크립트
 * localStorage에 저장된 커스텀 질문을 초기화합니다
 */

console.log('🔄 질문 설정 초기화 스크립트');
console.log('='.repeat(50));

// 브라우저 콘솔에서 실행할 수 있는 코드
const resetScript = `
// localStorage에서 질문 설정 초기화
localStorage.removeItem('chat_questions');
localStorage.removeItem('chat_questions_v2');
localStorage.setItem('questions_updated', Date.now().toString());

// customService가 비활성화되었는지 확인
const questions = JSON.parse(localStorage.getItem('chat_questions') || '[]');
const customService = questions.find(q => q.step === 'customService');
if (customService) {
  customService.is_active = false;
  localStorage.setItem('chat_questions', JSON.stringify(questions));
}

console.log('✅ 질문 설정이 초기화되었습니다.');
console.log('🔄 페이지를 새로고침하면 변경사항이 적용됩니다.');
location.reload();
`;

console.log('\n📋 브라우저 콘솔에서 실행할 코드:');
console.log('-'.repeat(50));
console.log(resetScript);
console.log('-'.repeat(50));

console.log('\n사용 방법:');
console.log('1. 브라우저에서 http://localhost:3000 열기');
console.log('2. F12 또는 개발자 도구 열기');
console.log('3. Console 탭 선택');
console.log('4. 위의 코드를 복사하여 붙여넣기');
console.log('5. Enter 키를 눌러 실행');

console.log('\n✅ 변경사항:');
console.log('- "기타 문의"를 선택해도 customService 단계를 건너뜀');
console.log('- 모든 선택지가 동일하게 budget 단계로 이동');
console.log('- customService 단계가 비활성화됨');

console.log('\n='.repeat(50));