import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { staticQuestionService } from '../lib/chat/static-question-service';

async function verify() {
  console.log('🔍 step/next_step 제거 검증 시작...\n');

  try {
    const questions = await staticQuestionService.loadQuestions();
    
    console.log(`✅ ${questions.length}개 질문 로드 성공\n`);

    if (questions.length > 0) {
      console.log('📋 첫 번째 질문 구조:');
      console.log(JSON.stringify(questions[0], null, 2));

      console.log('\n🔧 getChatFlow() 테스트...');
      const flow = staticQuestionService.getChatFlow();
      const flowKeys = Object.keys(flow);
      
      console.log(`✅ ${flowKeys.length}개 플로우 스텝 생성 성공`);
      console.log('\n플로우 키:', flowKeys.join(', '));

      const step1 = flow[flowKeys[0]];
      if (step1) {
        console.log('\n📌 첫 번째 스텝 샘플:');
        console.log('  ID:', step1.id);
        console.log('  InputType:', step1.inputType);
        const nextId = step1.nextStep();
        console.log('  NextStep:', nextId);
      }

      console.log('\n✅ 모든 검증 통과!');
    } else {
      console.log('⚠️  질문이 없습니다');
    }

  } catch (error: any) {
    console.error('❌ 검증 실패:', error.message);
    process.exit(1);
  }
}

verify();
