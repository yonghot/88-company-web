import { VerificationService } from '../lib/sms';

export async function testVerification() {
  const service = VerificationService.getInstance();
  const testPhone = '010-1234-5678';

  console.log('Testing verification service...');
  console.log(`Phone: ${testPhone}`);

  console.log('\n1. Sending verification code...');
  const sendResult = await service.sendVerificationCode(testPhone);

  if (!sendResult.success) {
    throw new Error(`Failed to send code: ${sendResult.error}`);
  }

  console.log('✅ Code sent successfully');

  if (sendResult.demoCode) {
    console.log(`Demo code: ${sendResult.demoCode}`);

    console.log('\n2. Verifying code...');
    const verifyResult = await service.verifyCode(testPhone, sendResult.demoCode);

    if (!verifyResult.success) {
      throw new Error(`Failed to verify: ${verifyResult.error}`);
    }

    console.log('✅ Code verified successfully');
  } else {
    console.log('⚠️  No demo code available for verification test');
  }

  return sendResult;
}