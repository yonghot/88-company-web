# 📋 NHN Cloud SMS 발신번호 미등록 에러 분석 보고서

## 🚨 핵심 요약

NHN Cloud SMS 서비스에서 **발신번호 미등록**은 가장 흔한 오류 중 하나입니다. 이는 통신사업자 신고 규정에 따른 필수 절차로, 적절한 대응 방안이 필요합니다.

---

## 🔍 에러 패턴 분석

### 주요 에러 코드
```json
{
  "header": {
    "isSuccessful": false,
    "resultCode": 3000,
    "resultMessage": "발신번호가 등록되지 않았습니다"
  }
}
```

### NHN Cloud API 응답 구조
```typescript
// 실패 시 응답 예시
{
  "header": {
    "isSuccessful": false,
    "resultCode": 3000,  // 발신번호 미등록
    "resultMessage": "발신번호가 등록되지 않았습니다"
  },
  "body": {
    "data": null
  }
}
```

### 코드에서의 에러 처리
```typescript
// lib/sms/providers/nhncloud.ts의 에러 처리
if (data.header.isSuccessful) {
  // 성공 처리
} else {
  throw new SMSProviderError(
    data.header.resultMessage || 'NHN Cloud SMS 발송 실패',
    'nhncloud',
    {
      resultCode: data.header.resultCode,
      resultMessage: data.header.resultMessage
    }
  );
}
```

---

## 📱 발신번호 등록 절차

### 1. 빠른 등록 가이드

#### 개인 사용자
```
필요 서류:
✅ 신분증 사본 (주민등록증/운전면허증)
✅ 통신서비스 이용증명원 (본인 명의 휴대폰)

등록 가능 번호:
🔹 본인 명의 휴대폰만 가능 (010-xxxx-xxxx)

처리 시간:
⚡ 휴대폰 인증: 즉시 승인
📋 서류 인증: 1-2 영업일
```

#### 사업자 사용자
```
필요 서류:
✅ 사업자등록증
✅ 통신서비스 이용증명원
✅ 번호 사용 인증서 (대표번호인 경우)

등록 가능 번호:
🔹 회사 대표번호 (02-xxxx-xxxx)
🔹 사업자 명의 휴대폰 (010-xxxx-xxxx)
🔹 대표자 명의 휴대폰 (위임장 필요)

처리 시간:
📋 서류 심사: 1-2 영업일
```

### 2. 단계별 등록 절차

#### Step 1: Console 접속
```
URL: https://console.toast.com
경로: 프로젝트 선택 → Notification → SMS → 발신번호 관리
```

#### Step 2: 기본 정보 입력
```
발신번호: 010-1234-5678 (하이픈 포함)
인증 유형: 서류 인증 / 휴대폰 인증
용도: 회원 인증
설명: 88 Company 회원 인증용 SMS 발송
```

#### Step 3: 서류 업로드
```
파일 형식: PDF, JPG, PNG (최대 10MB)
업로드 서류:
- 사업자등록증 (사업자)
- 신분증 사본 (개인)
- 통신서비스 이용증명원 (필수)
```

---

## 🔧 임시 해결책

### 1. Demo 모드 사용
```typescript
// .env.local 설정
SMS_PROVIDER=demo  // NHN Cloud 대신 Demo 모드 사용
SHOW_DEMO_CODE=true  // 개발 시 인증번호 표시
```

**장점:**
- ✅ 즉시 테스트 가능
- ✅ 비용 없음
- ✅ 개발 환경에 적합

**단점:**
- ❌ 실제 SMS 발송 불가
- ❌ 프로덕션 사용 불가

### 2. 다른 SMS 프로바이더 사용
```typescript
// 알리고 사용 (발신번호 등록 불요)
SMS_PROVIDER=aligo
ALIGO_USER_ID=your_user_id
ALIGO_API_KEY=your_api_key
ALIGO_SEND_NO=010-1234-5678
```

**장점:**
- ✅ 발신번호 사전 등록 불필요
- ✅ 즉시 사용 가능
- ✅ 저렴한 비용

**단점:**
- ❌ NHN Cloud 대비 제한적 기능
- ❌ 대량 발송 시 성능 이슈 가능

### 3. 혼합 전략 (권장)
```typescript
// 발신번호 등록 완료까지 임시 사용
const providers = [
  'nhncloud',  // 메인 프로바이더 (등록 완료 시)
  'aligo',     // 백업 프로바이더
  'demo'       // 개발/테스트용
];

// 자동 폴백 로직
for (const provider of providers) {
  try {
    const result = await sendSMS(provider, phone, message);
    if (result.success) break;
  } catch (error) {
    console.log(`${provider} 실패, 다음 프로바이더 시도`);
  }
}
```

