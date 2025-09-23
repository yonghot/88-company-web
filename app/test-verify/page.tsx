'use client';

import { useState } from 'react';

export default function TestVerifyPage() {
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPhoneNumbers = [
    { label: '정상 - 010', value: '010-1234-5678' },
    { label: '정상 - 011', value: '011-234-5678' },
    { label: '정상 - 016', value: '016-234-5678' },
    { label: '정상 - 하이픈 없이', value: '01012345678' },
    { label: '오류 - 잘못된 prefix', value: '012-3456-7890' },
    { label: '오류 - 너무 짧음', value: '010-123' },
    { label: '오류 - 너무 김', value: '010-1234-56789' },
  ];

  const testVerify = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: phone
        })
      });

      const data = await response.json();
      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    setLoading(false);
  };

  const validatePhone = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    const isValidFormat = /^(010|011|016|017|018|019)\d{7,8}$/.test(cleaned) && cleaned.length === 11;
    return {
      cleaned,
      isValid: isValidFormat,
      pattern: '/^(010|011|016|017|018|019)\\d{7,8}$/'
    };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-cyan-400">
          📱 Verify API 테스트 페이지
        </h1>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">환경 정보</h2>
          <div className="font-mono text-sm space-y-1">
            <div>URL: {typeof window !== 'undefined' ? window.location.href : ''}</div>
            <div>시간: {new Date().toLocaleString('ko-KR')}</div>
            <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : ''}</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">빠른 테스트</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {testPhoneNumbers.map((test, idx) => (
              <button
                key={idx}
                onClick={() => setPhone(test.value)}
                className="text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                <div className="text-sm font-medium">{test.label}</div>
                <div className="text-xs text-gray-400 font-mono">{test.value}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">수동 테스트</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">전화번호 입력</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="010-1234-5678"
              />
            </div>

            {phone && (
              <div className="p-3 bg-gray-700 rounded text-sm">
                <h3 className="font-semibold mb-2">클라이언트 검증 결과:</h3>
                <div className="font-mono space-y-1">
                  <div>입력값: {phone}</div>
                  <div>정제값: {validatePhone(phone).cleaned}</div>
                  <div>유효성: {validatePhone(phone).isValid ? '✅ 유효' : '❌ 무효'}</div>
                  <div>패턴: {validatePhone(phone).pattern}</div>
                </div>
              </div>
            )}

            <button
              onClick={testVerify}
              disabled={loading || !phone}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              {loading ? '테스트 중...' : '테스트 실행'}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">API 응답 결과</h2>
            <div className="bg-gray-900 p-4 rounded overflow-x-auto">
              <pre className="text-xs font-mono">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}