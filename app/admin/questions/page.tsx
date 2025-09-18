'use client';

import { useState, useEffect } from 'react';
import { ChatQuestion } from '@/lib/chat/dynamic-types';
import { realTimeQuestionService } from '@/lib/chat/real-time-question-service';
import { Plus, Edit2, Trash2, Save, X, ChevronUp, ChevronDown } from 'lucide-react';

export default function QuestionsManagement() {
  const [questions, setQuestions] = useState<ChatQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ChatQuestion>>({});

  useEffect(() => {
    loadQuestions();

    // RealTimeQuestionService의 subscription 사용
    const unsubscribe = realTimeQuestionService.subscribe(() => {
      console.log('[Admin] Questions updated, reloading...');
      loadQuestions();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadQuestions = () => {
    const loadedQuestions = realTimeQuestionService.getAllQuestions();
    setQuestions(loadedQuestions);
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
    realTimeQuestionService.saveQuestions(updatedQuestions);
    setEditingId(null);
    alert('질문이 수정되었습니다.');
  };

  const handleDelete = (step: string) => {
    if (!confirm('정말 이 질문을 삭제하시겠습니까?')) return;

    // 삭제할 질문 찾기
    const deletedIndex = questions.findIndex(q => q.step === step);
    const deletedQuestion = questions[deletedIndex];

    // 삭제된 질문을 참조하는 모든 질문의 next_step을 업데이트
    let updatedQuestions = questions.filter(q => q.step !== step);

    // 삭제된 질문을 가리키던 질문들의 next_step을 다음 질문으로 변경
    updatedQuestions = updatedQuestions.map(q => {
      if (q.next_step === step) {
        // 삭제된 질문의 next_step으로 대체하거나, 없으면 다음 순서의 질문으로
        const nextIndex = updatedQuestions.findIndex(uq => uq.order_index > q.order_index);
        const nextQuestion = nextIndex !== -1 ? updatedQuestions[nextIndex] : null;

        return {
          ...q,
          next_step: deletedQuestion?.next_step || nextQuestion?.step || 'complete'
        };
      }
      return q;
    });

    // order_index 재정렬
    updatedQuestions = updatedQuestions
      .sort((a, b) => a.order_index - b.order_index)
      .map((q, i) => ({ ...q, order_index: i }));

    setQuestions(updatedQuestions);
    realTimeQuestionService.saveQuestions(updatedQuestions);
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
    realTimeQuestionService.saveQuestions(newQuestions);
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
    realTimeQuestionService.saveQuestions(newQuestions);
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
    realTimeQuestionService.saveQuestions(updatedQuestions);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              챗봇 질문 관리
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
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as ChatQuestion['type'] })}
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

        <div className="p-6 border-t dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">💡 팁:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>질문을 수정하면 채팅봇에 실시간으로 자동 반영됩니다 (새로고침 불필요)</li>
              <li>순서 변경은 위/아래 화살표를 사용하세요</li>
              <li>필수 단계(phoneVerification, complete)는 자동으로 추가됩니다</li>
              <li>질문 개수, 순서, 내용이 모두 실시간으로 챗봇에 동기화됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}