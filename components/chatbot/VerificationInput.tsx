'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Send, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface VerificationInputProps {
  phoneNumber: string;
  onVerify: (code: string) => void;
  disabled?: boolean;
}

export function VerificationInput({ phoneNumber, onVerify, disabled = false }: VerificationInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');
  const [demoCode, setDemoCode] = useState<string | undefined>();
  const [isVerified, setIsVerified] = useState(false);

  // Timer countdown effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Send verification code
  const sendVerificationCode = async () => {
    setIsSending(true);
    setError('');
    setDemoCode(undefined);
    
    try {
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
        // Show demo code in development
        if (data.demoCode) {
          setDemoCode(data.demoCode);
        }
      } else {
        setError(data.error || '인증번호 발송에 실패했습니다.');
      }
    } catch (error) {
      setError('인증번호 발송 중 오류가 발생했습니다.');
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

    setIsLoading(true);
    setError('');

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
        setIsVerified(true);
        setTimeout(() => {
          onVerify(code);
        }, 1000);
      } else {
        setError(data.error || '인증에 실패했습니다.');
      }
    } catch (error) {
      setError('인증 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-send verification code on mount
  useEffect(() => {
    sendVerificationCode();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 md:p-6 bg-[#0A0D13] border-t border-[#2E3544]">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-4">
          {/* Phone number display */}
          <div className="flex items-center justify-between p-3 bg-[#1A1F2E] rounded-xl border border-[#2E3544]">
            <div>
              <p className="text-xs text-gray-400 mb-1">인증받을 번호</p>
              <p className="text-sm font-medium text-gray-200">{phoneNumber}</p>
            </div>
            {timer > 0 && (
              <div className="text-sm text-[#00E5DB]">
                {formatTime(timer)}
              </div>
            )}
          </div>

          {/* Demo code display (development only) */}
          {demoCode && (
            <div className="p-3 bg-[#00E5DB]/10 rounded-xl border border-[#00E5DB]/30">
              <p className="text-xs text-[#00E5DB] mb-1">개발 모드 - 테스트용 인증번호</p>
              <p className="text-lg font-bold text-[#00E5DB]">{demoCode}</p>
            </div>
          )}

          {/* Verification input */}
          <div className="relative">
            <Input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 6) {
                  setCode(value);
                  setError('');
                }
              }}
              placeholder="인증번호 6자리 입력"
              disabled={disabled || isVerified}
              maxLength={6}
              className={cn(
                'w-full px-4 py-3 pr-24',
                'bg-[#252B3B] border border-[#2E3544] rounded-xl',
                'text-gray-200 placeholder:text-gray-500 text-center text-lg tracking-widest font-mono',
                'focus:border-[#00E5DB] focus:ring-2 focus:ring-[#00E5DB]/30',
                'transition-all duration-200',
                isVerified && 'border-green-500 bg-green-500/10'
              )}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && code.length === 6) {
                  handleVerify();
                }
              }}
            />
            
            {/* Verify button */}
            {!isVerified && (
              <button
                onClick={handleVerify}
                disabled={disabled || code.length !== 6 || isLoading}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg',
                  'bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-gray-900',
                  'hover:shadow-[0_0_15px_rgba(0,229,219,0.4)] active:scale-95',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200 text-sm font-medium'
                )}
              >
                {isLoading ? '확인 중...' : '확인'}
              </button>
            )}
            
            {/* Success checkmark */}
            {isVerified && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Check className="w-6 h-6 text-green-500 animate-pulse" />
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/30">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Success message */}
          {isVerified && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl border border-green-500/30">
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-400">인증이 완료되었습니다!</p>
            </div>
          )}

          {/* Resend button */}
          {!isVerified && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                인증번호를 받지 못하셨나요?
              </p>
              <button
                onClick={sendVerificationCode}
                disabled={timer > 0 || isSending}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
                  'border border-[#2E3544] bg-[#252B3B] text-gray-300',
                  'hover:border-[#00E5DB]/50 hover:bg-[#00E5DB]/10 hover:text-[#00E5DB]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-all duration-200'
                )}
              >
                <RefreshCw className={cn(
                  'w-3 h-3',
                  isSending && 'animate-spin'
                )} />
                {timer > 0 ? `${formatTime(timer)} 후 재발송` : '재발송'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}