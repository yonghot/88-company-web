/**
 * SMS 비용 최적화 모듈
 * 중복 발송 방지, 일일 한도 관리, 비용 추적
 */
export class CostOptimizer {
  // 싱글톤 인스턴스
  private static instance: CostOptimizer;

  // 최근 발송 기록 (메모리 캐시)
  private recentSends: Map<string, Date> = new Map();

  // 일일 통계
  private dailyStats: {
    date: string;
    count: number;
    cost: number;
    failures: number;
  };

  // 설정값
  private readonly DUPLICATE_WINDOW_MINUTES = 5; // 중복 방지 시간 (분)
  private readonly DAILY_LIMIT = parseInt(process.env.SMS_DAILY_LIMIT || '100');
  private readonly MONTHLY_BUDGET = parseInt(process.env.SMS_MONTHLY_BUDGET || '100000'); // 원
  private readonly SMS_COST_KRW = 16; // 알리고 기준
  private readonly SMS_COST_USD = 0.0075; // Twilio 기준
  private readonly USD_TO_KRW = 1350; // 환율

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    this.dailyStats = {
      date: today,
      count: 0,
      cost: 0,
      failures: 0
    };

    // 매일 자정에 통계 리셋
    this.scheduleDailyReset();

    // 1시간마다 오래된 발송 기록 정리
    setInterval(() => this.cleanupOldRecords(), 60 * 60 * 1000);
  }

  static getInstance(): CostOptimizer {
    if (!CostOptimizer.instance) {
      CostOptimizer.instance = new CostOptimizer();
    }
    return CostOptimizer.instance;
  }

  /**
   * 발송 가능 여부 확인 (중복 체크)
   */
  canSend(phone: string): { allowed: boolean; reason?: string; waitTime?: number } {
    const normalizedPhone = this.normalizePhone(phone);

    // 1. 중복 발송 체크
    const lastSent = this.recentSends.get(normalizedPhone);
    if (lastSent) {
      const timeSinceLastSend = Date.now() - lastSent.getTime();
      const windowMs = this.DUPLICATE_WINDOW_MINUTES * 60 * 1000;

      if (timeSinceLastSend < windowMs) {
        const waitTime = Math.ceil((windowMs - timeSinceLastSend) / 1000); // 초 단위
        return {
          allowed: false,
          reason: `${this.DUPLICATE_WINDOW_MINUTES}분 이내 재발송 불가`,
          waitTime
        };
      }
    }

    // 2. 일일 한도 체크
    if (this.isDailyLimitReached()) {
      return {
        allowed: false,
        reason: `일일 발송 한도(${this.DAILY_LIMIT}건) 초과`
      };
    }

    // 3. 월 예산 체크
    if (this.isMonthlyBudgetExceeded()) {
      return {
        allowed: false,
        reason: `월 예산(${this.MONTHLY_BUDGET.toLocaleString()}원) 초과`
      };
    }

    return { allowed: true };
  }

  /**
   * 발송 기록
   */
  recordSend(phone: string, success: boolean, provider: string): void {
    const normalizedPhone = this.normalizePhone(phone);
    const now = new Date();

    // 발송 시간 기록
    if (success) {
      this.recentSends.set(normalizedPhone, now);
    }

    // 일일 통계 업데이트
    this.updateDailyStats(success, provider);

    // 비용 계산 및 기록
    const cost = this.calculateCost(provider);
    this.dailyStats.cost += cost;

    // 임계값 도달 시 알림
    this.checkThresholds();
  }

  /**
   * 일일 한도 확인
   */
  isDailyLimitReached(): boolean {
    return this.dailyStats.count >= this.DAILY_LIMIT;
  }

  /**
   * 월 예산 초과 확인
   */
  isMonthlyBudgetExceeded(): boolean {
    const monthlyStats = this.getMonthlyStats();
    return monthlyStats.totalCost >= this.MONTHLY_BUDGET;
  }

  /**
   * 비용 계산
   */
  private calculateCost(provider: string): number {
    switch (provider.toLowerCase()) {
      case 'aligo':
        return this.SMS_COST_KRW;
      case 'twilio':
        return this.SMS_COST_USD * this.USD_TO_KRW;
      case 'demo':
        return 0;
      default:
        return this.SMS_COST_KRW; // 기본값
    }
  }

  /**
   * 일일 통계 업데이트
   */
  private updateDailyStats(success: boolean, provider: string): void {
    const today = new Date().toISOString().split('T')[0];

    // 날짜가 바뀌었으면 리셋
    if (this.dailyStats.date !== today) {
      this.resetDailyStats();
    }

    this.dailyStats.count++;
    if (!success) {
      this.dailyStats.failures++;
    }
  }

  /**
   * 임계값 체크 및 알림
   */
  private checkThresholds(): void {
    const { count, cost } = this.dailyStats;

    // 일일 한도 80% 도달
    if (count === Math.floor(this.DAILY_LIMIT * 0.8)) {
      console.warn(`⚠️ SMS 일일 한도 80% 도달: ${count}/${this.DAILY_LIMIT}`);
      this.sendAlert('daily_limit_warning', `일일 SMS 한도 80% 도달`);
    }

    // 일일 한도 도달
    if (count >= this.DAILY_LIMIT) {
      console.error(`🚨 SMS 일일 한도 초과: ${count}/${this.DAILY_LIMIT}`);
      this.sendAlert('daily_limit_exceeded', `일일 SMS 한도 초과`);
    }

    // 월 예산 80% 도달
    const monthlyStats = this.getMonthlyStats();
    if (monthlyStats.totalCost >= this.MONTHLY_BUDGET * 0.8) {
      console.warn(`⚠️ SMS 월 예산 80% 도달: ₩${monthlyStats.totalCost.toLocaleString()}`);
      this.sendAlert('monthly_budget_warning', `월 SMS 예산 80% 도달`);
    }
  }

  /**
   * 알림 발송 (실제 구현 필요)
   */
  private sendAlert(type: string, message: string): void {
    // TODO: 실제 알림 구현
    // - 이메일 발송
    // - Slack/Discord 웹훅
    // - 관리자 대시보드 노티
    console.log(`[Alert] ${type}: ${message}`);
  }

  /**
   * 일일 통계 리셋
   */
  private resetDailyStats(): void {
    const today = new Date().toISOString().split('T')[0];

    // 이전 통계 저장 (필요시)
    if (this.dailyStats.count > 0) {
      this.saveDailyStats();
    }

    this.dailyStats = {
      date: today,
      count: 0,
      cost: 0,
      failures: 0
    };
  }

  /**
   * 일일 통계 저장 (DB 또는 파일)
   */
  private saveDailyStats(): void {
    // TODO: Supabase 또는 파일 시스템에 저장
    console.log(`📊 일일 통계 저장: ${JSON.stringify(this.dailyStats)}`);
  }

  /**
   * 매일 자정 리셋 스케줄링
   */
  private scheduleDailyReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.resetDailyStats();
      // 다음 자정 스케줄링
      setInterval(() => this.resetDailyStats(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  /**
   * 오래된 발송 기록 정리
   */
  private cleanupOldRecords(): void {
    const cutoffTime = Date.now() - (this.DUPLICATE_WINDOW_MINUTES * 60 * 1000);

    for (const [phone, timestamp] of this.recentSends.entries()) {
      if (timestamp.getTime() < cutoffTime) {
        this.recentSends.delete(phone);
      }
    }

    console.log(`🧹 오래된 발송 기록 정리: ${this.recentSends.size}개 남음`);
  }

  /**
   * 전화번호 정규화
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  /**
   * 통계 조회
   */
  getStats(): {
    daily: {
      date: string;
      count: number;
      cost: number;
      failures: number;
    };
    monthly: {
      totalCount: number;
      totalCost: number;
      averagePerDay: number;
    };
    limits: {
      dailyLimit: number;
      monthlyBudget: number;
      remainingToday: number;
      remainingBudget: number;
    };
  } {
    const monthlyStats = this.getMonthlyStats();

    return {
      daily: { ...this.dailyStats },
      monthly: monthlyStats,
      limits: {
        dailyLimit: this.DAILY_LIMIT,
        monthlyBudget: this.MONTHLY_BUDGET,
        remainingToday: Math.max(0, this.DAILY_LIMIT - this.dailyStats.count),
        remainingBudget: Math.max(0, this.MONTHLY_BUDGET - monthlyStats.totalCost)
      }
    };
  }

  /**
   * 월간 통계 조회 (간단한 버전)
   */
  private getMonthlyStats(): {
    totalCount: number;
    totalCost: number;
    averagePerDay: number;
  } {
    // TODO: 실제로는 DB에서 조회해야 함
    // 현재는 일일 통계 × 일수로 추정
    const dayOfMonth = new Date().getDate();
    const estimatedMonthlyCount = this.dailyStats.count * 30 / dayOfMonth;
    const estimatedMonthlyCost = this.dailyStats.cost * 30 / dayOfMonth;

    return {
      totalCount: Math.round(estimatedMonthlyCount),
      totalCost: Math.round(estimatedMonthlyCost),
      averagePerDay: Math.round(estimatedMonthlyCount / 30)
    };
  }

  /**
   * 비용 예측
   */
  predictMonthlyCost(): {
    current: number;
    projected: number;
    recommendation?: string;
  } {
    const stats = this.getMonthlyStats();
    const dayOfMonth = new Date().getDate();
    const remainingDays = 30 - dayOfMonth;

    const currentPace = stats.totalCost / dayOfMonth;
    const projectedTotal = currentPace * 30;

    let recommendation;
    if (projectedTotal > this.MONTHLY_BUDGET) {
      const requiredReduction = ((projectedTotal - this.MONTHLY_BUDGET) / projectedTotal * 100).toFixed(1);
      recommendation = `현재 속도로는 월 예산을 ${requiredReduction}% 초과할 예정입니다. 일일 발송량을 줄이세요.`;
    } else if (projectedTotal > this.MONTHLY_BUDGET * 0.8) {
      recommendation = `월 예산의 80% 이상 사용 예상. 발송량 모니터링이 필요합니다.`;
    }

    return {
      current: stats.totalCost,
      projected: Math.round(projectedTotal),
      recommendation
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const costOptimizer = CostOptimizer.getInstance();