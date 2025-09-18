'use client';

import { useState, useEffect } from 'react';
import { ChatQuestion } from '@/lib/chat/dynamic-types';
import { realTimeQuestionService } from '@/lib/chat/real-time-question-service';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Eye,
  Save,
  RefreshCw,
  Settings,
  Search,
  Filter,
  ChevronLeft
} from 'lucide-react';

// 컴포넌트 임포트
import QuestionCard from '@/components/admin/QuestionCard';
import QuestionEditModal from '@/components/admin/QuestionEditModal';
import ChatPreview from '@/components/admin/ChatPreview';
import DatabaseStatusIndicator from '@/components/admin/DatabaseStatusIndicator';

// Sortable 래퍼 컴포넌트
function SortableQuestionCard({
  question,
  index,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleActive
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: question.step });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <QuestionCard
        question={question}
        index={index}
        isFirst={isFirst}
        isLast={isLast}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onToggleActive={onToggleActive}
      />
    </div>
  );
}

export default function QuestionsManagement() {
  const [questions, setQuestions] = useState<ChatQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<ChatQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ChatQuestion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadQuestions();

    const unsubscribe = realTimeQuestionService.subscribe(() => {
      console.log('[Admin] Questions updated, reloading...');
      loadQuestions();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // 필터링 로직
    let filtered = questions;

    if (searchQuery) {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.step.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(q => q.type === filterType);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchQuery, filterType]);

  const loadQuestions = () => {
    const loadedQuestions = realTimeQuestionService.getAllQuestions();
    setQuestions(loadedQuestions);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.step === active.id);
      const newIndex = questions.findIndex(q => q.step === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);

      // order_index 업데이트
      newQuestions.forEach((q, i) => {
        q.order_index = i;
      });

      setQuestions(newQuestions);
      saveQuestions(newQuestions);
    }
  };

  const saveQuestions = async (questionsToSave: ChatQuestion[]) => {
    setIsSaving(true);
    await realTimeQuestionService.saveQuestions(questionsToSave);
    setIsSaving(false);
    showSuccess();
  };

  const showSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleEdit = (question: ChatQuestion) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedQuestion: ChatQuestion) => {
    const updatedQuestions = questions.map(q =>
      q.step === updatedQuestion.step ? updatedQuestion : q
    );
    setQuestions(updatedQuestions);
    saveQuestions(updatedQuestions);
  };

  const handleDelete = (step: string) => {
    if (!confirm('정말 이 질문을 삭제하시겠습니까?')) return;

    const updatedQuestions = questions
      .filter(q => q.step !== step)
      .map((q, i) => ({ ...q, order_index: i }));

    setQuestions(updatedQuestions);
    saveQuestions(updatedQuestions);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = arrayMove(questions, index, index - 1);
    newQuestions.forEach((q, i) => { q.order_index = i; });
    setQuestions(newQuestions);
    saveQuestions(newQuestions);
  };

  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = arrayMove(questions, index, index + 1);
    newQuestions.forEach((q, i) => { q.order_index = i; });
    setQuestions(newQuestions);
    saveQuestions(newQuestions);
  };

  const handleToggleActive = (step: string) => {
    const updatedQuestions = questions.map(q =>
      q.step === step ? { ...q, is_active: !q.is_active } : q
    );
    setQuestions(updatedQuestions);
    saveQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setIsEditModalOpen(true);
  };

  const handleReload = () => {
    loadQuestions();
    showSuccess();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/admin"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="관리자 대시보드로 돌아가기"
              >
                <ChevronLeft className="w-5 h-5" />
              </a>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                챗봇 질문 관리
              </h1>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full">
                {questions.length}개 질문
              </span>
            </div>
            <div className="flex items-center gap-3">
              <DatabaseStatusIndicator />
              <button
                onClick={handleReload}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                title="새로고침"
              >
                <RefreshCw className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">미리보기</span>
              </button>
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">새 질문</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="질문 검색..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">모든 타입</option>
                <option value="text">텍스트</option>
                <option value="textarea">긴 텍스트</option>
                <option value="select">선택지</option>
                <option value="quick-reply">빠른 응답</option>
                <option value="verification">인증</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredQuestions.map(q => q.step)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4 max-w-4xl mx-auto">
              <AnimatePresence mode="popLayout">
                {filteredQuestions.map((question, index) => (
                  <SortableQuestionCard
                    key={question.step}
                    question={question}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === filteredQuestions.length - 1}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>

        {/* 빈 상태 */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery || filterType !== 'all' ? '검색 결과가 없습니다' : '질문이 없습니다'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery || filterType !== 'all'
                ? '다른 검색어를 시도해보세요'
                : '첫 번째 질문을 추가하여 챗봇 플로우를 시작하세요'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                첫 질문 추가하기
              </button>
            )}
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400">전체 질문</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{questions.length}</div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400">활성 질문</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {questions.filter(q => q.is_active).length}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400">비활성 질문</div>
              <div className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                {questions.filter(q => !q.is_active).length}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500 dark:text-gray-400">평균 단계</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {questions.filter(q => q.is_active).length}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">💡 사용 팁</h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
              <li>• 질문을 드래그하여 순서를 변경할 수 있습니다</li>
              <li>• 모든 변경사항은 실시간으로 챗봇에 반영됩니다</li>
              <li>• 미리보기 기능으로 실제 챗봇 플로우를 테스트해보세요</li>
              <li>• 데이터베이스 상태 표시기로 저장 상태를 확인할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <QuestionEditModal
        question={editingQuestion}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        existingSteps={questions.map(q => q.step)}
      />

      <ChatPreview
        questions={questions.filter(q => q.is_active)}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* 성공 메시지 */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <Save className="w-4 h-4" />
            저장되었습니다
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}