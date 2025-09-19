'use client';

import { useState, useEffect } from 'react';
import { ChatQuestion } from '@/lib/chat/dynamic-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  MessageSquare,
  AlignLeft,
  List,
  Hash,
  Shield,
  AlertCircle
} from 'lucide-react';

interface QuestionEditModalProps {
  question: ChatQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: ChatQuestion) => void;
  existingSteps: string[];
}

const questionTypes = [
  { value: 'text', label: '짧은 텍스트', icon: MessageSquare, description: '한 줄 입력' },
  { value: 'textarea', label: '긴 텍스트', icon: AlignLeft, description: '여러 줄 입력' },
  { value: 'select', label: '선택지', icon: List, description: '옵션 선택' },
  { value: 'quick-reply', label: '빠른 응답', icon: Hash, description: '빠른 선택' },
  { value: 'verification', label: '인증', icon: Shield, description: '전화번호 인증' }
];

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

  useEffect(() => {
    if (question) {
      setFormData(question);
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

    if ((formData.type === 'select' || formData.type === 'quick-reply') &&
        (!formData.options || formData.options.length === 0)) {
      newErrors.options = '최소 하나 이상의 옵션을 입력해주세요';
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

  const handleOptionsChange = (value: string) => {
    const options = value
      .split('\n')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);
    setFormData({ ...formData, options: options.length > 0 ? options : undefined });
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {questionTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: type.value as ChatQuestion['type'] })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.type === type.value
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1 text-gray-700 dark:text-gray-300" />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {type.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
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

                {/* 플레이스홀더 */}
                {(formData.type === 'text' || formData.type === 'textarea') && (
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

                {/* 옵션 목록 */}
                {(formData.type === 'select' || formData.type === 'quick-reply') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      선택 옵션 * (한 줄에 하나씩)
                    </label>
                    <textarea
                      value={formData.options?.join('\n') || ''}
                      onChange={(e) => handleOptionsChange(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white transition-colors resize-none ${
                        errors.options
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 dark:border-gray-700 focus:ring-purple-500'
                      } focus:outline-none focus:ring-2`}
                      rows={5}
                      placeholder="옵션 1&#10;옵션 2&#10;옵션 3"
                    />
                    {errors.options && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.options}
                      </p>
                    )}
                    {formData.options && formData.options.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.options.map((opt, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm rounded-full"
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 다음 스텝 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    다음 스텝
                  </label>
                  <select
                    value={formData.next_step || ''}
                    onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  >
                    <option value="">자동 (다음 순서로)</option>
                    <option value="complete">완료</option>
                    {existingSteps
                      .filter(step => step !== formData.step)
                      .map(step => (
                        <option key={step} value={step}>
                          {step}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 고급 설정 */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    {showAdvanced ? '고급 설정 숨기기 ▲' : '고급 설정 보기 ▼'}
                  </button>

                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-4"
                    >
                      {/* 활성 상태 */}
                      <div>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            질문 활성화
                          </span>
                        </label>
                        <p className="mt-1 ml-8 text-xs text-gray-500 dark:text-gray-400">
                          비활성화하면 챗봇 플로우에서 이 질문을 건너뜁니다
                        </p>
                      </div>

                      {/* 유효성 검사 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          유효성 검사 (JSON)
                        </label>
                        <textarea
                          value={formData.validation ? JSON.stringify(formData.validation, null, 2) : ''}
                          onChange={(e) => handleValidationChange(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white font-mono text-sm transition-colors resize-none ${
                            errors.validation
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 dark:border-gray-700 focus:ring-purple-500'
                          } focus:outline-none focus:ring-2`}
                          rows={5}
                          placeholder='{"required": true, "minLength": 2}'
                        />
                        {errors.validation && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {errors.validation}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* 푸터 */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    저장
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