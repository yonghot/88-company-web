import chalk from 'chalk';

const testCases = [
  { phone: '010-1234-5678', expected: 'success' },
  { phone: '01012345678', expected: 'success' },
  { phone: '010 1234 5678', expected: 'success' },
  { phone: '011-123-4567', expected: 'success' },
  { phone: '016-123-4567', expected: 'success' },
  { phone: '017-123-4567', expected: 'success' },
  { phone: '018-123-4567', expected: 'success' },
  { phone: '019-123-4567', expected: 'success' },
  { phone: '02-1234-5678', expected: 'fail' },
  { phone: '010123456', expected: 'fail' },
  { phone: '010-12-34567', expected: 'fail' },
  { phone: '', expected: 'fail' },
  { phone: undefined, expected: 'fail' },
];

async function testProductionAPI() {
  const baseURL = 'https://www.88-company.com';
  console.log(chalk.cyan.bold('🧪 프로덕션 API 테스트'));
  console.log(chalk.gray('='.repeat(60)));

  const results = [];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${baseURL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: testCase.phone
        })
      });

      const data = await response.json();
      const success = response.ok;
      const passed = (success && testCase.expected === 'success') ||
                      (!success && testCase.expected === 'fail');

      results.push({
        phone: testCase.phone,
        expected: testCase.expected,
        actual: success ? 'success' : 'fail',
        passed,
        status: response.status,
        error: data.error
      });

      console.log(
        passed ? chalk.green('✅') : chalk.red('❌'),
        `Phone: ${chalk.yellow(testCase.phone || 'undefined')}`,
        chalk.gray(`[${response.status}]`),
        passed ? '' : chalk.red(`Expected ${testCase.expected}, got ${success ? 'success' : 'fail'}`)
      );

      if (!success && data.error) {
        console.log(chalk.gray(`   Error: ${data.error}`));
      }

      // Rate limiting 방지
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(chalk.red(`❌ Test failed for ${testCase.phone}:`, error));
      results.push({
        phone: testCase.phone,
        expected: testCase.expected,
        actual: 'error',
        passed: false,
        error: error.message
      });
    }
  }

  console.log(chalk.gray('='.repeat(60)));
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(chalk.cyan.bold('📊 테스트 결과:'));
  console.log(chalk.green(`✅ 통과: ${passedCount}/${results.length}`));
  if (failedCount > 0) {
    console.log(chalk.red(`❌ 실패: ${failedCount}/${results.length}`));
    console.log(chalk.yellow('\n실패한 테스트:'));
    results.filter(r => !r.passed).forEach(r => {
      console.log(chalk.red(`  - ${r.phone}: Expected ${r.expected}, got ${r.actual}`));
    });
  }
}

testProductionAPI().catch(console.error);