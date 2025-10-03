# 📱 NHN Cloud SMS 서비스 가이드

## 🚀 NHN Cloud SMS 선택 이유

### 왜 NHN Cloud인가?
- **국내 최대 규모 클라우드**: NHN (네이버, 한게임) 그룹의 안정적인 인프라
- **대용량 발송 안정성**: 초당 1,000건 이상 처리 가능
- **합리적인 가격**: SMS 11원/건, LMS 30원/건
- **통합 관리**: 국내/국제 SMS 모두 지원
- **상세한 모니터링**: 실시간 발송 결과 추적 및 통계

## 📊 가격 비교

| 서비스 | SMS (90자) | LMS (2000자) | 국제 SMS |
|--------|------------|--------------|----------|
| **NHN Cloud** | 11원/건 | 30원/건 | 50원/건 |
| 알리고 | 16원/건 | 45원/건 | 미지원 |
| Twilio | 약 100원/건 | 약 200원/건 | $0.0075 |
| 솔라피 | 18원/건 | 48원/건 | 별도 문의 |

## 🔧 계정 설정 가이드

### Step 1: NHN Cloud 계정 생성

1. **회원가입**
   ```
   1. https://www.toast.com 접속
   2. 회원가입 클릭
   3. 이메일 인증
   4. 기본 정보 입력
   ```

2. **조직 생성**
   ```
   Console → 조직 관리 → 조직 생성
   - 조직명: 88 Company
   - 도메인: 88company
   ```

### Step 2: SMS 서비스 활성화

1. **프로젝트 생성**
   ```
   Console → 프로젝트 생성
   - 프로젝트명: 88-company-sms
   - 설명: 88 Company SMS 서비스
   ```

2. **SMS 상품 활성화**
   ```
   1. 프로젝트 선택
   2. 서비스 선택 → Notification → SMS
   3. 상품 이용 버튼 클릭
   4. 약관 동의 후 확인
   ```

### Step 3: 발신번호 등록

1. **발신번호 인증**
   ```
   SMS Console → 발신번호 관리 → 발신번호 등록
   ```

2. **필요 서류** (사업자)
   - 사업자등록증
   - 통신서비스 이용증명원
   - 번호 사용 인증서

3. **필요 서류** (개인)
   - 신분증 사본
   - 통신서비스 이용증명원

4. **심사 기간**
   - 일반: 1-2 영업일
   - 긴급: 당일 처리 (추가 비용)

### Step 4: API 인증 정보 확인

1. **App Key 확인**
   ```
   SMS Console → URL & Appkey
   - App Key: xxxxxxxxxxxxxxxx (복사)
   ```

2. **Secret Key 발급**
   ```
   Console → 계정 관리 → API 보안 설정
   - Secret Key 생성 클릭
   - Secret Key: xxxxxxxxxxxxxxxx (복사)
   ```

## 💻 구현 가이드

### 환경 변수 설정

`.env.local` 파일 생성:
```env
# NHN Cloud SMS 설정
SMS_PROVIDER=nhncloud
NHN_APP_KEY=your_app_key_here
NHN_SECRET_KEY=your_secret_key_here
NHN_SEND_NO=0212345678  # 등록된 발신번호
NHN_PROJECT_ID=  # 선택사항
NHN_API_URL=https://api-sms.cloud.toast.com
```

### 테스트 코드

```javascript
// 테스트 스크립트
import { SMSService } from '@/lib/sms/sms-service';

const smsService = SMSService.getInstance();

// SMS 발송 테스트
const result = await smsService.sendSMS(
  '010-1234-5678',
  '[88 Company] 테스트 메시지입니다.'
);

console.log('발송 결과:', result);
```

## 📋 API 사용 예제

### 단건 발송
```javascript
// POST /api/verify
{
  "action": "send",
  "phone": "010-1234-5678"
}
```

### 대량 발송 (NHN Cloud 특화)
```javascript
// lib/sms/providers/nhncloud.ts의 sendBulkSMS 메서드 활용
const provider = new NHNCloudSMSProvider(config);
const result = await provider.sendBulkSMS([
  { phone: '010-1111-1111', message: '메시지1' },
  { phone: '010-2222-2222', message: '메시지2' },
  // 최대 1,000건까지 한번에 발송
]);
```

## 🔍 발송 결과 조회

### 실시간 상태 확인
```javascript
const provider = new NHNCloudSMSProvider(config);
const status = await provider.getMessageStatus(requestId);

// status.status: 'pending' | 'success' | 'failed'
// status.details: 상세 정보
```

