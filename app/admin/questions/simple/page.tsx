'use client';

import { useState, useEffect } from 'react';
import { ChatQuestion } from '@/lib/chat/dynamic-types';
import { questionManager } from '@/lib/chat/question-manager';
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown } from 'lucide-react';

export default function SimpleQuestionsManagement() {
  const [questions, setQuestions] = useState<ChatQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ChatQuestion>>({});

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    const loadedQuestions = questionManager.getQuestions();
    setQuestions(loadedQuestions);
  };

  const saveQuestions = () => {
    questionManager.saveQuestions(questions);
    alert('질문이 저장되었습니다.');
  };

  const handleEdit = (question: ChatQuestion) => {
    setEditingId(question.step);
    setEditForm(question);
  };

  const handleSaveEdit = () => {
    if (!editForm.step) return;

    const updatedQuestions = questions.map(q =>
      q.step === editForm.step ? { ...q, ...editForm } : q
    );

    setQuestions(updatedQuestions);
    questionManager.saveQuestions(updatedQuestions);
    setEditingId(null);
    alert('질문이 수정되었습니다.');
  };

  const handleDelete = (step: string) => {
    if (!confirm('정말 이 질문을 삭제하시겠습니까?')) return;

    const updatedQuestions = questions.filter(q => q.step !== step);
    setQuestions(updatedQuestions);
    questionManager.saveQuestions(updatedQuestions);
    alert('질문이 삭제되었습니다.');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];

    // order_index 업데이트
    newQuestions.forEach((q, i) => {
      q.order_index = i;
    });

    setQuestions(newQuestions);
    questionManager.saveQuestions(newQuestions);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];

    // order_index 업데이트
    newQuestions.forEach((q, i) => {
      q.order_index = i;
    });

    setQuestions(newQuestions);
    questionManager.saveQuestions(newQuestions);
  };

  const handleAddQuestion = () => {
    const newQuestion: ChatQuestion = {
      step: `question_${Date.now()}`,
      type: 'text',
      question: '새로운 질문을 입력하세요',
      placeholder: '',
      next_step: 'complete',
      is_active: true,
      order_index: questions.length
    };

    const updatedQuestions = [...questions, newQuestion];
    setQuestions(updatedQuestions);
    questionManager.saveQuestions(updatedQuestions);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              챗봇 질문 관리 (단순화 버전)
            </h1>
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              새 질문 추가
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.step} className="border dark:border-gray-700 rounded-lg p-4">
                {editingId === question.step ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editForm.question || ''}
                      onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="질문"
                    />

                    <select
                      value={editForm.type || 'text'}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="text">텍스트</option>
                      <option value="textarea">긴 텍스트</option>
                      <option value="select">선택지</option>
                    </select>

                    {editForm.type === 'select' && (
                      <textarea
                        value={editForm.options?.join('\n') || ''}
                        onChange={(e) => setEditForm({ ...editForm, options: e.target.value.split('\n').filter(o => o.trim()) })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        placeholder="옵션 (한 줄에 하나씩)"
                        rows={4}
                      />
                    )}

                    <input
                      type="text"
                      value={editForm.placeholder || ''}
                      onChange={(e) => setEditForm({ ...editForm, placeholder: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="플레이스홀더"
                    />

                    <input
                      type="text"
                      value={editForm.next_step || ''}
                      onChange={(e) => setEditForm({ ...editForm, next_step: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="다음 스텝 ID"
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          스텝: {question.step} | 타입: {question.type} | 다음: {question.next_step || 'complete'}
                        </p>
                        {question.options && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            옵션: {question.options.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMoveUp(index)}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                          disabled={index === questions.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(question)}
                          className="p-2 text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(question.step)}
                          className="p-2 text-red-600 hover:text-red-700"
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