---

## 📊 에러 모니터링 및 대응

### 1. 에러 감지 로직
```typescript
// 발신번호 미등록 감지
if (error.details?.resultCode === 3000) {
  logger.error('🚨 발신번호가 등록되지 않았습니다');

  // 관리자 알림
  await notifyAdmin({
    type: 'SENDER_NOT_REGISTERED',
    provider: 'nhncloud',
    timestamp: new Date(),
    action: 'REGISTER_SENDER_NUMBER'
  });

  // 백업 프로바이더로 전환
  return await fallbackToAligo(phone, message);
}
```

### 2. 대시보드 모니터링
```typescript
// SMS 발송 통계
const stats = {
  nhncloud: {
    total: 1000,
    success: 850,
    failed: 150,
    errorTypes: {
      3000: 120,  // 발신번호 미등록
      4000: 20,   // 인증 실패
      5000: 10    // 서버 오류
    }
  }
};
```

### 3. 자동 복구 시나리오
```typescript
// 발신번호 등록 상태 자동 확인
setInterval(async () => {
  const senders = await checkRegisteredSenders();

  if (senders.includes(process.env.NHN_SEND_NO)) {
    logger.info('✅ 발신번호 등록 완료 - NHN Cloud 활성화');
    await switchToNHNCloud();
  }
}, 60 * 60 * 1000); // 1시간마다 확인
```

---

## 💡 모범 사례

### 1. 환경별 설정 관리
```typescript
// 환경별 SMS 프로바이더 설정
const smsConfig = {
  development: 'demo',
  staging: 'aligo',      // 발신번호 등록 불요
  production: 'nhncloud' // 등록 완료 후 사용
};
```

### 2. 점진적 마이그레이션
```
Phase 1: Demo 모드로 개발 (1주)
Phase 2: 알리고로 임시 운영 (발신번호 등록 진행 중)
Phase 3: NHN Cloud로 전환 (등록 완료 후)
```

### 3. 비용 최적화
```typescript
// 프로바이더별 비용 고려
const providerCost = {
  demo: 0,              // 무료
  aligo: 12,            // 건당 12원
  nhncloud: 11,         // 건당 11원 (대량 할인 가능)
  twilio: 100           // 건당 약 100원 (해외)
};
```

---

## 📋 체크리스트

### 발신번호 등록 준비사항
- [ ] NHN Cloud 계정 생성 완료
- [ ] SMS 서비스 활성화 완료
- [ ] 발신번호로 사용할 번호 확정
- [ ] 통신서비스 이용증명원 발급
- [ ] 사업자등록증 준비 (사업자의 경우)
- [ ] 신분증 사본 준비 (개인의 경우)

### 임시 해결책 적용
- [ ] Demo 모드 설정 확인
- [ ] 백업 SMS 프로바이더 설정
- [ ] 자동 폴백 로직 구현
- [ ] 에러 모니터링 설정

### 등록 완료 후 전환
- [ ] 발신번호 승인 상태 확인
- [ ] NHN Cloud API 키 설정
- [ ] 실제 발송 테스트
- [ ] 백업 프로바이더 비활성화

---

## 🚨 긴급 대응 가이드

### 즉시 조치사항
1. **Demo 모드로 전환**
   ```bash
   # .env.local 수정
   SMS_PROVIDER=demo
   ```

2. **백업 프로바이더 활성화**
   ```bash
   # 알리고 설정
   SMS_PROVIDER=aligo
   ```

3. **에러 알림 설정**
   ```typescript
   if (smsError.code === 3000) {
     await slackNotify('🚨 발신번호 미등록 - 즉시 등록 필요');
   }
   ```

### 24시간 내 조치사항
1. NHN Cloud Console에서 발신번호 등록 신청
2. 휴대폰 인증 가능한 경우 즉시 진행
3. 서류 인증인 경우 고화질 서류 준비 후 제출

### 1주일 내 목표
1. 발신번호 등록 완료
2. NHN Cloud 프로바이더로 전환
3. 백업 프로바이더 유지 (장애 대비)

---

## 📞 지원 연락처

### NHN Cloud 고객센터
- **전화**: 1588-5850
- **이메일**: support@nhncloud.com
- **운영시간**: 평일 09:00 ~ 18:00

### 88 Company 내부 대응팀
- **개발팀**: SMS 서비스 설정 및 폴백 로직
- **운영팀**: 발신번호 등록 절차 진행
- **고객지원팀**: 사용자 문의 대응

---

*문서 작성일: 2025-09-18*
*담당자: Claude Code Assistant*
*다음 검토일: 발신번호 등록 완료 시*