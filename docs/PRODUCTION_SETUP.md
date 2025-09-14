# 🚀 프로덕션 환경 설정 가이드

## 📋 목차
1. [SMS 프로바이더 계정 생성](#1-sms-프로바이더-계정-생성)
2. [Supabase 데이터베이스 설정](#2-supabase-데이터베이스-설정)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [Vercel 배포](#4-vercel-배포)
5. [보안 설정](#5-보안-설정)
6. [모니터링 설정](#6-모니터링-설정)
7. [비용 관리](#7-비용-관리)

---

## 1. SMS 프로바이더 계정 생성

### 옵션 A: Twilio (국제 SMS 추천)

#### 1.1 계정 생성
1. [Twilio 가입 페이지](https://www.twilio.com/try-twilio) 접속
2. 계정 정보 입력 (이메일, 전화번호 인증 필요)
3. 무료 크레딧 $15 제공 (약 2,000건 테스트 가능)

#### 1.2 전화번호 구매
```
1. Twilio Console → Phone Numbers → Buy a Number
2. 국가 선택: United States (가장 저렴)
3. Capabilities: SMS 체크
4. 번호 선택 후 구매 ($1.15/월)
```

#### 1.3 자격 증명 확인
```
Console 홈에서 확인:
- Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxx
- Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- Phone Number: +1234567890
```

#### 1.4 한국 번호로 SMS 발송 설정
```
1. Messaging → Settings → Geo Permissions
2. South Korea 체크
3. Save
```

### 옵션 B: 알리고 (국내 SMS 전용)

#### 1.1 계정 생성
1. [알리고 가입](https://smartsms.aligo.in/member/join.html) 접속
2. 사업자 정보 입력 (사업자등록증 필요)
3. 계정 승인 대기 (1-2일 소요)

#### 1.2 발신번호 등록
```
1. 관리자 페이지 → 발신번호 관리
2. 발신번호 등록 (통신사 인증 필요)
3. 서류 제출:
   - 통신서비스 이용증명원
   - 사업자등록증
4. 승인 대기 (1-2일)
```

#### 1.3 API 키 발급
```
1. 관리자 페이지 → API 연동 관리
2. API 키 발급
3. 정보 확인:
   - API Key: xxxxxxxxxxxxx
   - User ID: your_id
   - 발신번호: 02-1234-5678
```

#### 1.4 충전
```
1. 관리자 페이지 → 충전하기
2. 금액 선택 (최소 1만원)
3. SMS 단가: 약 16원/건
```

---

## 2. Supabase 데이터베이스 설정

### 2.1 프로젝트 생성
1. [Supabase](https://supabase.com) 가입
2. New Project 생성
3. 프로젝트 정보 입력:
   ```
   Name: 88-company-production
   Database Password: 강력한 비밀번호 생성
   Region: Northeast Asia (Seoul)
   ```

### 2.2 데이터베이스 스키마 설정
1. SQL Editor 열기
2. 아래 스키마 실행:

```sql
-- leads 테이블 생성
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,

  -- 사용자 정보
  name TEXT,
  company TEXT,
  position TEXT,
  department TEXT,
  employee_count TEXT,
  service_type TEXT,
  timeline TEXT,
  specific_needs TEXT,

  -- 연락처 정보
  contact_time TEXT,
  contact_method TEXT,
  additional_message TEXT,

  -- 인증 정보
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- verification_codes 테이블 생성
CREATE TABLE IF NOT EXISTS verification_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_leads_timestamp ON leads(timestamp DESC);
CREATE INDEX idx_leads_verified ON leads(verified);
CREATE INDEX idx_verification_expires ON verification_codes(expires_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (백엔드 전용 접근)
CREATE POLICY "Service role full access to leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to verification_codes" ON verification_codes
  FOR ALL USING (auth.role() = 'service_role');
```

### 2.3 API 키 확인
```
Settings → API → Project API keys:
- anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6...
- service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6... (비공개)
```

---

## 3. 환경 변수 설정

### 3.1 로컬 환경 (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# SMS Provider (택 1)
# Twilio
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# 또는 알리고
SMS_PROVIDER=aligo
ALIGO_API_KEY=xxxxxxxxxxxxx
ALIGO_USER_ID=your_id
ALIGO_SENDER=0212345678

# 보안
ADMIN_SECRET_KEY=random_strong_secret_key_here

# 프로덕션 설정
NODE_ENV=production
SHOW_DEMO_CODE=false
```

### 3.2 환경 변수 생성 스크립트
```bash
# 강력한 시크릿 키 생성
openssl rand -base64 32
```

---

## 4. Vercel 배포

### 4.1 Vercel 프로젝트 연결
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 연결
vercel

# 프로덕션 배포
vercel --prod
```

### 4.2 환경 변수 설정 (Vercel Dashboard)
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 → Settings → Environment Variables
3. 각 환경 변수 추가:
   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://xxxxx.supabase.co
   Environment: Production
   ```
4. 모든 환경 변수 추가 후 재배포

### 4.3 도메인 설정
```
1. Settings → Domains
2. Add Domain: sms.88company.com
3. DNS 설정:
   Type: CNAME
   Name: sms
   Value: cname.vercel-dns.com
```

---

## 5. 보안 설정

### 5.1 API 보안
```typescript
// app/api/verify/route.ts 수정
import { headers } from 'next/headers';

// 관리자 인증 미들웨어 추가
function isAdmin(request: Request): boolean {
  const authHeader = headers().get('authorization');
  const adminKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKey || !authHeader) return false;

  return authHeader === `Bearer ${adminKey}`;
}

// GET 메서드에 인증 추가
export async function GET(request: Request) {
  // 관리자 인증 체크
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: '인증이 필요합니다' },
      { status: 401 }
    );
  }

  // 기존 통계 로직...
}
```

### 5.2 CORS 설정
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://88company.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};
```

### 5.3 Rate Limiting 강화
```typescript
// lib/sms/rate-limiter.ts 수정
export class RateLimiter {
  // 프로덕션 설정
  private readonly MAX_ATTEMPTS_PER_HOUR = process.env.NODE_ENV === 'production' ? 3 : 5;
  private readonly MAX_ATTEMPTS_PER_DAY = process.env.NODE_ENV === 'production' ? 5 : 10;
  private readonly BLOCK_DURATION_MINUTES = process.env.NODE_ENV === 'production' ? 120 : 60;

  // IP 기반 제한 추가
  private ipEntries: Map<string, RateLimitEntry> = new Map();

  isAllowedByIP(ip: string): { allowed: boolean; reason?: string } {
    // IP 기반 체크 로직
  }
}
```

---

## 6. 모니터링 설정

### 6.1 Vercel Analytics
```bash
# Analytics 패키지 설치
npm install @vercel/analytics

# app/layout.tsx에 추가
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 6.2 에러 모니터링 (Sentry)
```bash
# Sentry 설치
npm install @sentry/nextjs

# sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### 6.3 SMS 발송 모니터링
```typescript
// lib/sms/monitoring.ts
export class SMSMonitor {
  private static async logSMS(data: {
    phone: string;
    provider: string;
    success: boolean;
    error?: string;
  }) {
    // Supabase에 로그 저장
    await supabase.from('sms_logs').insert({
      ...data,
      timestamp: new Date().toISOString(),
    });

    // 실패 시 알림
    if (!data.success) {
      await this.sendAlert(`SMS 발송 실패: ${data.error}`);
    }
  }

  private static async sendAlert(message: string) {
    // Slack, Discord, 이메일 등으로 알림
  }
}
```

---

## 7. 비용 관리

### 7.1 예산 설정

#### Twilio
```
1. Console → Billing → Usage Triggers
2. Set trigger:
   - Threshold: $50
   - Frequency: Daily
   - Action: Email notification
```

#### 알리고
```
1. 관리자 → 알림 설정
2. 잔액 알림:
   - 최소 잔액: 10,000원
   - 알림 방법: SMS/이메일
```

### 7.2 비용 최적화
```typescript
// lib/sms/cost-optimizer.ts
export class CostOptimizer {
  // 중복 발송 방지 (5분 이내)
  private recentSends = new Map<string, Date>();

  canSend(phone: string): boolean {
    const lastSent = this.recentSends.get(phone);
    if (!lastSent) return true;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSent < fiveMinutesAgo;
  }

  // 일일 한도 설정
  private dailyLimit = 100;
  private dailyCount = 0;

  isDailyLimitReached(): boolean {
    return this.dailyCount >= this.dailyLimit;
  }
}
```

### 7.3 비용 대시보드
```typescript
// app/admin/sms-dashboard/page.tsx
export default async function SMSDashboard() {
  const stats = await getSMSStats();

  return (
    <div>
      <h1>SMS 비용 대시보드</h1>
      <div>
        <p>오늘 발송: {stats.todayCount}건</p>
        <p>예상 비용: ₩{stats.todayCount * 16}</p>
        <p>월 발송: {stats.monthCount}건</p>
        <p>월 비용: ₩{stats.monthCount * 16}</p>
      </div>
    </div>
  );
}
```

---

## 📝 체크리스트

### 배포 전 필수 확인 사항
- [ ] SMS 프로바이더 계정 생성 완료
- [ ] 발신번호 등록 완료 (알리고의 경우)
- [ ] Supabase 프로젝트 생성 및 스키마 설정
- [ ] 모든 환경 변수 설정
- [ ] ADMIN_SECRET_KEY 생성 및 설정
- [ ] Demo 모드 비활성화 (SHOW_DEMO_CODE=false)
- [ ] API 보안 설정 완료
- [ ] CORS 설정 완료
- [ ] 테스트 완료 (npm run test:sms)

### 배포 후 확인 사항
- [ ] 프로덕션 환경에서 SMS 발송 테스트
- [ ] 관리자 API 인증 테스트
- [ ] 모니터링 작동 확인
- [ ] 비용 알림 설정 확인
- [ ] 에러 로깅 확인
- [ ] 백업 계획 수립

---

## 🆘 문제 해결

### 일반적인 문제와 해결 방법

#### 1. SMS가 도착하지 않음
```
원인: 프로바이더 설정 오류
해결:
1. 환경 변수 확인
2. 프로바이더 계정 잔액 확인
3. 발신번호 승인 상태 확인
4. 로그 확인: vercel logs
```

#### 2. Supabase 연결 실패
```
원인: 환경 변수 또는 네트워크 문제
해결:
1. NEXT_PUBLIC_ 접두사 확인
2. Supabase 프로젝트 상태 확인
3. RLS 정책 확인
```

#### 3. Rate Limiting 너무 엄격함
```
원인: 프로덕션 설정이 너무 보수적
해결:
1. rate-limiter.ts에서 한도 조정
2. IP 기반 제한 완화
3. 화이트리스트 추가
```

---

## 📞 지원 연락처

- **Twilio 지원**: support@twilio.com
- **알리고 지원**: 1661-9854
- **Supabase 지원**: support@supabase.com
- **Vercel 지원**: support@vercel.com

---

*최종 업데이트: 2024-12-14*