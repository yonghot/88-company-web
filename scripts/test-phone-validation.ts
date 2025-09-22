#!/usr/bin/env node

/**
 * 전화번호 검증 테스트 스크립트
 * 010으로 시작하는 번호만 통과해야 함
 */

console.log('🔍 전화번호 검증 로직 테스트 시작...\n');

// 테스트용 검증 함수 (실제 코드와 동일한 로직)
const validatePhoneNumber = (value: string): boolean => {
  const numbers = value.replace(/\D/g, '');
  return numbers.length === 11 && numbers.startsWith('010');
};

// 테스트 케이스
const testCases = [
  // 유효한 케이스 (010으로 시작하는 11자리)
  { input: '010-1234-5678', expected: true, description: '010 하이픈 포함' },
  { input: '01012345678', expected: true, description: '010 하이픈 없음' },
  { input: '010 1234 5678', expected: true, description: '010 공백 포함' },
  { input: '010.1234.5678', expected: true, description: '010 점 구분자' },
  { input: '010-9999-9999', expected: true, description: '010 최대값' },
  { input: '010-0000-0000', expected: true, description: '010 최소값' },

  // 무효한 케이스 (다른 번호로 시작)
  { input: '011-1234-5678', expected: false, description: '011로 시작 (거부)' },
  { input: '016-1234-5678', expected: false, description: '016으로 시작 (거부)' },
  { input: '017-1234-5678', expected: false, description: '017로 시작 (거부)' },
  { input: '018-1234-5678', expected: false, description: '018로 시작 (거부)' },
  { input: '019-1234-5678', expected: false, description: '019로 시작 (거부)' },
  { input: '012-1234-5678', expected: false, description: '012로 시작 (거부)' },
  { input: '015-1234-5678', expected: false, description: '015로 시작 (거부)' },

  // 무효한 케이스 (길이 오류)
  { input: '010-1234-567', expected: false, description: '10자리 (너무 짧음)' },
  { input: '010-1234-56789', expected: false, description: '12자리 (너무 김)' },
  { input: '010-123-5678', expected: false, description: '잘못된 중간 자리수' },
  { input: '010', expected: false, description: '3자리만 입력' },
  { input: '0101234', expected: false, description: '7자리만 입력' },

  // 특수 케이스
  { input: '02-1234-5678', expected: false, description: '일반전화 (거부)' },
  { input: '070-1234-5678', expected: false, description: '인터넷전화 (거부)' },
  { input: '+82-10-1234-5678', expected: false, description: '국제번호 형식 (거부)' },
  { input: '(010) 1234-5678', expected: true, description: '괄호 포함 (허용 - 숫자만 추출)' },
  { input: '', expected: false, description: '빈 문자열' },
  { input: 'abc-defg-hijk', expected: false, description: '문자만 입력' },
];

// 테스트 실행
let passCount = 0;
let failCount = 0;

testCases.forEach(({ input, expected, description }) => {
  const result = validatePhoneNumber(input);
  const passed = result === expected;

  if (passed) {
    console.log(`✅ PASS: ${description}`);
    console.log(`   입력: "${input}" → 결과: ${result}\n`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${description}`);
    console.log(`   입력: "${input}"`);
    console.log(`   기대값: ${expected}, 실제값: ${result}\n`);
    failCount++;
  }
});

// 결과 요약
console.log('━'.repeat(50));
console.log('\n📊 테스트 결과 요약:');
console.log(`✅ 통과: ${passCount}개`);
console.log(`❌ 실패: ${failCount}개`);
console.log(`📈 성공률: ${((passCount / testCases.length) * 100).toFixed(1)}%`);

if (failCount === 0) {
  console.log('\n🎉 모든 테스트를 통과했습니다! 010 전용 검증이 완벽하게 작동합니다.');
} else {
  console.log('\n⚠️ 일부 테스트가 실패했습니다. 검증 로직을 확인해주세요.');
  process.exit(1);
}