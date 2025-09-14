import { RateLimitEntry } from './types';

/**
 * SMS 발송 Rate Limiter
 * DDoS 공격 방지 및 비용 절감을 위한 발송 제한 관리
 */
export class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();

  // 설정값
  private readonly MAX_ATTEMPTS_PER_HOUR = 3; // 시간당 최대 시도 횟수
  private readonly MAX_ATTEMPTS_PER_DAY = 5;  // 일당 최대 시도 횟수
  private readonly BLOCK_DURATION_MINUTES = 60; // 차단 시간 (분)
  private readonly CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1시간마다 정리

  constructor() {
    // 주기적으로 오래된 엔트리 정리
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL_MS);
  }

  /**
   * 요청이 허용되는지 확인
   */
  isAllowed(phone: string): { allowed: boolean; reason?: string; retryAfter?: Date } {
    const normalized = this.normalizePhone(phone);
    const entry = this.entries.get(normalized);

    if (!entry) {
      return { allowed: true };
    }

    // 차단된 경우
    if (entry.blockedUntil && entry.blockedUntil > new Date()) {
      return {
        allowed: false,
        reason: '너무 많은 시도로 일시적으로 차단되었습니다',
        retryAfter: entry.blockedUntil
      };
    }

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 시간당 제한 확인
    if (entry.firstAttempt > hourAgo && entry.attempts >= this.MAX_ATTEMPTS_PER_HOUR) {
      return {
        allowed: false,
        reason: `시간당 최대 ${this.MAX_ATTEMPTS_PER_HOUR}회까지 시도 가능합니다`,
        retryAfter: new Date(entry.firstAttempt.getTime() + 60 * 60 * 1000)
      };
    }

    // 일당 제한 확인
    if (entry.firstAttempt > dayAgo && entry.attempts >= this.MAX_ATTEMPTS_PER_DAY) {
      return {
        allowed: false,
        reason: `하루 최대 ${this.MAX_ATTEMPTS_PER_DAY}회까지 시도 가능합니다`,
        retryAfter: new Date(entry.firstAttempt.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    return { allowed: true };
  }

  /**
   * 시도 기록
   */
  recordAttempt(phone: string): void {
    const normalized = this.normalizePhone(phone);
    const now = new Date();
    const entry = this.entries.get(normalized);

    if (!entry) {
      // 첫 시도
      this.entries.set(normalized, {
        phone: normalized,
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    } else {
      // 기존 엔트리 업데이트
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      if (entry.firstAttempt < hourAgo) {
        // 1시간이 지났으면 리셋
        entry.attempts = 1;
        entry.firstAttempt = now;
      } else {
        entry.attempts++;
      }

      entry.lastAttempt = now;

      // 너무 많은 시도인 경우 차단
      if (entry.attempts > this.MAX_ATTEMPTS_PER_HOUR * 2) {
        entry.blockedUntil = new Date(now.getTime() + this.BLOCK_DURATION_MINUTES * 60 * 1000);
      }
    }
  }

  /**
   * 성공 기록 (카운터 리셋)
   */
  recordSuccess(phone: string): void {
    const normalized = this.normalizePhone(phone);
    this.entries.delete(normalized);
  }

  /**
   * 차단 해제
   */
  unblock(phone: string): void {
    const normalized = this.normalizePhone(phone);
    const entry = this.entries.get(normalized);

    if (entry) {
      delete entry.blockedUntil;
      entry.attempts = 0;
    }
  }

  /**
   * 오래된 엔트리 정리
   */
  private cleanup(): void {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [phone, entry] of this.entries) {
      // 24시간이 지난 엔트리 삭제
      if (entry.lastAttempt < dayAgo) {
        this.entries.delete(phone);
      }
    }

    console.log(`🧹 Rate limiter cleanup: ${this.entries.size} entries remaining`);
  }

  /**
   * 전화번호 정규화
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  /**
   * 통계 정보 가져오기
   */
  getStats(): {
    totalEntries: number;
    blockedNumbers: number;
    recentAttempts: number;
  } {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    let blockedNumbers = 0;
    let recentAttempts = 0;

    for (const entry of this.entries.values()) {
      if (entry.blockedUntil && entry.blockedUntil > now) {
        blockedNumbers++;
      }
      if (entry.lastAttempt > hourAgo) {
        recentAttempts++;
      }
    }

    return {
      totalEntries: this.entries.size,
      blockedNumbers,
      recentAttempts
    };
  }
}

// 싱글톤 인스턴스
export const rateLimiter = new RateLimiter();