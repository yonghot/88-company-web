'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RecoverPage() {
  const [localData, setLocalData] = useState<any>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // localStorage에서 데이터 확인
    try {
      const chatQuestions = localStorage.getItem('chat_questions');
      const questionsUpdated = localStorage.getItem('questions_updated');
      const adminQuestions = localStorage.getItem('admin_questions_cache');

      const data = {
        chatQuestions: chatQuestions ? JSON.parse(chatQuestions) : null,
        lastUpdated: questionsUpdated,
        adminCache: adminQuestions ? JSON.parse(adminQuestions) : null,
        allKeys: Object.keys(localStorage).filter(key =>
          key.includes('question') || key.includes('chat') || key.includes('admin')
        )
      };

      setLocalData(data);

      if (data.chatQuestions || data.adminCache) {
        setStatus('✅ 브라우저에 캐시된 데이터를 발견했습니다!');
      } else {
        setStatus('⚠️ 브라우저 캐시에서 데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      setStatus('❌ 오류 발생: ' + error);
    }
  }, []);

  const recoverFromLocalStorage = async () => {
    if (!localData?.chatQuestions && !localData?.adminCache) {
      alert('복구할 데이터가 없습니다.');
      return;
    }

    const dataToRecover = localData.chatQuestions || localData.adminCache;

    try {
      const response = await fetch('/api/admin/questions/recover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: dataToRecover })
      });

      if (response.ok) {
        alert('✅ 데이터가 성공적으로 복구되었습니다!');
        setStatus('✅ 복구 완료!');
      } else {
        throw new Error('복구 실패');
      }
    } catch (error) {
      alert('❌ 복구 실패: ' + error);
    }
  };

  const exportData = () => {
    if (!localData) return;

    const blob = new Blob([JSON.stringify(localData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions_backup_${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📊 데이터 복구 도구</h1>

        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">브라우저 캐시 상태</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <p className="mb-4">{status}</p>

            {localData && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">발견된 localStorage 키:</h3>
                  <ul className="list-disc list-inside text-sm">
                    {localData.allKeys.map((key: string) => (
                      <li key={key}>{key}</li>
                    ))}
                  </ul>
                </div>

                {localData.chatQuestions && (
                  <div>
                    <h3 className="font-semibold mb-2">캐시된 질문 데이터:</h3>
                    <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(localData.chatQuestions, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={recoverFromLocalStorage}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!localData.chatQuestions && !localData.adminCache}
                  >
                    🔄 데이터베이스로 복구
                  </Button>
                  <Button
                    onClick={exportData}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    💾 JSON으로 내보내기
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">수동 복구 방법</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <ol className="list-decimal list-inside space-y-2">
              <li>브라우저 개발자 도구 열기 (F12)</li>
              <li>Console 탭에서 다음 명령 실행:</li>
              <li className="bg-gray-900 p-2 rounded font-mono text-sm">
                localStorage.getItem('chat_questions')
              </li>
              <li>출력된 데이터 복사</li>
              <li>/admin/questions 페이지에서 수동으로 재입력</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}