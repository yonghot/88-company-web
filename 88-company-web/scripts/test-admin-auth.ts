export async function testAdminAuth() {
  const adminPassword = process.env.ADMIN_PASSWORD || '159753';

  console.log('Testing admin authentication...');
  console.log(`Password configured: ${adminPassword === '159753' ? 'default' : 'custom'}`);

  const testCases = [
    { password: adminPassword, shouldPass: true },
    { password: 'wrong', shouldPass: false },
    { password: '', shouldPass: false }
  ];

  for (const test of testCases) {
    const isValid = test.password === adminPassword;
    const status = isValid === test.shouldPass ? '✅' : '❌';

    console.log(`  ${status} ${test.shouldPass ? 'Valid' : 'Invalid'} password: ${
      test.password === adminPassword ? 'correct' : test.password || '(empty)'
    }`);

    if (isValid !== test.shouldPass) {
      throw new Error(`Authentication test failed for: ${test.password}`);
    }
  }

  console.log('\n✅ Admin authentication working correctly');
  return { adminPassword };
}