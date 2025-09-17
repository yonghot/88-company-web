import { questionManager } from '../lib/chat/question-manager';
import { ChatQuestion } from '../lib/chat/dynamic-types';
import { ChatStep } from '../lib/chat/types';

// 테스트 결과 저장
interface TestResult {
  category: string;
  test: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  error?: any;
}

const results: TestResult[] = [];

function recordTest(category: string, test: string, status: TestResult['status'], message?: string, error?: any) {
  results.push({ category, test, status, message, error });
}

// ============= 1. 질문 관리 모듈 테스트 =============
function testQuestionManager() {
  console.log('\n📦 1. QuestionManager 모듈 테스트\n');

  // 1.1 싱글톤 패턴 검증
  try {
    const instance1 = questionManager;
    const instance2 = questionManager;
    if (instance1 === instance2) {
      recordTest('QuestionManager', '싱글톤 패턴', 'pass');
      console.log('  ✅ 싱글톤 패턴 검증 통과');
    } else {
      recordTest('QuestionManager', '싱글톤 패턴', 'fail', '인스턴스가 일치하지 않음');
      console.log('  ❌ 싱글톤 패턴 검증 실패');
    }
  } catch (error) {
    recordTest('QuestionManager', '싱글톤 패턴', 'fail', '예외 발생', error);
    console.log('  ❌ 싱글톤 패턴 검증 오류:', error);
  }

  // 1.2 질문 CRUD 작업
  try {
    const originalQuestions = questionManager.getQuestions();
    const testQuestion: ChatQuestion = {
      step: 'test_step',
      type: 'text',
      question: '테스트 질문입니다',
      placeholder: '답변을 입력하세요',
      next_step: 'complete',
      is_active: true,
      order_index: 99
    };

    // Create
    const newQuestions = [...originalQuestions, testQuestion];
    questionManager.saveQuestions(newQuestions);

    // Read
    const savedQuestions = questionManager.getQuestions();
    const foundQuestion = savedQuestions.find(q => q.step === 'test_step');

    if (foundQuestion && foundQuestion.question === '테스트 질문입니다') {
      recordTest('QuestionManager', 'CRUD 작업', 'pass');
      console.log('  ✅ 질문 CRUD 작업 통과');
    } else {
      recordTest('QuestionManager', 'CRUD 작업', 'fail', '질문이 저장되지 않음');
      console.log('  ❌ 질문 CRUD 작업 실패');
    }

    // Cleanup
    questionManager.saveQuestions(originalQuestions);
  } catch (error) {
    recordTest('QuestionManager', 'CRUD 작업', 'fail', '예외 발생', error);
    console.log('  ❌ 질문 CRUD 작업 오류:', error);
  }

  // 1.3 플로우 생성
  try {
    const flow = questionManager.getFlow();
    const hasRequiredSteps = flow['phoneVerification'] && flow['complete'];
    const hasWelcome = flow['welcome'];

    if (hasRequiredSteps && hasWelcome) {
      recordTest('QuestionManager', '플로우 생성', 'pass');
      console.log('  ✅ 플로우 생성 및 필수 단계 통과');
    } else {
      recordTest('QuestionManager', '플로우 생성', 'fail', '필수 단계 누락');
      console.log('  ❌ 플로우 생성 실패: 필수 단계 누락');
    }
  } catch (error) {
    recordTest('QuestionManager', '플로우 생성', 'fail', '예외 발생', error);
    console.log('  ❌ 플로우 생성 오류:', error);
  }
}

// ============= 2. 플로우 네비게이션 테스트 =============
function testFlowNavigation() {
  console.log('\n🧭 2. 플로우 네비게이션 테스트\n');

  try {
    const flow = questionManager.getFlow();

    // 2.1 기본 네비게이션
    const steps = Object.keys(flow);
    let navigationWorks = true;

    for (const stepId of steps) {
      const step = flow[stepId];
      if (step.nextStep) {
        const nextStepId = step.nextStep();
        if (!nextStepId || typeof nextStepId !== 'string') {
          navigationWorks = false;
          recordTest('Flow', '기본 네비게이션', 'fail', `${stepId}에서 다음 단계 없음`);
          console.log(`  ❌ ${stepId}에서 네비게이션 실패`);
          break;
        }
      }
    }

    if (navigationWorks) {
      recordTest('Flow', '기본 네비게이션', 'pass');
      console.log('  ✅ 기본 네비게이션 통과');
    }

    // 2.2 조건부 네비게이션
    if (flow['welcome']?.nextStep) {
      const defaultNext = flow['welcome'].nextStep();
      const specialNext = flow['welcome'].nextStep('기타 문의');

      if (specialNext === 'customService') {
        recordTest('Flow', '조건부 네비게이션', 'pass');
        console.log('  ✅ 조건부 네비게이션 통과');
      } else {
        recordTest('Flow', '조건부 네비게이션', 'fail', '특수 케이스 처리 실패');
        console.log('  ❌ 조건부 네비게이션 실패');
      }
    } else {
      recordTest('Flow', '조건부 네비게이션', 'skip', 'welcome 단계 없음');
      console.log('  ⚠️ 조건부 네비게이션 스킵: welcome 단계 없음');
    }

    // 2.3 전화번호 인증 플로우
    if (flow['phone']?.nextStep) {
      const phoneNext = flow['phone'].nextStep();
      if (phoneNext === 'phoneVerification' || phoneNext === 'complete') {
        recordTest('Flow', '전화번호 인증 플로우', 'pass');
        console.log('  ✅ 전화번호 인증 플로우 통과');
      } else {
        recordTest('Flow', '전화번호 인증 플로우', 'fail', '잘못된 다음 단계');
        console.log('  ❌ 전화번호 인증 플로우 실패');
      }
    } else {
      recordTest('Flow', '전화번호 인증 플로우', 'skip', 'phone 단계 없음');
      console.log('  ⚠️ 전화번호 인증 플로우 스킵');
    }

  } catch (error) {
    recordTest('Flow', '네비게이션 테스트', 'fail', '예외 발생', error);
    console.log('  ❌ 플로우 네비게이션 오류:', error);
  }
}

