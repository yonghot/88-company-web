import { config } from 'dotenv';
import chalk from 'chalk';

config({ path: '.env.local' });

async function testVerifyAPI() {
  const baseURL = process.env.NODE_ENV === 'production'
    ? 'https://88-company-web.vercel.app'
    : 'http://localhost:3000';

  console.log(chalk.cyan('🧪 Testing /api/verify endpoint...'));
  console.log(chalk.gray(`Base URL: ${baseURL}`));
  console.log('');

  const testCases = [
    {
      name: 'Valid phone number (010)',
      data: { action: 'send', phone: '010-1234-5678' },
      expected: 'success'
    },
    {
      name: 'Valid phone number without hyphens',
      data: { action: 'send', phone: '01012345678' },
      expected: 'success'
    },
    {
      name: 'Invalid phone number (wrong prefix)',
      data: { action: 'send', phone: '012-3456-7890' },
      expected: 'error'
    },
    {
      name: 'Invalid phone number (too short)',
      data: { action: 'send', phone: '010-123' },
      expected: 'error'
    },
    {
      name: 'Missing phone parameter',
      data: { action: 'send' },
      expected: 'error'
    },
    {
      name: 'Missing action parameter',
      data: { phone: '010-1234-5678' },
      expected: 'error'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(chalk.yellow(`📌 Test: ${testCase.name}`));
    console.log(chalk.gray(`   Data: ${JSON.stringify(testCase.data)}`));

    try {
      const response = await fetch(`${baseURL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });

      const result = await response.json();
      const isSuccess = response.ok;

      console.log(chalk.gray(`   Status: ${response.status}`));
      console.log(chalk.gray(`   Response: ${JSON.stringify(result).substring(0, 100)}...`));

      if (testCase.expected === 'success' && isSuccess) {
        console.log(chalk.green(`   ✅ PASSED`));
        passed++;
      } else if (testCase.expected === 'error' && !isSuccess) {
        console.log(chalk.green(`   ✅ PASSED (Expected error)`));
        passed++;
      } else {
        console.log(chalk.red(`   ❌ FAILED`));
        console.log(chalk.red(`      Expected: ${testCase.expected}, Got: ${isSuccess ? 'success' : 'error'}`));
        failed++;
      }
    } catch (error) {
      console.log(chalk.red(`   ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`));
      failed++;
    }

    console.log('');
  }

  console.log(chalk.cyan('📊 Test Results:'));
  console.log(chalk.green(`   Passed: ${passed}`));
  console.log(chalk.red(`   Failed: ${failed}`));
  console.log(chalk.yellow(`   Total: ${passed + failed}`));

  if (failed === 0) {
    console.log(chalk.green.bold('\n✨ All tests passed!'));
  } else {
    console.log(chalk.red.bold(`\n❌ ${failed} test(s) failed`));
    process.exit(1);
  }
}

testVerifyAPI().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});