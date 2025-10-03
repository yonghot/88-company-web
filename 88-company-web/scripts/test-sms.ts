import { SMSService } from '../lib/sms';

export async function testSMSService() {
  const provider = process.env.SMS_PROVIDER || 'demo';
  console.log(`Provider: ${provider}`);

  const smsService = SMSService.getInstance();
  const testPhone = '010-1234-5678';
  const testMessage = 'Test message from 88 Company';

  console.log(`Sending test SMS to ${testPhone}...`);
  const result = await smsService.sendSMS(testPhone, testMessage);
  console.log('Result:', result);

  if (!result.success) {
    throw new Error(`SMS failed: ${result.error}`);
  }

  // Demo mode doesn't return a code in SMS result
  // Use verification service for code testing

  return result;
}