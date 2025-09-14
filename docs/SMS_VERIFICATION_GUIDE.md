# 📱 SMS 인증 시스템 가이드

## 개요

88 Company의 SMS 인증 시스템은 사용자 전화번호 인증을 위한 완벽한 솔루션입니다.
다중 SMS 프로바이더를 지원하며, 보안과 성능을 위한 다양한 기능을 포함합니다.

## 주요 기능

### 🔧 핵심 기능
- **다중 프로바이더 지원**: Demo, Twilio, 알리고
- **자동 프로바이더 전환**: 실패 시 자동 폴백
- **Rate Limiting**: DDoS 방지 및 비용 절감
- **보안 강화**: 재시도 제한, 만료 시간, 중복 방지
- **데이터베이스 통합**: Supabase 또는 메모리 저장소

### 📊 제한 사항
- **시간당 제한**: 3회
- **일일 제한**: 5회
- **인증번호 유효 시간**: 3분
- **최대 시도 횟수**: 5회
- **차단 시간**: 60분 (과도한 시도 시)

## 설정 방법

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# .env.example 파일을 복사하여 시작
cp .env.example .env.local
```

### 2. SMS 프로바이더 선택

#### Demo 모드 (개발용)
```env
SMS_PROVIDER=demo
```
- 실제 SMS 발송 없음
- 콘솔에 인증번호 표시
- 개발 및 테스트용

#### Twilio (국제 SMS)
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```
- [Twilio Console](https://www.twilio.com/console)에서 정보 확인
- 전 세계 SMS 발송 가능
- 요금: 건당 약 $0.0075 (한국 기준)

#### 알리고 (국내 전용)
```env
SMS_PROVIDER=aligo
ALIGO_API_KEY=your_api_key
ALIGO_USER_ID=your_user_id
ALIGO_SENDER=0212345678
```
- [알리고 관리자](https://smartsms.aligo.in)에서 정보 확인
- 국내 전용, 더 저렴한 요금
- 요금: 건당 약 16원

### 3. Supabase 설정 (선택사항)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Supabase가 설정되지 않으면 자동으로 메모리 저장소 사용

## 사용 방법

### API 엔드포인트

#### 인증번호 발송
```javascript
POST /api/verify
{
  "action": "send",
  "phone": "010-1234-5678"
}

// 응답
{
  "success": true,
  "message": "인증번호가 발송되었습니다",
  "demoCode": "123456" // Demo 모드에서만 반환
}
```

#### 인증번호 확인
```javascript
POST /api/verify
{
  "action": "verify",
  "phone": "010-1234-5678",
  "code": "123456"
}

// 응답
{
  "success": true,
  "verified": true,
  "message": "인증이 완료되었습니다"
}
```

#### 통계 조회 (관리자용)
```javascript
GET /api/verify/stats

// 응답
{
  "success": true,
  "stats": {
    "provider": "Demo",
    "rateLimiter": {
      "totalEntries": 5,
      "blockedNumbers": 0,
      "recentAttempts": 3
    },
    "memoryStoreSize": 2
  }
}
```

### 프론트엔드 통합 예제

```typescript
// 인증번호 발송
const sendVerificationCode = async (phone: string) => {
  const response = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send',
      phone
    })
  });

  const data = await response.json();
  if (data.success) {
    console.log('인증번호가 발송되었습니다');
    // Demo 모드에서는 data.demoCode로 테스트 가능
  }
};

// 인증번호 확인
const verifyCode = async (phone: string, code: string) => {
  const response = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify',
      phone,
      code
    })
  });

  const data = await response.json();
  if (data.verified) {
    console.log('인증 성공!');
    // 인증 성공 후 처리
  }
};
```

## 테스트

### 테스트 스크립트 실행
```bash
npm run test:sms
```

이 스크립트는 다음을 테스트합니다:
- SMS 서비스 초기화
- 프로바이더 상태 확인
- 전화번호 형식 검증
- 인증번호 발송 및 확인
- Rate Limiting 동작
- API 엔드포인트

### 수동 테스트

1. 개발 서버 시작
```bash
npm run dev
```

2. API 테스트 (curl 또는 Postman 사용)
```bash
# 인증번호 발송
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"action":"send","phone":"010-1234-5678"}'

# 인증번호 확인
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"action":"verify","phone":"010-1234-5678","code":"123456"}'
```

## 보안 고려사항

### 구현된 보안 기능
- ✅ Rate Limiting (시간당/일일 제한)
- ✅ 인증 시도 횟수 제한
- ✅ 인증번호 만료 시간
- ✅ 브루트포스 공격 방지
- ✅ 중복 전화번호 체크
- ✅ 전화번호 형식 검증

### 추가 권장사항
- HTTPS 사용 필수
- CAPTCHA 통합 고려
- IP 기반 제한 추가
- 로그 모니터링 구현
- 알림 시스템 구축

## 문제 해결

### 일반적인 문제

#### 1. "Module not found" 오류
```bash
npm install twilio chalk dotenv
```

#### 2. SMS가 발송되지 않음
- 환경 변수 확인
- 프로바이더 자격 증명 확인
- 프로바이더 계정 잔액 확인

#### 3. Rate Limiting 차단
- 테스트 시 `rateLimiter.unblock(phone)` 사용
- 프로덕션에서는 시간 경과 대기

#### 4. Supabase 연결 실패
- Supabase URL과 키 확인
- 네트워크 연결 확인
- RLS 정책 확인

## 비용 예측

### Twilio
- 한국 SMS: 약 $0.0075/건
- 월 10,000건: 약 $75 (약 10만원)

### 알리고
- 국내 SMS: 약 16원/건
- 월 10,000건: 약 160,000원

### 비용 절감 팁
- Rate Limiting으로 남용 방지
- 중복 인증 방지
- 캐싱 활용
- 오류 재시도 제한

## 프로덕션 체크리스트

- [ ] 실제 SMS 프로바이더 설정
- [ ] 환경 변수 보안 설정
- [ ] HTTPS 적용
- [ ] 로그 모니터링 구축
- [ ] 백업 프로바이더 설정
- [ ] 관리자 인증 구현
- [ ] 통계 대시보드 구축
- [ ] 알림 시스템 구축
- [ ] 비용 모니터링 설정
- [ ] 성능 최적화

## 업데이트 로그

### v1.0.0 (2024-12-14)
- 초기 릴리스
- Demo, Twilio, 알리고 프로바이더 지원
- Rate Limiting 구현
- Supabase 통합

---

문의사항이나 문제가 있으시면 이슈를 등록해주세요.