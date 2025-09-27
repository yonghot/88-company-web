'use client';

import { useState, useEffect } from 'react';
import { ChatQuestion } from '@/lib/chat/dynamic-types';
import { enhancedRealtimeService } from '@/lib/chat/enhanced-realtime-service';
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
  Search,
  ChevronLeft,
  Wifi,
  WifiOff,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';

import QuestionCard from '@/components/admin/QuestionCard';
import QuestionEditModal from '@/components/admin/QuestionEditModal';
import ChatPreview from '@/components/admin/ChatPreview';

interface SortableQuestionCardProps {
  question: ChatQuestion;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (question: ChatQuestion) => void;
  onDelete: (step: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleActive: (step: string) => void;
}

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
}: SortableQuestionCardProps) {
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
    <div ref={setNodeRef} style={style}>
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
        dragAttributes={attributes as unknown as Record<string, unknown>}
        dragListeners={listeners as unknown as Record<string, unknown>}
      />
    </div>
  );
}

interface ConnectionStatus {
  state: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  lastSync: Date | null;
  errorCount: number;
  isSupabaseEnabled: boolean;
}

export default function EnhancedQuestionsManagement() {
  const [questions, setQuestions] = useState<ChatQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<ChatQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ChatQuestion | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    state: 'disconnected',
    lastSync: null,
    errorCount: 0,
    isSupabaseEnabled: false
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Initializing questions page

    // 즉시 현재 질문 로드
    const currentQuestions = enhancedRealtimeService.getQuestions();
    if (currentQuestions.length > 0) {
      // Initial questions loaded
      setQuestions(currentQuestions);
    }
    // 빈 배열이면 상태를 변경하지 않음 (기존 데이터 유지)

    const unsubscribeQuestions = enhancedRealtimeService.subscribeToQuestions((updatedQuestions) => {
      // Questions updated - 빈 배열 체크
      if (updatedQuestions.length > 0) {
        setQuestions(updatedQuestions);
      } else {
        console.warn('[QuestionsPage] Received empty questions from service, ignoring update');
      }
    });

    const unsubscribeStatus = enhancedRealtimeService.subscribeToStatus((status) => {
      // Connection status updated
      setConnectionStatus(status);
    });

    // 비동기로 최신 데이터 로드
    enhancedRealtimeService.forceRefresh().then(() => {
      // Force refresh completed
      const refreshedQuestions = enhancedRealtimeService.getQuestions();
      if (refreshedQuestions.length > 0) {
        setQuestions(refreshedQuestions);
      }
    });

    return () => {
      unsubscribeQuestions();
      unsubscribeStatus();
    };
  }, []);

  // 페이지 언로드 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || isEditModalOpen || isSaving) {
        e.preventDefault();
        e.returnValue = '변경사항이 저장되지 않았습니다. 페이지를 나가시겠습니까?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isEditModalOpen, isSaving]);

  useEffect(() => {
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

  const handleDragStart = (event: DragStartEvent) => {
    // Drag start event
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.step === active.id);
      const newIndex = questions.findIndex(q => q.step === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex);

      // 빈 배열 체크
      if (newQuestions.length === 0) {
        console.error('[QuestionsPage] DragEnd resulted in empty array, aborting');
        return;
      }

      newQuestions.forEach((q, i) => {
        q.order_index = i;
      });

      setQuestions(newQuestions);
      await saveQuestions(newQuestions);
    }
  };

  const saveQuestions = async (questionsToSave: ChatQuestion[]) => {
    // 빈 배열 저장 방지
    if (questionsToSave.length === 0) {
      console.error('[QuestionsPage] Prevented saving empty questions array');
      alert('⚠️ 경고: 빈 질문 목록은 저장할 수 없습니다.\n데이터 손실 방지를 위해 차단되었습니다.');
      return;
    }

    setIsSaving(true);
    const success = await enhancedRealtimeService.saveQuestions(questionsToSave);
    setIsSaving(false);

    if (success) {
      setHasUnsavedChanges(false);
      showSuccess();
    } else {
      showError();
    }
  };

  const showSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const showError = () => {
    alert('저장에 실패했습니다. 다시 시도해주세요.');
  };

  const handleEdit = (question: ChatQuestion) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedQuestion: ChatQuestion) => {
    const updatedQuestions = questions.map(q =>
      q.step === updatedQuestion.step ? updatedQuestion : q
    );
    setQuestions(updatedQuestions);
    await saveQuestions(updatedQuestions);
  };

  const handleDelete = async (step: string) => {
    if (!confirm('정말 이 질문을 삭제하시겠습니까?')) return;

    const updatedQuestions = questions
      .filter(q => q.step !== step)
      .map((q, i) => ({ ...q, order_index: i }));

    setQuestions(updatedQuestions);
    await saveQuestions(updatedQuestions);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newQuestions = arrayMove(questions, index, index - 1);
    newQuestions.forEach((q, i) => { q.order_index = i; });
    setQuestions(newQuestions);
    await saveQuestions(newQuestions);
  };

  const handleMoveDown = async (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = arrayMove(questions, index, index + 1);
    newQuestions.forEach((q, i) => { q.order_index = i; });
    setQuestions(newQuestions);
    await saveQuestions(newQuestions);
  };

  const handleToggleActive = async (step: string) => {
    const updatedQuestions = questions.map(q =>
      q.step === step ? { ...q, is_active: !q.is_active } : q
    );
    setQuestions(updatedQuestions);
    await saveQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setIsEditModalOpen(true);
  };

  const handleReload = async () => {
    await enhancedRealtimeService.forceRefresh();
    showSuccess();
  };

  const handleBackup = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/questions/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          questions
        })
      });

      if (response.ok) {
        alert('백업이 성공적으로 생성되었습니다.');
      } else {
        alert('백업 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Backup error:', error);
      alert('백업 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('최신 백업으로 복구하시겠습니까? 현재 데이터는 덮어씌워집니다.')) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/questions/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'restore'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setQuestions(result.data);
          await saveQuestions(result.data);
          alert('백업에서 성공적으로 복구되었습니다.');
        }
      } else {
        alert('복구할 백업이 없거나 복구에 실패했습니다.');
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('복구 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus.state) {
      case 'connected':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-5 h-5 text-gray-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus.state) {
      case 'connected':
        return 'Supabase 실시간 동기화 활성';
      case 'connecting':
        return 'Supabase 연결 중...';
      case 'reconnecting':
        return `재연결 시도 중... (${connectionStatus.errorCount}회)`;
      case 'disconnected':
        return connectionStatus.isSupabaseEnabled ? '연결 끊김' : '로컬 모드';
      case 'error':
        return '연결 오류';
      default:
        return '알 수 없음';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/admin"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="w-5 h-5" />
              </a>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                질문 관리
              </h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                {getConnectionStatusIcon()}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getConnectionStatusText()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBackup}
                disabled={isSaving}
                className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-all"
                title="백업 생성"
              >
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={handleRestore}
                disabled={isSaving}
                className="p-2 text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-200 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 disabled:opacity-50 transition-all"
                title="백업 복구"
              >
                <Upload className="w-5 h-5" />
              </button>

              <button
                onClick={handleReload}
                disabled={isSaving}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-all"
                title="새로고침"
              >
                <RefreshCw className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden lg:inline">미리보기</span>
              </button>

              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-2 px-4 py-2 text-white bg-[#8800ff] rounded-lg hover:bg-[#7700dd] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">질문 추가</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {connectionStatus.state === 'error' && connectionStatus.errorCount > 3 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Supabase 연결에 문제가 있습니다. 로컬 모드로 전환되었습니다.
              {connectionStatus.lastSync && ` 마지막 동기화: ${connectionStatus.lastSync.toLocaleTimeString()}`}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="질문 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8800ff] focus:border-transparent"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#8800ff] focus:border-transparent"
          >
            <option value="all">모든 타입</option>
            <option value="text">텍스트</option>
            <option value="textarea">텍스트영역</option>
            <option value="select">선택</option>
          </select>
        </div>

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
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
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
            </div>
          </SortableContext>
        </DndContext>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery || filterType !== 'all'
                ? '검색 결과가 없습니다.'
                : '질문이 없습니다. 새로운 질문을 추가해주세요.'}
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            저장되었습니다!
          </motion.div>
        )}
      </AnimatePresence>

      <QuestionEditModal
        question={editingQuestion}
        isOpen={isEditModalOpen}
        onSave={(q) => {
          if (editingQuestion) {
            handleSaveEdit(q);
          } else {
            const newQuestions = [...questions, { ...q, order_index: questions.length }];
            setQuestions(newQuestions);
            saveQuestions(newQuestions);
          }
          setIsEditModalOpen(false);
        }}
        onClose={() => setIsEditModalOpen(false)}
        existingSteps={questions.map(q => q.step)}
      />

      <ChatPreview
        questions={questions}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}