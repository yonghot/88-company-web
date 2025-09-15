'use client';

import { useEffect, useState } from 'react';
import { ClientStorage } from '@/lib/storage/client-storage';

export function DebugProgressInfo() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDebugInfo = () => {
      const questions = ClientStorage.loadQuestions();
      const mainSteps = questions?.filter(q =>
        q.step !== 'phoneVerification' &&
        q.step !== 'complete' &&
        q.step !== 'customService'
      ) || [];

      setDebugInfo({
        totalQuestions: questions?.length || 0,
        mainSteps: mainSteps.length,
        questions: questions,
        localStorage: typeof window !== 'undefined' ? localStorage.getItem('admin_questions') : null
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);

    return () => clearInterval(interval);
  }, []);

  // Force show debug panel - provide defaults if debugInfo is null
  const safeDebugInfo = debugInfo || {
    totalQuestions: 0,
    mainSteps: 0,
    questions: null,
    localStorage: null
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-md z-50">
      <div className="font-bold mb-2">🔧 Debug Panel FORCED</div>
      <div>Total Questions: {safeDebugInfo.totalQuestions}</div>
      <div>Main Steps: {safeDebugInfo.mainSteps}</div>
      <div>LocalStorage: {safeDebugInfo.localStorage ? 'Has data' : 'Empty'}</div>
      <div>Status: {debugInfo ? 'Data Loaded' : 'No Data - Using Defaults'}</div>
      <button
        onClick={() => {
          localStorage.removeItem('admin_questions');
          window.location.reload();
        }}
        className="mt-2 bg-red-600 px-2 py-1 rounded text-xs"
      >
        Clear & Reload
      </button>
    </div>
  );
}