#!/usr/bin/env node

import { program } from 'commander';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env.local') });

interface TestModule {
  name: string;
  description: string;
  test: () => Promise<void>;
}

const testModules: TestModule[] = [
  {
    name: 'environment',
    description: 'Environment configuration test',
    test: async () => {
      console.log('🧪 Testing Environment Configuration...\n');

      const requiredEnvVars = [
        'SMS_PROVIDER',
        'ADMIN_PASSWORD'
      ];

      const optionalEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NHN_APP_KEY',
        'NHN_SECRET_KEY',
        'NHN_SEND_NO',
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_PHONE_NUMBER',
        'ALIGO_USER_ID',
        'ALIGO_API_KEY',
        'ALIGO_SEND_NO',
        'SHOW_DEMO_CODE'
      ];

      console.log('Required Environment Variables:');
      for (const varName of requiredEnvVars) {
        const value = process.env[varName];
        const status = value ? '✅' : '❌';
        console.log(`  ${status} ${varName}: ${value ? '***' : 'Not set'}`);
      }

      console.log('\nOptional Environment Variables:');
      for (const varName of optionalEnvVars) {
        const value = process.env[varName];
        const status = value ? '✅' : '⚠️';
        console.log(`  ${status} ${varName}: ${value ? '***' : 'Not set'}`);
      }

      const provider = process.env.SMS_PROVIDER;
      if (provider && provider !== 'demo') {
        console.log(`\n📱 SMS Provider: ${provider}`);

        const providerConfig: Record<string, string[]> = {
          nhncloud: ['NHN_APP_KEY', 'NHN_SECRET_KEY', 'NHN_SEND_NO'],
          twilio: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'],
          aligo: ['ALIGO_USER_ID', 'ALIGO_API_KEY', 'ALIGO_SEND_NO']
        };

        const requiredVars = providerConfig[provider];
        if (requiredVars) {
          const missing = requiredVars.filter(v => !process.env[v]);
          if (missing.length > 0) {
            console.log(`⚠️  Missing ${provider} configuration: ${missing.join(', ')}`);
          } else {
            console.log(`✅ All ${provider} configuration present`);
          }
        }
      }
    }
  },
  {
    name: 'sms',
    description: 'SMS service functionality test',
    test: async () => {
      const { testSMSService } = await import('./test-sms');
      await testSMSService();
    }
  },
  {
    name: 'chat',
    description: 'Chat flow and questions test',
    test: async () => {
      const { testChatFlow } = await import('./test-chat-flow');
      await testChatFlow();
    }
  },
  {
    name: 'database',
    description: 'Database connectivity test',
    test: async () => {
      const { testDatabase } = await import('./test-database');
      await testDatabase();
    }
  },
  {
    name: 'verification',
    description: 'Verification service test',
    test: async () => {
      const { testVerification } = await import('./test-verification');
      await testVerification();
    }
  },
  {
    name: 'admin',
    description: 'Admin authentication test',
    test: async () => {
      const { testAdminAuth } = await import('./test-admin-auth');
      await testAdminAuth();
    }
  }
];

program
  .name('test-runner')
  .description('88 Company unified test runner')
  .version('1.0.0');

program
  .command('all')
  .description('Run all tests')
  .action(async () => {
    console.log('🚀 Running all tests...\n');

    let passed = 0;
    let failed = 0;

    for (const module of testModules) {
      console.log(`\n📋 ${module.name.toUpperCase()} TEST`);
      console.log(`   ${module.description}`);
      console.log('   ' + '─'.repeat(40));

      try {
        await module.test();
        console.log(`   ✅ ${module.name} test passed`);
        passed++;
      } catch (error) {
        console.error(`   ❌ ${module.name} test failed:`, error);
        failed++;
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  });

program
  .command('test <module>')
  .description('Run specific test module')
  .action(async (moduleName: string) => {
    const module = testModules.find(m => m.name === moduleName);

    if (!module) {
      console.error(`❌ Unknown test module: ${moduleName}`);
      console.log('\nAvailable modules:');
      testModules.forEach(m => {
        console.log(`  - ${m.name}: ${m.description}`);
      });
      process.exit(1);
    }

    console.log(`🚀 Running ${module.name} test...\n`);

    try {
      await module.test();
      console.log(`\n✅ ${module.name} test passed`);
      process.exit(0);
    } catch (error) {
      console.error(`\n❌ ${module.name} test failed:`, error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List available test modules')
  .action(() => {
    console.log('📋 Available test modules:\n');
    testModules.forEach(m => {
      console.log(`  ${m.name.padEnd(15)} - ${m.description}`);
    });
  });

program.parse();