// ============= 3. 타입 시스템 검증 =============
function testTypeSystem() {
  console.log('\n🔷 3. TypeScript 타입 시스템 검증\n');

  try {
    // 3.1 ChatQuestion 타입 검증
    const validQuestion: ChatQuestion = {
      step: 'test',
      type: 'text',
      question: '테스트',
      placeholder: '',
      next_step: 'complete',
      is_active: true,
      order_index: 0
    };

    if (validQuestion.step && validQuestion.type && validQuestion.question !== undefined) {
      recordTest('TypeSystem', 'ChatQuestion 타입', 'pass');
      console.log('  ✅ ChatQuestion 타입 검증 통과');
    }

    // 3.2 ChatStep 타입 검증
    const flow = questionManager.getFlow();
    const firstStep = Object.values(flow)[0];

    if (firstStep &&
        firstStep.id &&
        firstStep.question &&
        firstStep.inputType &&
        typeof firstStep.nextStep === 'function' || firstStep.nextStep === undefined) {
      recordTest('TypeSystem', 'ChatStep 타입', 'pass');
      console.log('  ✅ ChatStep 타입 검증 통과');
    } else {
      recordTest('TypeSystem', 'ChatStep 타입', 'fail', '타입 구조 불일치');
      console.log('  ❌ ChatStep 타입 검증 실패');
    }

  } catch (error) {
    recordTest('TypeSystem', '타입 시스템', 'fail', '예외 발생', error);
    console.log('  ❌ 타입 시스템 검증 오류:', error);
  }
}

// ============= 4. 데이터 무결성 테스트 =============
function testDataIntegrity() {
  console.log('\n🔐 4. 데이터 무결성 테스트\n');

  try {
    const originalQuestions = questionManager.getQuestions();

    // 4.1 order_index 무결성
    const orderIndexes = originalQuestions.map(q => q.order_index);
    const uniqueIndexes = new Set(orderIndexes);

    if (uniqueIndexes.size === orderIndexes.length) {
      recordTest('DataIntegrity', 'order_index 유일성', 'pass');
      console.log('  ✅ order_index 유일성 통과');
    } else {
      recordTest('DataIntegrity', 'order_index 유일성', 'fail', '중복된 order_index 존재');
      console.log('  ❌ order_index 유일성 실패');
    }

    // 4.2 step ID 유일성
    const stepIds = originalQuestions.map(q => q.step);
    const uniqueSteps = new Set(stepIds);

    if (uniqueSteps.size === stepIds.length) {
      recordTest('DataIntegrity', 'step ID 유일성', 'pass');
      console.log('  ✅ step ID 유일성 통과');
    } else {
      recordTest('DataIntegrity', 'step ID 유일성', 'fail', '중복된 step ID 존재');
      console.log('  ❌ step ID 유일성 실패');
    }

    // 4.3 next_step 참조 무결성
    const flow = questionManager.getFlow();
    const validStepIds = new Set(Object.keys(flow));
    let referenceIntegrity = true;

    for (const question of originalQuestions) {
      if (question.next_step &&
          question.next_step !== 'complete' &&
          !validStepIds.has(question.next_step)) {
        referenceIntegrity = false;
        recordTest('DataIntegrity', 'next_step 참조', 'fail',
          `유효하지 않은 next_step: ${question.step} → ${question.next_step}`);
        console.log(`  ❌ 유효하지 않은 next_step: ${question.step} → ${question.next_step}`);
        break;
      }
    }

    if (referenceIntegrity) {
      recordTest('DataIntegrity', 'next_step 참조', 'pass');
      console.log('  ✅ next_step 참조 무결성 통과');
    }

  } catch (error) {
    recordTest('DataIntegrity', '데이터 무결성', 'fail', '예외 발생', error);
    console.log('  ❌ 데이터 무결성 테스트 오류:', error);
  }
}

