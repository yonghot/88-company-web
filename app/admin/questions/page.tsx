'use client';

import { useState, useEffect } from 'react';
import { ChatQuestion } from '@/lib/chat/dynamic-types';
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function QuestionsManagement() {
  const [questions, setQuestions] = useState<ChatQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ChatQuestion>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<ChatQuestion>>({
    step: '',
    type: 'text',
    question: '',
    placeholder: '',
    next_step: '',
    order_index: 0,
    is_active: true
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/questions');
      const data = await response.json();
      if (data.success) {
        setQuestions(data.data.questions || []);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (question: ChatQuestion) => {
    setEditingId(question.step);
    setEditForm(question);
  };

  const handleSaveEdit = async () => {
    const adminKey = prompt('관리자 비밀번호를 입력하세요:');
    if (!adminKey) return;

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        alert('질문이 수정되었습니다.');
        setEditingId(null);
        loadQuestions();
      } else {
        alert('수정 실패: 권한이 없거나 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (step: string) => {
    if (!confirm('정말 이 질문을 삭제하시겠습니까?')) return;

    const adminKey = prompt('관리자 비밀번호를 입력하세요:');
    if (!adminKey) return;

    try {
      const response = await fetch(`/api/admin/questions?step=${step}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      });

      if (response.ok) {
        alert('질문이 삭제되었습니다.');
        loadQuestions();
      } else {
        alert('삭제 실패: 권한이 없거나 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCreateNew = async () => {
    const adminKey = prompt('관리자 비밀번호를 입력하세요:');
    if (!adminKey) return;

    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify({
          ...newQuestion,
          order_index: questions.length
        })
      });

      if (response.ok) {
        alert('새 질문이 추가되었습니다.');
        setIsCreating(false);
        setNewQuestion({
          step: '',
          type: 'text',
          question: '',
          placeholder: '',
          next_step: '',
          order_index: 0,
          is_active: true
        });
        loadQuestions();
      } else {
        alert('추가 실패: 권한이 없거나 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to create:', error);
      alert('추가 중 오류가 발생했습니다.');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];

    const steps = newQuestions.map(q => q.step);
    await reorderQuestions(steps);
  };

  const handleMoveDown = async (index: number) => {
    if (index === questions.length - 1) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];

    const steps = newQuestions.map(q => q.step);
    await reorderQuestions(steps);
  };

  const reorderQuestions = async (steps: string[]) => {
    const adminKey = prompt('관리자 비밀번호를 입력하세요:');
    if (!adminKey) return;

    try {
      const response = await fetch('/api/admin/questions/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify({ steps })
      });

      if (response.ok) {
        loadQuestions();
      } else {
        alert('순서 변경 실패');
      }
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              챗봇 질문 관리
            </h1>
            <div className="flex gap-2">
              <button
                onClick={loadQuestions}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                새로고침
              </button>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                새 질문 추가
              </button>
            </div>
          </div>
        </div>

        {isCreating && (
          <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">새 질문 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Step ID (예: custom_question)"
                value={newQuestion.step}
                onChange={(e) => setNewQuestion({ ...newQuestion, step: e.target.value })}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <select
                value={newQuestion.type}
                onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="select">Select</option>
                <option value="quick-reply">Quick Reply</option>
                <option value="verification">Verification</option>
              </select>
              <textarea
                placeholder="질문 내용"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 md:col-span-2"
                rows={3}
              />
              <input
                type="text"
                placeholder="Placeholder (선택사항)"
                value={newQuestion.placeholder}
                onChange={(e) => setNewQuestion({ ...newQuestion, placeholder: e.target.value })}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                placeholder="다음 단계 (예: budget)"
                value={newQuestion.next_step}
                onChange={(e) => setNewQuestion({ ...newQuestion, next_step: e.target.value })}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                저장
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                취소
              </button>
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.step}
                className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {editingId === question.step ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.step}
                      onChange={(e) => setEditForm({ ...editForm, step: e.target.value })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Step ID"
                    />
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="quick-reply">Quick Reply</option>
                      <option value="verification">Verification</option>
                    </select>
                    <textarea
                      value={editForm.question}
                      onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      rows={3}
                      placeholder="질문 내용"
                    />
                    <input
                      type="text"
                      value={editForm.placeholder || ''}
                      onChange={(e) => setEditForm({ ...editForm, placeholder: e.target.value })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Placeholder"
                    />
                    <input
                      type="text"
                      value={editForm.next_step || ''}
                      onChange={(e) => setEditForm({ ...editForm, next_step: e.target.value })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                      placeholder="다음 단계"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        저장
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">
                            {question.step}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                            {question.type}
                          </span>
                          {question.next_step && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              → {question.next_step}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {question.question}
                        </p>
                        {question.placeholder && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Placeholder: {question.placeholder}
                          </p>
                        )}
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">옵션:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {question.options.map((option, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs border border-blue-200 dark:border-blue-800"
                                >
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === questions.length - 1}
                          className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(question)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(question.step)}
                          className="p-1 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}