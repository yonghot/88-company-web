'use client';

import { ChatQuestion } from '@/lib/chat/dynamic-types';
import {
  GripVertical,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  List,
  AlignLeft,
  Hash,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface QuestionCardProps {
  question: ChatQuestion;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isDragging?: boolean;
  onEdit: (question: ChatQuestion) => void;
  onDelete: (step: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleActive?: (step: string) => void;
}

const typeIcons = {
  text: MessageSquare,
  textarea: AlignLeft,
  select: List,
  'quick-reply': Hash,
  verification: Shield
};

const typeColors = {
  text: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  textarea: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  select: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'quick-reply': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  verification: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

export default function QuestionCard({
  question,
  index,
  isFirst,
  isLast,
  isDragging = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleActive
}: QuestionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const Icon = typeIcons[question.type as keyof typeof typeIcons] || MessageSquare;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: question.is_active ? 1 : 0.6,
        y: 0,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`
        bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
        ${isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'}
        ${!question.is_active ? 'opacity-60' : ''}
        hover:shadow-lg transition-all duration-200
        overflow-hidden
      `}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* 드래그 핸들 */}
          <GripVertical className="w-5 h-5 text-gray-400 dark:text-gray-600 cursor-grab" />

          {/* 인덱스 번호 */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {index + 1}
            </span>
          </div>

          {/* 타입 배지 */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[question.type as keyof typeof typeColors] || typeColors.text}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{question.type}</span>
          </div>

          {/* Step ID */}
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
            #{question.step}
          </div>

          {/* 활성 상태 */}
          {onToggleActive && (
            <button
              onClick={() => onToggleActive(question.step)}
              className={`p-1.5 rounded-lg transition-colors ${
                question.is_active
                  ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                  : 'text-gray-400 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-800'
              }`}
              title={question.is_active ? '활성화됨' : '비활성화됨'}
            >
              {question.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="위로 이동"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="아래로 이동"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(question)}
            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="편집"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(question.step)}
            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2 leading-relaxed">
          {question.question}
        </h3>

        {/* 메타 정보 */}
        <div className="flex flex-wrap gap-3 mt-3">
          {question.placeholder && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Placeholder:</span>
              <span className="text-gray-600 dark:text-gray-300">{question.placeholder}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">다음:</span>
            <span className="text-gray-600 dark:text-gray-300">{question.next_step || 'complete'}</span>
          </div>
        </div>

        {/* 옵션 목록 (select 타입인 경우) */}
        {question.options && question.options.length > 0 && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">선택 옵션:</div>
            <div className="flex flex-wrap gap-2">
              {question.options.map((option, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-700"
                >
                  {option}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 유효성 검사 정보 (있는 경우) */}
        {question.validation && Object.keys(question.validation).length > 0 && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {showDetails ? '유효성 검사 숨기기 ▲' : '유효성 검사 보기 ▼'}
          </button>
        )}

        {showDetails && question.validation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
          >
            <pre className="text-xs text-gray-600 dark:text-gray-400">
              {JSON.stringify(question.validation, null, 2)}
            </pre>
          </motion.div>
        )}
      </div>

      {/* 플로우 연결선 (마지막 카드가 아닌 경우) */}
      {!isLast && (
        <div className="flex justify-center pb-2">
          <div className="w-0.5 h-6 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-600" />
        </div>
      )}
    </motion.div>
  );
}