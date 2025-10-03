'use client';

import { Database, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function QuestionsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            관리자 대시보드로 돌아가기
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Database className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              질문 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              챗봇 질문은 Supabase 데이터베이스에서 직접 관리합니다
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                📝 질문 수정 방법
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Supabase 대시보드에 로그인합니다</li>
                <li>Table Editor에서 <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">chat_questions</code> 테이블을 엽니다</li>
                <li>질문을 수정하거나 새로운 질문을 추가합니다</li>
                <li>저장하면 챗봇 페이지를 새로고침할 때 자동으로 반영됩니다</li>
              </ol>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                🗂️ 테이블 구조
              </h2>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div><strong>step</strong>: 질문 ID (고유값)</div>
                <div><strong>question</strong>: 질문 내용</div>
                <div><strong>type</strong>: 입력 타입 (text, textarea, select, quick-reply)</div>
                <div><strong>placeholder</strong>: 입력 안내 텍스트</div>
                <div><strong>options</strong>: 선택지 배열 (select, quick-reply 타입)</div>
                <div><strong>order_index</strong>: 질문 순서</div>
                <div><strong>is_active</strong>: 활성화 여부</div>
                <div><strong>next_step</strong>: 다음 단계 ID</div>
              </div>
            </div>

            {supabaseUrl && (
              <div className="flex justify-center">
                <a
                  href={`${supabaseUrl.replace('https://', 'https://app.supabase.com/project/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Supabase 대시보드 열기
                </a>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>참고:</strong> 질문을 수정한 후 챗봇 페이지를 새로고침하면 변경사항이 반영됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