### 웹훅 설정 (선택사항)
```
SMS Console → 웹훅 관리
- URL: https://your-domain.com/api/webhook/sms
- 이벤트: 발송 완료, 발송 실패
```

## 📊 모니터링 및 통계

### NHN Cloud Console 대시보드
- **실시간 모니터링**: 발송 현황, 성공률, 실패 원인
- **통계 리포트**: 일별/월별 발송량, 비용 분석
- **알림 설정**: 이상 징후 감지, 한도 초과 알림

### 비용 관리
```
Console → 사용량 → SMS
- 일별 사용량 조회
- 월별 청구 예상액
- 사용량 알림 설정 (80%, 100%)
```

## ⚙️ 고급 기능

### 1. 예약 발송
```javascript
const requestBody = {
  body: message,
  sendNo: this.sendNo,
  recipientList: [...],
  reserveTime: '2024-12-25 09:00:00',  // 예약 시간
  reserveTimeZone: 'Asia/Seoul'
};
```

### 2. 템플릿 사용
```javascript
// 자주 사용하는 메시지를 템플릿으로 등록
const template = {
  templateId: 'VERIFY_001',
  templateName: '본인인증',
  body: '[88 Company] 인증번호는 #{code}입니다.',
  variables: ['code']
};
```

### 3. 통계 ID 활용
```javascript
// 캠페인별 발송 추적
statsId: 'CAMPAIGN_2024_BLACK_FRIDAY'
```

## 🚨 장애 대응

### 자동 폴백 설정
```javascript
// SMS 서비스 폴백 체인
const providers = ['nhncloud', 'aligo', 'twilio'];
let sent = false;

for (const provider of providers) {
  try {
    await sendWithProvider(provider);
    sent = true;
    break;
  } catch (error) {
    console.error(`${provider} 실패:`, error);
  }
}
```

### 에러 코드 및 대응

| 코드 | 설명 | 대응 방법 |
|------|------|-----------|
| 1000 | 성공 | - |
| 2000 | 잘못된 요청 | 파라미터 확인 |
| 3000 | 발신번호 미등록 | 발신번호 등록 |
| 4000 | 인증 실패 | API 키 확인 |
| 5000 | 서버 오류 | 재시도 또는 지원 문의 |

## 📞 기술 지원

### NHN Cloud 지원
- **기술 문의**: 1588-5850
- **이메일**: support@nhncloud.com
- **문서**: https://docs.toast.com/ko/Notification/SMS
- **콘솔**: https://console.toast.com

### 긴급 대응
- **24/7 기술 지원**: Premium 요금제
- **Slack 채널**: 엔터프라이즈 고객
- **전담 매니저**: 대량 발송 고객

## 💡 Best Practices

### 1. 발송 최적화
- **배치 발송**: 대량 발송 시 1,000건 단위로 묶어서 발송
- **시간대 분산**: 피크 시간대 (오전 9-10시, 오후 6-7시) 회피
- **중복 제거**: 발송 전 중복 번호 제거

### 2. 보안 강화
- **Secret Key 관리**: 환경 변수 사용, 절대 하드코딩 금지
- **IP 화이트리스트**: Console에서 API 접근 IP 제한
- **발송 한도 설정**: 일일/월간 발송 한도 설정

### 3. 비용 절감
- **SMS vs LMS**: 90자 이내는 SMS, 초과 시 LMS 자동 전환
- **실패 재발송 제한**: 최대 3회까지만 재시도
- **테스트 환경 분리**: 개발/테스트는 별도 프로젝트 사용

## 📈 성능 지표

### NHN Cloud SMS 성능
- **처리량**: 초당 1,000건 이상
- **지연시간**: 평균 0.5초 이내
- **성공률**: 99.9% 이상
- **가용성**: 99.95% SLA

### 88 Company 최적화 목표
- **응답시간**: < 200ms
- **일일 발송량**: 10,000건
- **비용**: 월 200,000원 이내
- **성공률**: > 99%

## 🔄 마이그레이션 가이드

### 기존 시스템에서 전환
1. **병렬 운영**: 기존 시스템과 NHN Cloud 동시 운영 (1주)
2. **점진적 전환**: 10% → 50% → 100% 단계적 전환
3. **롤백 계획**: 문제 발생 시 즉시 이전 시스템으로 전환

### 데이터 이관
```sql
-- 발송 이력 마이그레이션
INSERT INTO sms_logs_new (phone, message, provider, sent_at)
SELECT phone, message, 'nhncloud', sent_at
FROM sms_logs_old;
```

---

*최종 업데이트: 2024-12-14*
*문서 버전: 1.0.0*