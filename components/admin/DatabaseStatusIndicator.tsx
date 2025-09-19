'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Cloud,
  HardDrive,
  Info
} from 'lucide-react';
import { realTimeQuestionService } from '@/lib/chat/real-time-question-service';

interface DatabaseStatusIndicatorProps {
  className?: string;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
type StorageType = 'supabase' | 'localStorage' | 'fileSystem';

export default function DatabaseStatusIndicator({ className = '' }: DatabaseStatusIndicatorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [storageType, setStorageType] = useState<StorageType>('localStorage');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkDatabaseStatus();
    const interval = setInterval(checkDatabaseStatus, 30000); // 30초마다 체크
    return () => clearInterval(interval);
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      // realTimeQuestionService를 통해 직접 상태 확인
      const isUsingSupabase = realTimeQuestionService.isUsingSupabase();

      if (isUsingSupabase) {
        setStatus('connected');
        setStorageType('supabase');
        setLastSync(new Date());
      } else {
        // API 엔드포인트를 통해 백업 확인
        try {
          const response = await fetch('/api/admin/db-status');

          if (response.ok) {
            const data = await response.json();
            if (data.status === 'connected') {
              setStatus('connected');
              setStorageType('supabase');
              setLastSync(new Date());
              return;
            }
          }
        } catch (apiError) {
          console.error('[DatabaseStatus] API check failed:', apiError);
        }

        setStatus('disconnected');
        setStorageType('localStorage');
      }
    } catch (error) {
      console.error('[DatabaseStatus] Check failed:', error);
      setStatus('error');
      setStorageType('localStorage');
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-yellow-500';
      case 'connecting': return 'text-blue-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return <Check className="w-4 h-4" />;
      case 'disconnected': return <AlertTriangle className="w-4 h-4" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <X className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStorageIcon = () => {
    switch (storageType) {
      case 'supabase': return <Cloud className="w-4 h-4" />;
      case 'localStorage': return <HardDrive className="w-4 h-4" />;
      case 'fileSystem': return <Database className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Supabase 연결됨';
      case 'disconnected': return '로컬 저장소 사용';
      case 'connecting': return '연결 중...';
      case 'error': return '연결 오류';
      default: return '알 수 없음';
    }
  };

  const getStorageText = () => {
    switch (storageType) {
      case 'supabase': return 'Supabase (영구 저장)';
      case 'localStorage': return 'localStorage (도메인 종속)';
      case 'fileSystem': return '파일 시스템';
      default: return '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
          transition-all duration-200 text-sm font-medium
          ${getStatusColor()}
        `}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        <Info className="w-3.5 h-3.5 opacity-50" />
      </button>

      <AnimatePresence>
        {showDetails && (
          <>
            {/* 배경 클릭 시 닫기 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDetails(false)}
            />

            {/* 상세 정보 팝업 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full mt-2 right-0 z-50 w-80 p-4 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800"
            >
              <div className="space-y-3">
                {/* 헤더 */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    데이터베이스 상태
                  </h3>
                  <button
                    onClick={checkDatabaseStatus}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="새로고침"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* 상태 정보 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">연결 상태</span>
                    <span className={`text-sm font-medium flex items-center gap-1 ${getStatusColor()}`}>
                      {getStatusIcon()}
                      {getStatusText()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">저장소 타입</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      {getStorageIcon()}
                      {getStorageText()}
                    </span>
                  </div>

                  {lastSync && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">마지막 동기화</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {lastSync.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* 경고 메시지 */}
                {storageType === 'localStorage' && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          주의: localStorage 사용 중
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                          도메인 변경 시 데이터가 초기화됩니다.
                          영구 저장을 위해 Supabase를 설정하세요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex gap-2">
                      <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">
                          연결 오류
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                          Supabase 연결에 실패했습니다.
                          환경 변수를 확인해주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {status === 'connected' && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex gap-2">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          정상 작동 중
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                          데이터가 Supabase에 안전하게 저장됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}