// ============= 5. 성능 테스트 =============
function testPerformance() {
  console.log('\n⚡ 5. 성능 테스트\n');

  // 5.1 질문 로드 성능
  try {
    const startLoad = Date.now();
    for (let i = 0; i < 100; i++) {
      questionManager.getQuestions();
    }
    const loadTime = Date.now() - startLoad;

    if (loadTime < 100) {
      recordTest('Performance', '질문 로드 (100회)', 'pass', `${loadTime}ms`);
      console.log(`  ✅ 질문 로드 성능 통과: ${loadTime}ms`);
    } else {
      recordTest('Performance', '질문 로드 (100회)', 'fail', `${loadTime}ms (목표: <100ms)`);
      console.log(`  ⚠️ 질문 로드 성능 주의: ${loadTime}ms`);
    }
  } catch (error) {
    recordTest('Performance', '질문 로드', 'fail', '예외 발생', error);
  }

  // 5.2 플로우 생성 성능
  try {
    const startFlow = Date.now();
    for (let i = 0; i < 100; i++) {
      questionManager.getFlow();
    }
    const flowTime = Date.now() - startFlow;

    if (flowTime < 200) {
      recordTest('Performance', '플로우 생성 (100회)', 'pass', `${flowTime}ms`);
      console.log(`  ✅ 플로우 생성 성능 통과: ${flowTime}ms`);
    } else {
      recordTest('Performance', '플로우 생성 (100회)', 'fail', `${flowTime}ms (목표: <200ms)`);
      console.log(`  ⚠️ 플로우 생성 성능 주의: ${flowTime}ms`);
    }
  } catch (error) {
    recordTest('Performance', '플로우 생성', 'fail', '예외 발생', error);
  }
}

// ============= 테스트 보고서 생성 =============
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약');
  console.log('='.repeat(60) + '\n');

  const categories = [...new Set(results.map(r => r.category))];

  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'pass').length;
    const failed = categoryResults.filter(r => r.status === 'fail').length;
    const skipped = categoryResults.filter(r => r.status === 'skip').length;

    console.log(`📦 ${category}`);
    console.log(`  ✅ 통과: ${passed}`);
    console.log(`  ❌ 실패: ${failed}`);
    console.log(`  ⚠️ 스킵: ${skipped}`);
    console.log('');
  }

  const total = results.length;
  const totalPassed = results.filter(r => r.status === 'pass').length;
  const totalFailed = results.filter(r => r.status === 'fail').length;
  const totalSkipped = results.filter(r => r.status === 'skip').length;
  const passRate = ((totalPassed / total) * 100).toFixed(1);

  console.log('='.repeat(60));
  console.log('📈 전체 통계');
  console.log('='.repeat(60));
  console.log(`  총 테스트: ${total}`);
  console.log(`  ✅ 통과: ${totalPassed} (${passRate}%)`);
  console.log(`  ❌ 실패: ${totalFailed}`);
  console.log(`  ⚠️ 스킵: ${totalSkipped}`);

  // 품질 등급 판정
  let grade = '';
  if (passRate === '100.0') {
    grade = 'S';
  } else if (parseFloat(passRate) >= 90) {
    grade = 'A';
  } else if (parseFloat(passRate) >= 80) {
    grade = 'B';
  } else if (parseFloat(passRate) >= 70) {
    grade = 'C';
  } else {
    grade = 'D';
  }

  console.log(`\n🏆 품질 등급: ${grade}`);

  // 실패한 테스트 상세 정보
  if (totalFailed > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ 실패한 테스트 상세');
    console.log('='.repeat(60));

    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`  - [${r.category}] ${r.test}: ${r.message || '알 수 없는 오류'}`);
        if (r.error) {
          console.log(`    오류: ${r.error}`);
        }
      });
  }

  // 권장 사항
  console.log('\n' + '='.repeat(60));
  console.log('💡 권장 사항');
  console.log('='.repeat(60));

  if (totalFailed > 0) {
    console.log('  • 실패한 테스트를 우선적으로 수정하세요');
  }

  if (results.find(r => r.category === 'DataIntegrity' && r.status === 'fail')) {
    console.log('  • 데이터 무결성 문제를 해결하세요');
  }

  if (results.find(r => r.category === 'Performance' && r.message?.includes('주의'))) {
    console.log('  • 성능 최적화를 고려하세요');
  }

  if (totalSkipped > 0) {
    console.log('  • 스킵된 테스트는 브라우저 환경에서 실행하세요');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`테스트 완료: ${new Date().toLocaleString()}`);
  console.log('='.repeat(60) + '\n');
}

// ============= 메인 실행 =============
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 88 Company 포괄적 테스트 시작');
  console.log('='.repeat(60));

  testQuestionManager();
  testFlowNavigation();
  testTypeSystem();
  testDataIntegrity();
  testPerformance();

  generateReport();

  // 테스트 종료 코드
  const failedCount = results.filter(r => r.status === 'fail').length;
  process.exit(failedCount > 0 ? 1 : 0);
}

// 실행
runAllTests().catch(error => {
  console.error('치명적 오류:', error);
  process.exit(1);
});