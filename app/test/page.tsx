'use client';

import { useState, useEffect } from 'react';
import { questionManager } from '@/lib/chat/question-manager';
import { ChatQuestion } from '@/lib/chat/dynamic-types';

export default function TestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [questions, setQuestions] = useState<ChatQuestion[]>([]);

  useEffect(() => {
    loadQuestions();

    const handleUpdate = () => {
      loadQuestions();
      addTestResult('✅ 실시간 업데이트 이벤트 수신됨!');
    };

    window.addEventListener('questionsUpdated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'questions_updated' || e.key === 'chat_questions') {
        handleUpdate();
      }
    });

    return () => {
      window.removeEventListener('questionsUpdated', handleUpdate);
    };
  }, []);

  const loadQuestions = () => {
    const loaded = questionManager.getQuestions();
    setQuestions(loaded);
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  const testSaveQuestions = () => {
    addTestResult('📝 질문 저장 테스트 시작...');

    const testQuestion: ChatQuestion = {
      step: `test_${Date.now()}`,
      type: 'text',
      question: `테스트 질문 - ${new Date().toLocaleTimeString()}`,
      placeholder: '테스트 플레이스홀더',
      next_step: 'complete',
      is_active: true,
      order_index: questions.length
    };

    const updatedQuestions = [...questions, testQuestion];
    questionManager.saveQuestions(updatedQuestions);

    addTestResult('✅ 질문 저장 완료');
    loadQuestions();
  };

  const testFlowGeneration = () => {
    addTestResult('🔄 플로우 생성 테스트 시작...');

    const flow = questionManager.getFlow();
    const stepCount = Object.keys(flow).length;

    addTestResult(`✅ 플로우 생성 완료: ${stepCount}개 단계`);

    // 필수 단계 확인
    if (flow['phoneVerification'] && flow['complete']) {
      addTestResult('✅ 필수 단계 자동 추가 확인');
    } else {
      addTestResult('❌ 필수 단계 누락');
    }
  };

  const testClearAndReload = () => {
    addTestResult('🗑️ 초기화 테스트...');

    questionManager.saveQuestions([]);
    loadQuestions();

    setTimeout(() => {
      const reloaded = questionManager.getQuestions();
      if (reloaded.length > 0) {
        addTestResult('✅ 기본 질문 자동 로드 성공');
      } else {
        addTestResult('❌ 기본 질문 로드 실패');
      }
      loadQuestions();
    }, 100);
  };

  const testCrossBrowserSync = () => {
    addTestResult('🌐 크로스 브라우저 동기화 테스트...');
    addTestResult('💡 새 탭에서 /test 페이지를 열고 "질문 저장 테스트"를 클릭해보세요');
    addTestResult('➡️ 이 탭에서 실시간 업데이트 알림이 표시되어야 합니다');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">모듈 시스템 테스트 페이지</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">테스트 작업</h2>
            <div className="space-y-2">
              <button
                onClick={testSaveQuestions}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                질문 저장 테스트
              </button>
              <button
                onClick={testFlowGeneration}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                플로우 생성 테스트
              </button>
              <button
                onClick={testClearAndReload}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                초기화 및 재로드 테스트
              </button>
              <button
                onClick={testCrossBrowserSync}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                크로스 브라우저 동기화 안내
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">현재 질문 수: {questions.length}개</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {questions.map((q, i) => (
                  <div key={q.step} className="mb-1">
                    {i + 1}. {q.question}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">테스트 결과</h2>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">테스트를 실행하면 결과가 여기에 표시됩니다.</p>
              ) : (
                <div className="space-y-1 text-sm font-mono">
                  {testResults.map((result, i) => (
                    <div key={i} className="whitespace-pre-wrap">{result}</div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setTestResults([])}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              결과 지우기
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">테스트 가이드</h3>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>질문 저장 테스트: 새 질문을 추가하고 저장합니다</li>
            <li>플로우 생성 테스트: 저장된 질문으로 대화 플로우를 생성합니다</li>
            <li>초기화 테스트: 모든 질문을 지우고 기본값 복원을 확인합니다</li>
            <li>동기화 테스트: 다른 탭/브라우저와의 실시간 동기화를 확인합니다</li>
          </ol>
        </div>
      </div>
    </div>
  );
}