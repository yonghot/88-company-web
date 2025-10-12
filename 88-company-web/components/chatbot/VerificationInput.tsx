'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Check,
  AlertCircle,
  Shield,
  Clock,
  Smartphone,
  Lock
} from 'lucide-react';

interface VerificationInputProps {
  phoneNumber: string;
  onVerify: (code: string) => void;
  onBack?: () => void;  // 뒤로가기 콜백 추가
  disabled?: boolean;
}

export function VerificationInput({ phoneNumber, onVerify, onBack, disabled = false }: VerificationInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [demoCode, setDemoCode] = useState<string | undefined>();
  const [isVerified, setIsVerified] = useState(false);
  const [sendCount, setSendCount] = useState(0);
  const [verifyAttempts, setVerifyAttempts] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  const MAX_ATTEMPTS = 5;
  const MAX_SEND_COUNT = 10;

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // 자동 포커스
  useEffect(() => {
    if (inputRef.current && !isVerified) {
      inputRef.current.focus();
    }
  }, [isVerified]);

  // Send verification code
  const sendVerificationCode = async () => {
    if (sendCount >= MAX_SEND_COUNT) {
      setError('일일 발송 한도를 초과했습니다. 내일 다시 시도해주세요.');
      return;
    }

    setIsSending(true);
    setError('');
    setDemoCode(undefined);
    setVerifyAttempts(0);

    try {
      console.log('[VerificationInput] Sending SMS to:', phoneNumber);
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          phone: phoneNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTimer(180); // 3 minutes
        setSendCount(prev => prev + 1);

        // Show demo code in development
        if (data.demoCode) {
          setDemoCode(data.demoCode);
        }
      } else {
        // 에러 메시지 개선
        if (data.retryAfter) {
          setError(`${data.error} (${data.retryAfter}초 후 재시도 가능)`);
        } else {
          // 서버에서 message 필드도 함께 제공하는 경우 활용
          const errorMessage = data.message || data.error || '인증번호 발송에 실패했습니다.';
          setError(errorMessage);
        }
      }
    } catch (_error) {
      setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    } finally {
      setIsSending(false);
    }
  };

  // Verify the code
  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }

    if (verifyAttempts >= MAX_ATTEMPTS) {
      setError(`인증 시도 횟수(${MAX_ATTEMPTS}회)를 초과했습니다. 새로운 인증번호를 요청해주세요.`);
      return;
    }

    setIsLoading(true);
    setError('');
    setVerifyAttempts(prev => prev + 1);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          phone: phoneNumber,
          code: code
        })
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        console.log('[VerificationInput] ✅ 인증 성공! 1.5초 후 다음 단계로 이동');
        setIsVerified(true);

        // 성공 애니메이션
        setTimeout(() => {
          console.log('[VerificationInput] 🎯 onVerify 콜백 호출 시작');
          onVerify(code);
        }, 1500);
      } else {
        const remainingAttempts = MAX_ATTEMPTS - verifyAttempts;

        if (remainingAttempts > 0) {
          setError(
            `${data.error || '인증번호가 일치하지 않습니다.'} ` +
            `(남은 시도: ${remainingAttempts}회)`
          );
        } else {
          setError('인증 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.');
        }

        // 실패 시 입력창 초기화 및 포커스
        setCode('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (_error) {
      setError('인증 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-send verification code only if phone number is valid
  useEffect(() => {
    // React Strict Mode에서 중복 실행 방지
    if (hasInitialized.current) {
      return;
    }

    // 전화번호 형식 검증 (서버와 동일한 검증 로직)
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    const isValidFormat = /^(010|011|016|017|018|019)\d{7,8}$/.test(cleaned) && cleaned.length === 11;

    if (isValidFormat) {
      hasInitialized.current = true;
      sendVerificationCode();
    } else if (cleaned.length > 0) {
      // 형식이 올바르지 않으면 에러 메시지 표시 (빈 문자열일 때는 표시하지 않음)
      setError('올바른 휴대폰 번호 형식이 아닙니다. (010-0000-0000 형식)');
    }
  }, [phoneNumber]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  return (
    <div className="p-4 md:p-6 bg-[#0A0D13] border-t border-[#2E3544]">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-4">
          {/* 보안 안내 */}
          <div className="flex items-center gap-2 p-3 bg-[#1A1F2E]/50 rounded-xl border border-[#2E3544]/50">
            <Shield className="w-4 h-4 text-[#00E5DB] flex-shrink-0" />
            <p className="text-xs text-gray-400">
              본인 확인을 위한 SMS 인증입니다. 안전하게 처리됩니다.
            </p>
          </div>

          {/* Phone number display */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#1A1F2E] to-[#252B3B] rounded-xl border border-[#2E3544]">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#00E5DB]" />
              <div>
                <p className="text-xs text-gray-400 mb-1">인증받을 번호</p>
                <p className="text-sm font-medium text-gray-200">
                  {formatPhoneNumber(phoneNumber)}
                </p>
              </div>
            </div>

            {timer > 0 && !isVerified && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00E5DB]" />
                <span className="text-sm font-mono text-[#00E5DB]">
                  {formatTime(timer)}
                </span>
              </div>
            )}
          </div>

          {/* Demo code display (development only) */}
          {demoCode && (
            <div className="p-4 bg-gradient-to-r from-[#00E5DB]/10 to-[#00C7BE]/10 rounded-xl border border-[#00E5DB]/30 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-[#00E5DB]" />
                <p className="text-xs font-medium text-[#00E5DB]">개발 모드 - 테스트용 인증번호</p>
              </div>
              <p className="text-2xl font-bold text-[#00E5DB] tracking-widest text-center">
                {demoCode}
              </p>
            </div>
          )}

          {/* Verification input */}
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 6) {
                  setCode(value);
                  setError('');
                }
              }}
              placeholder="6자리 입력"
              disabled={disabled || isVerified || timer === 0}
              maxLength={6}
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]*"
              className={cn(
                'w-full px-3 sm:px-4 py-3 sm:py-4 pr-20 sm:pr-24',
                'bg-[#252B3B] border-2 rounded-xl',
                'text-gray-200 placeholder:text-gray-500 text-center text-lg sm:text-xl tracking-[0.3em] sm:tracking-[0.5em] font-mono',
                'transition-all duration-300',
                'focus:border-[#00E5DB] focus:ring-2 focus:ring-[#00E5DB]/30',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isVerified && 'border-green-500 bg-green-500/10',
                error && 'border-red-500/50',
                code.length === 6 && !error && 'border-[#00E5DB]/50'
              )}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && code.length === 6) {
                  handleVerify();
                }
              }}
              aria-label="인증번호 입력"
              aria-invalid={!!error}
              aria-describedby={error ? 'error-message' : undefined}
            />

            {/* Verify button */}
            {!isVerified && timer > 0 && (
              <button
                onClick={handleVerify}
                disabled={disabled || code.length !== 6 || isLoading || timer === 0}
                className={cn(
                  'absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg',
                  'bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-gray-900',
                  'hover:shadow-[0_0_20px_rgba(0,229,219,0.5)] active:scale-95',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
                  'transition-all duration-200 text-sm font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-[#00E5DB]/50'
                )}
                aria-label="인증번호 확인"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    확인 중
                  </span>
                ) : (
                  '확인'
                )}
              </button>
            )}

            {/* Success checkmark */}
            {isVerified && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-bounce">
                <Check className="w-8 h-8 text-green-500" />
              </div>
            )}

            {/* Timer expired message */}
            {timer === 0 && !isVerified && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#252B3B]/90 rounded-xl">
                <p className="text-sm text-gray-400">인증 시간이 만료되었습니다</p>
              </div>
            )}
          </div>

          {/* Progress indicator */}
          {code.length > 0 && !isVerified && (
            <div className="flex justify-center gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-200',
                    i < code.length
                      ? 'bg-[#00E5DB] scale-110'
                      : 'bg-gray-600'
                  )}
                />
              ))}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div
              id="error-message"
              className="space-y-3"
            >
              <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/30 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400 leading-tight">{error}</p>
              </div>

              {/* 전화번호 형식 오류 시 뒤로가기 버튼 표시 */}
              {error.includes('올바른 휴대폰 번호') && onBack && (
                <button
                  onClick={onBack}
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-all duration-200"
                >
                  ← 전화번호 다시 입력하기
                </button>
              )}
            </div>
          )}

          {/* Success message */}
          {isVerified && (
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 animate-fade-in">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-400">인증이 완료되었습니다!</p>
                <p className="text-xs text-green-400/70 mt-1">잠시 후 다음 단계로 이동합니다...</p>
              </div>
            </div>
          )}

          {/* Resend button and info */}
          {!isVerified && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-500">
                {sendCount > 0 && sendCount < MAX_SEND_COUNT && (
                  <span>발송 {sendCount}/{MAX_SEND_COUNT}회</span>
                )}
              </div>

              <button
                onClick={sendVerificationCode}
                disabled={timer > 0 || isSending || sendCount >= MAX_SEND_COUNT}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                  'border border-[#2E3544] bg-[#252B3B] text-gray-300',
                  'hover:border-[#00E5DB]/50 hover:bg-[#00E5DB]/10 hover:text-[#00E5DB]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-[#00E5DB]/30'
                )}
                aria-label="인증번호 재발송"
              >
                <RefreshCw className={cn(
                  'w-4 h-4',
                  isSending && 'animate-spin'
                )} />
                {timer > 0
                  ? `${formatTime(timer)} 후 재발송`
                  : sendCount >= MAX_SEND_COUNT
                  ? '발송 한도 초과'
                  : '인증번호 재발송'
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}