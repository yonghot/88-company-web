import { promises as fs } from 'fs';
import path from 'path';

console.log('🧪 전화번호 검증 개선 테스트');
console.log('=' .repeat(50));

// 테스트할 전화번호 목록
const testCases = [
  { input: '010-1234-5678', expected: true, description: '표준 형식 (하이픈 포함)' },
  { input: '01012345678', expected: true, description: '숫자만 11자리' },
  { input: '010 1234 5678', expected: true, description: '공백 포함' },
  { input: '011-234-5678', expected: true, description: '011 번호' },
  { input: '016-234-5678', expected: true, description: '016 번호' },
  { input: '017-234-5678', expected: true, description: '017 번호' },
  { input: '018-234-5678', expected: true, description: '018 번호' },
  { input: '019-234-5678', expected: true, description: '019 번호' },
  { input: '02-1234-5678', expected: false, description: '일반 전화번호 (02)' },
  { input: '070-1234-5678', expected: false, description: '인터넷 전화번호' },
  { input: '123456789', expected: false, description: '짧은 번호' },
  { input: '010123456789', expected: false, description: '12자리 (너무 김)' },
  { input: 'abc-1234-5678', expected: false, description: '문자 포함' },
  { input: '010-12-5678', expected: false, description: '중간 자리 부족' },
  { input: '010-1234-567', expected: false, description: '끝 자리 부족' },
  { input: '', expected: false, description: '빈 문자열' },
];

// 검증 함수 (enhanced-realtime-service.ts와 동일한 로직)
function validatePhone(value: string): boolean {
  const cleanedValue = value.replace(/[\s-]/g, '');
  const phoneRegex = /^01[0-9]{8,9}$/;
  return phoneRegex.test(cleanedValue);
}

// 포맷팅 함수 (ChatInput.tsx와 동일한 로직)
function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');

  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }

  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

console.log('\n📋 검증 테스트 결과:');
console.log('-'.repeat(50));

let passCount = 0;
let failCount = 0;

testCases.forEach(({ input, expected, description }) => {
  const result = validatePhone(input);
  const formatted = input ? formatPhoneNumber(input) : '';
  const status = result === expected ? '✅' : '❌';

  if (result === expected) passCount++;
  else failCount++;

  console.log(`${status} ${description}`);
  console.log(`   입력: "${input}" → 포맷: "${formatted}"`);
  console.log(`   예상: ${expected}, 결과: ${result}`);
  console.log();
});

console.log('='.repeat(50));
console.log(`\n📊 테스트 요약:`);
console.log(`   성공: ${passCount}/${testCases.length}`);
console.log(`   실패: ${failCount}/${testCases.length}`);
console.log(`   성공률: ${Math.round((passCount / testCases.length) * 100)}%`);

// UI 시뮬레이션 테스트
console.log('\n🎨 UI 시뮬레이션:');
console.log('-'.repeat(50));

const uiTestCases = [
  '0',
  '01',
  '010',
  '010-',
  '010-1',
  '010-12',
  '010-123',
  '010-1234',
  '010-1234-',
  '010-1234-5',
  '010-1234-56',
  '010-1234-567',
  '010-1234-5678'
];

console.log('사용자 입력 시뮬레이션:');
uiTestCases.forEach((input) => {
  const formatted = formatPhoneNumber(input);
  const isValid = validatePhone(formatted);
  const indicator = isValid ? '✅' : (input.length > 0 ? '⚠️' : '');

  console.log(`입력: "${input}" → 표시: "${formatted}" ${indicator}`);
});

console.log('\n✨ 테스트 완료!');

// 개선 사항 요약
console.log('\n📝 구현된 개선 사항:');
console.log('1. ✅ 전화번호 형식 검증 개선 (공백, 하이픈 자동 처리)');
console.log('2. ✅ 실시간 자동 포맷팅 (하이픈 자동 추가)');
console.log('3. ✅ 구체적인 에러 메시지 (올바른 형식 예시 제공)');
console.log('4. ✅ 시각적 피드백 (실시간 유효성 표시)');
console.log('5. ✅ 재입력 가능 (검증 실패 시 즉시 재입력)');