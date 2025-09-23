import chalk from 'chalk';

const testCases = [
  { phone: '010-1234-5678', expected: true },
  { phone: '01012345678', expected: true },
  { phone: '010 1234 5678', expected: true },
  { phone: '011-1234-5678', expected: true },
  { phone: '016-1234-5678', expected: true },
  { phone: '017-1234-5678', expected: true },
  { phone: '018-1234-5678', expected: true },
  { phone: '019-1234-5678', expected: true },
  { phone: '02-1234-5678', expected: false },
  { phone: '010123456', expected: false },
  { phone: '010-12-34567', expected: false },  // This should fail
  { phone: '010-1234-567', expected: false },  // Too short
  { phone: '010-1234-56789', expected: false },  // Too long
  { phone: '', expected: false },
];

function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  // 정확히 11자리이고 올바른 접두사로 시작하는지 확인
  const isValidPhone = cleanPhone.length === 11 &&
                      /^(010|011|016|017|018|019)/.test(cleanPhone);

  return isValidPhone;
}

console.log(chalk.cyan.bold('🧪 전화번호 검증 로직 테스트'));
console.log(chalk.gray('='.repeat(60)));

let passCount = 0;
let failCount = 0;

for (const testCase of testCases) {
  const result = validatePhone(testCase.phone);
  const passed = result === testCase.expected;

  if (passed) {
    passCount++;
    console.log(
      chalk.green('✅'),
      chalk.yellow(testCase.phone || '(empty)'),
      chalk.gray(`→ ${result ? 'valid' : 'invalid'}`)
    );
  } else {
    failCount++;
    console.log(
      chalk.red('❌'),
      chalk.yellow(testCase.phone || '(empty)'),
      chalk.gray(`→ ${result ? 'valid' : 'invalid'}`),
      chalk.red(`(expected ${testCase.expected ? 'valid' : 'invalid'})`)
    );
  }
}

console.log(chalk.gray('='.repeat(60)));
console.log(chalk.cyan.bold('📊 결과:'));
console.log(chalk.green(`✅ 통과: ${passCount}/${testCases.length}`));
if (failCount > 0) {
  console.log(chalk.red(`❌ 실패: ${failCount}/${testCases.length}`));
}