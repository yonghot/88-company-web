'use client';

import { useState, useEffect } from 'react';
import { ChatQuestion } from '@/lib/chat/dynamic-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  MessageSquare,
  List,
  Shield,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Check,
  GripVertical
} from 'lucide-react';

interface QuestionEditModalProps {
  question: ChatQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: ChatQuestion) => void;
  existingSteps: string[];
}

const questionTypes = [
  { value: 'text', label: '텍스트 입력', icon: MessageSquare, description: '텍스트 입력 필드' },
  { value: 'select', label: '선택지', icon: List, description: '옵션 선택' },
  { value: 'verification', label: '인증', icon: Shield, description: '전화번호 인증' }
];

interface OptionItemProps {
  value: string;
  index: number;
  onUpdate: (index: number, value: string) => void;
  onDelete: (index: number) => void;
}

function OptionItem({ value, index, onUpdate, onDelete }: OptionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    if (editValue.trim()) {
      onUpdate(index, editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-750"
    >
      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
      <span className="mr-2 text-sm text-gray-500 dark:text-gray-400">
        {index + 1}.
      </span>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="flex-1 px-3 py-1 border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSave}
            className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-gray-900 dark:text-white">
            {value}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function QuestionEditModal({
  question,
  isOpen,
  onClose,
  onSave,
  existingSteps
}: QuestionEditModalProps) {
  const [formData, setFormData] = useState<ChatQuestion>({
    step: '',
    type: 'text',
    question: '',
    placeholder: '',
    options: undefined,
    validation: undefined,
    next_step: '',
    is_active: true,
    order_index: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (question) {
      // 기존 quick-reply와 textarea 타입을 자동 변환
      let updatedType = question.type;
      if (question.type === 'quick-reply') {
        updatedType = 'select';
      } else if (question.type === 'textarea') {
        updatedType = 'text';
      }

      setFormData({
        ...question,
        type: updatedType as ChatQuestion['type']
      });
      setShowAdvanced(!!question.validation);
    } else {
      setFormData({
        step: `question_${Date.now()}`,
        type: 'text',
        question: '',
        placeholder: '',
        options: undefined,
        validation: undefined,
        next_step: '',
        is_active: true,
        order_index: existingSteps.length
      });
    }
    setErrors({});
    setNewOption('');
  }, [question, existingSteps.length]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.question.trim()) {
      newErrors.question = '질문을 입력해주세요';
    }

    if (!formData.step.trim()) {
      newErrors.step = 'Step ID를 입력해주세요';
    } else if (existingSteps.includes(formData.step) && formData.step !== question?.step) {
      newErrors.step = '이미 사용중인 Step ID입니다';
    }

    if (formData.type === 'select' && (!formData.options || formData.options.length === 0)) {
      newErrors.options = '최소 하나 이상의 옵션을 추가해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      const currentOptions = formData.options || [];
      setFormData({
        ...formData,
        options: [...currentOptions, newOption.trim()]
      });
      setNewOption('');
      setErrors({ ...errors, options: '' });
    }
  };

  const handleUpdateOption = (index: number, value: string) => {
    if (formData.options) {
      const updatedOptions = [...formData.options];
      updatedOptions[index] = value;
      setFormData({ ...formData, options: updatedOptions });
    }
  };

  const handleDeleteOption = (index: number) => {
    if (formData.options) {
      const updatedOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: updatedOptions.length > 0 ? updatedOptions : undefined
      });
    }
  };

  const handleValidationChange = (value: string) => {
    try {
      const validation = value.trim() ? JSON.parse(value) : undefined;
      setFormData({ ...formData, validation });
      setErrors({ ...errors, validation: '' });
    } catch (e) {
      setErrors({ ...errors, validation: 'JSON 형식이 올바르지 않습니다' });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* 모달 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
            >
              <form onSubmit={handleSubmit}>
                {/* 헤더 */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {question ? '질문 수정' : '새 질문 추가'}
                    </h2>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* 컨텐츠 */}
                <div className="p-6 space-y-6">
                  {/* Step ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Step ID *
                    </label>
                    <input
                      type="text"
                      value={formData.step}
                      onChange={(e) => setFormData({ ...formData, step: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white transition-colors ${
                        errors.step
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-700 focus:ring-purple-500'
                      } focus:outline-none focus:ring-2`}
                      placeholder="예: welcome, budget, timeline"
                      disabled={!!question}
                    />
                    {errors.step && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.step}
                      </p>
                    )}
                  </div>

                  {/* 질문 타입 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      질문 타입 *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {questionTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, type: type.value as ChatQuestion['type'] })}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              formData.type === type.value
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <Icon className="w-6 h-6 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {type.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {type.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 질문 내용 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      질문 내용 *
                    </label>
                    <textarea
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white transition-colors resize-none ${
                        errors.question
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-700 focus:ring-purple-500'
                      } focus:outline-none focus:ring-2`}
                      rows={3}
                      placeholder="사용자에게 보여질 질문을 입력하세요"
                    />
                    {errors.question && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.question}
                      </p>
                    )}
                  </div>

                  {/* 플레이스홀더 (텍스트 입력일 때만) */}
                  {formData.type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        플레이스홀더
                      </label>
                      <input
                        type="text"
                        value={formData.placeholder || ''}
                        onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                        placeholder="입력 필드에 보여질 힌트 텍스트"
                      />
                    </div>
                  )}

                  {/* 선택지 관리 (선택지 타입일 때만) */}
                  {formData.type === 'select' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        선택 옵션 *
                      </label>

                      {/* 옵션 추가 입력 */}
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                          placeholder="새 옵션 입력 후 Enter 또는 추가 버튼 클릭"
                        />
                        <button
                          type="button"
                          onClick={handleAddOption}
                          disabled={!newOption.trim()}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          추가
                        </button>
                      </div>

                      {/* 옵션 목록 */}
                      {formData.options && formData.options.length > 0 ? (
                        <div className="space-y-2">
                          <AnimatePresence>
                            {formData.options.map((option, index) => (
                              <OptionItem
                                key={`${option}-${index}`}
                                value={option}
                                index={index}
                                onUpdate={handleUpdateOption}
                                onDelete={handleDeleteOption}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <List className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">
                            아직 추가된 옵션이 없습니다
                          </p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            위 입력란에서 옵션을 추가해주세요
                          </p>
                        </div>
                      )}

                      {errors.options && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.options}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 고급 설정 */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                    >
                      {showAdvanced ? '고급 설정 숨기기' : '고급 설정 보기'}
                    </button>

                    {showAdvanced && (
                      <div className="mt-4 space-y-4">
                        {/* 다음 단계 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            다음 단계 (Step ID)
                          </label>
                          <input
                            type="text"
                            value={formData.next_step || ''}
                            onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                            placeholder="자동 진행 시 비워두세요"
                          />
                        </div>

                        {/* 유효성 검사 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            유효성 검사 (JSON)
                          </label>
                          <textarea
                            value={formData.validation ? JSON.stringify(formData.validation, null, 2) : ''}
                            onChange={(e) => handleValidationChange(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white font-mono text-sm resize-none ${
                              errors.validation
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 dark:border-gray-700 focus:ring-purple-500'
                            } focus:outline-none focus:ring-2`}
                            rows={4}
                            placeholder='{"type": "phone", "pattern": "^01[0-9]..."}'
                          />
                          {errors.validation && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {errors.validation}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 푸터 */}
                <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {question ? '수정 완료' : '질문 추가'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}