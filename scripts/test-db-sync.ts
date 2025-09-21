import { enhancedRealtimeService } from '../lib/chat/enhanced-realtime-service';
import chalk from 'chalk';

async function testDatabaseSync() {
  console.log(chalk.blue('\n=== 데이터베이스 동기화 테스트 시작 ===\n'));

  const tests = [
    {
      name: '서비스 초기화 대기',
      run: async () => {
        console.log('Supabase 초기화 대기 중...');
        await enhancedRealtimeService.waitForInitialization();
        console.log('✅ 초기화 완료');
        return true;
      }
    },
    {
      name: '데이터베이스에서 질문 로드',
      run: async () => {
        const questions = enhancedRealtimeService.getQuestions();
        console.log(`로드된 질문 수: ${questions.length}`);

        if (questions.length === 0) {
          console.log(chalk.yellow('⚠️ 데이터베이스에 질문이 없습니다.'));
          return false;
        }

        questions.forEach((q, i) => {
          console.log(`  ${i + 1}. ${q.step}: ${q.question.substring(0, 50)}...`);
        });

        return questions.length > 0;
      }
    },
    {
      name: '챗봇 플로우 생성',
      run: async () => {
        const flow = enhancedRealtimeService.getChatFlow();
        const flowKeys = Object.keys(flow);

        console.log(`생성된 플로우 단계: ${flowKeys.length}`);
        console.log(`플로우 키: ${flowKeys.join(', ')}`);

        if (flowKeys.length === 0) {
          console.log(chalk.red('❌ 챗봇 플로우가 비어있습니다.'));
          return false;
        }

        return flowKeys.length > 0;
      }
    },
    {
      name: '전화번호 유효성 검사',
      run: async () => {
        const flow = enhancedRealtimeService.getChatFlow();
        const phoneStep = flow['phone'];

        if (!phoneStep) {
          console.log(chalk.yellow('⚠️ 전화번호 단계가 없습니다.'));
          return false;
        }

        const testCases = [
          { input: '010-1234-5678', expected: true },
          { input: '01012345678', expected: true },
          { input: '010 1234 5678', expected: true },
          { input: '02-1234-5678', expected: false },
          { input: '010-1234', expected: false },
          { input: '123456789', expected: false }
        ];

        console.log('전화번호 검증 테스트:');
        let allPassed = true;

        testCases.forEach(({ input, expected }) => {
          const result = phoneStep.validation ? phoneStep.validation(input) : false;
          const passed = result === expected;
          allPassed = allPassed && passed;

          console.log(`  ${input}: ${passed ? '✅' : '❌'} (예상: ${expected}, 결과: ${result})`);
        });

        return allPassed;
      }
    },
    {
      name: '총 단계 수 계산',
      run: async () => {
        const totalSteps = enhancedRealtimeService.getTotalSteps();
        const activeQuestions = enhancedRealtimeService.getActiveQuestions();

        console.log(`총 단계 수: ${totalSteps}`);
        console.log(`활성 질문 수: ${activeQuestions.length}`);

        const isCorrect = totalSteps === activeQuestions.length;

        if (!isCorrect) {
          console.log(chalk.red(`❌ 단계 수 불일치: ${totalSteps} !== ${activeQuestions.length}`));
          return false;
        }

        return true;
      }
    }
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (const test of tests) {
    console.log(chalk.cyan(`\n[테스트] ${test.name}`));
    try {
      const result = await test.run();
      if (result) {
        console.log(chalk.green(`✅ ${test.name} - 통과`));
        passedCount++;
      } else {
        console.log(chalk.red(`❌ ${test.name} - 실패`));
        failedCount++;
      }
    } catch (error) {
      console.log(chalk.red(`❌ ${test.name} - 오류: ${error}`));
      failedCount++;
    }
  }

  console.log(chalk.blue('\n=== 테스트 결과 ==='));
  console.log(chalk.green(`통과: ${passedCount}/${tests.length}`));
  if (failedCount > 0) {
    console.log(chalk.red(`실패: ${failedCount}/${tests.length}`));
  }

  const successRate = (passedCount / tests.length) * 100;
  console.log(`성공률: ${successRate.toFixed(1)}%`);

  process.exit(failedCount > 0 ? 1 : 0);
}

// 브라우저 환경 시뮬레이션
(global as any).window = {
  location: {
    href: 'http://localhost:3000'
  }
};
(global as any).document = {
  readyState: 'complete',
  addEventListener: () => {}
};

// 환경 변수 설정
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjizerpeyteokqhufqea.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXplcnBleXRlb2txaHVmcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxMTEsImV4cCI6MjA3MzI2NTExMX0.lpw_F9T7tML76NyCm1_6NJ6kyFdXtYsoUehK9ZhZT7s';

// 테스트 실행
testDatabaseSync().catch(console.error);