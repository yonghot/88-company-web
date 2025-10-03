# 📱 카카오톡 알림톡 서비스 가이드

> ⚠️ **참고**: 현재 프로젝트는 NHN Cloud SMS를 사용 중입니다. 이 문서는 향후 알림톡 도입 시 참고용으로 보관합니다.
> 실제 구현은 [NHN Cloud SMS 가이드](./NHN_CLOUD_SMS_GUIDE.md)를 참조하세요.

## 🔍 알림톡 vs SMS 비교

| 구분 | SMS | 카카오톡 알림톡 |
|------|-----|--------------|
| **비용** | 16-20원/건 | 7-11원/건 |
| **도달률** | 99% | 95% (카톡 사용자만) |
| **글자수** | 90자 (SMS) | 1,000자 |
| **버튼** | 없음 | 최대 5개 버튼 |
| **이미지** | MMS 별도 비용 | 이미지형 가능 |
| **심사** | 불필요 | 템플릿 사전 심사 필요 |
| **발송 시간** | 즉시 | 템플릿 승인 후 |
| **브랜드 신뢰도** | 보통 | 높음 (인증마크) |

## 📊 주요 알림톡 서비스 제공업체

### 1. NHN Cloud (Toast)
**장점:**
- ✅ 대기업 안정성 (NHN 계열)
- ✅ 다양한 클라우드 서비스 연동
- ✅ 상세한 통계 및 분석
- ✅ API 문서 한글 지원 우수

**단점:**
- ❌ 초기 설정 복잡
- ❌ 최소 충전 금액 높음
- ❌ 소규모 사업자에게 부담

**가격:**
- 알림톡: 9원/건
- 친구톡: 15원/건
- SMS 대체 발송: +16원

**설정 난이도:** ⭐⭐⭐⭐ (복잡)

### 2. 알리고 (추천 ⭐)
**장점:**
- ✅ SMS와 알림톡 통합 관리
- ✅ 간단한 설정
- ✅ 저렴한 가격
- ✅ 빠른 템플릿 심사 지원

**단점:**
- ❌ 대용량 발송 시 안정성
- ❌ 고급 기능 부족

**가격:**
- 알림톡: 7원/건
- 친구톡: 12원/건
- SMS 대체 발송: +16원

**설정 난이도:** ⭐⭐ (쉬움)

### 3. 솔라피 (CoolSMS)
**장점:**
- ✅ 개발자 친화적 API
- ✅ 다양한 SDK 제공
- ✅ 실시간 웹훅 지원
- ✅ 무료 테스트 발송

**단점:**
- ❌ UI/UX 개선 필요
- ❌ 고객 지원 응답 느림

**가격:**
- 알림톡: 8원/건
- 친구톡: 13원/건
- SMS 대체 발송: +18원

**설정 난이도:** ⭐⭐⭐ (보통)

### 4. 비즈엠 (BizM)
**장점:**
- ✅ 카카오 공식 파트너
- ✅ 빠른 템플릿 심사
- ✅ 대용량 발송 안정성
- ✅ 24시간 고객 지원

**단점:**
- ❌ 높은 가격
- ❌ 복잡한 관리 콘솔

**가격:**
- 알림톡: 11원/건
- 친구톡: 16원/건
- SMS 대체 발송: +20원

**설정 난이도:** ⭐⭐⭐ (보통)

## 🚀 알림톡 도입 절차

### Step 1: 카카오톡 채널 생성
```
1. 카카오톡 채널 관리자센터 접속
   https://center-pf.kakao.com

2. 채널 개설
   - 채널명: 88 Company
   - 검색용 아이디: @88company
   - 카테고리: 비즈니스

3. 비즈니스 인증
   - 사업자등록증 업로드
   - 통신판매업 신고증 (필요시)
   - 승인 대기: 1-3일
```

### Step 2: 발송 대행사 선택 및 연동
```
1. 대행사 선택 (알리고 추천)

2. 대행사 계정 생성

3. 카카오톡 채널 연동
   - 채널 관리자센터 → 관리 → 상세설정
   - 알림톡 사용 신청
   - 발신프로필 등록

4. 발신프로필 심사: 1-2일
```

### Step 3: 템플릿 등록 및 심사

#### 인증번호 발송 템플릿 예시
```
템플릿명: 본인인증_인증번호발송
템플릿 내용:
----------------------------------------
[88 Company] 본인 확인

인증번호: #{인증번호}

3분 이내에 입력해주세요.
타인에게 절대 알려주지 마세요.
----------------------------------------

변수:
- #{인증번호}: 6자리 숫자

버튼: 없음
```

#### 신청 완료 템플릿 예시
```
템플릿명: 상담신청_완료안내
템플릿 내용:
----------------------------------------
[88 Company] 상담 신청 완료

#{고객명}님, 상담 신청이 완료되었습니다.

▶ 신청 정보
- 회사: #{회사명}
- 희망 시간: #{상담시간}
- 서비스: #{서비스유형}

담당자가 곧 연락드리겠습니다.
문의: 1234-5678
----------------------------------------

변수:
- #{고객명}: 고객 이름
- #{회사명}: 회사명
- #{상담시간}: 상담 희망 시간
- #{서비스유형}: 선택한 서비스

버튼:
- 웹링크: 신청내역 확인
  URL: https://88company.com/my
```

### Step 4: API 연동

## 💻 구현 예제 (알리고 기준)

### 1. 알림톡 서비스 클래스
```typescript
// lib/kakao/alimtalk-service.ts
export class AlimtalkService {
  private apiKey: string;
  private userId: string;
  private senderKey: string; // 발신프로필 키

  constructor() {
    this.apiKey = process.env.ALIGO_API_KEY!;
    this.userId = process.env.ALIGO_USER_ID!;
    this.senderKey = process.env.ALIGO_SENDER_KEY!;
  }

  /**
   * 알림톡 발송
   */
  async sendAlimtalk(
    phone: string,
    templateCode: string,
    variables: Record<string, string>,
    buttons?: Array<{
      name: string;
      linkType: 'WL' | 'AL' | 'DS' | 'BK' | 'MD';
      linkMo?: string;
      linkPc?: string;
    }>
  ) {
    const url = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

    const formData = new FormData();
    formData.append('apikey', this.apiKey);
    formData.append('userid', this.userId);
    formData.append('senderkey', this.senderKey);
    formData.append('tpl_code', templateCode);
    formData.append('receiver_1', phone);
    formData.append('subject_1', '88 Company 알림');

    // 변수 치환
    let message = await this.getTemplateMessage(templateCode);
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(`#{${key}}`, value);
    }
    formData.append('message_1', message);

    // 버튼 추가
    if (buttons && buttons.length > 0) {
      formData.append('button_1', JSON.stringify(buttons));
    }

    // 실패 시 SMS 대체 발송
    formData.append('failover', 'Y');
    formData.append('fsubject_1', '[88 Company]');
    formData.append('fmessage_1', message.slice(0, 90));

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    return {
      success: result.code === 0,
      messageId: result.msg_id,
      error: result.message
    };
  }

  /**
   * 인증번호 발송 (알림톡)
   */
  async sendVerificationCode(phone: string, code: string) {
    return this.sendAlimtalk(
      phone,
      'verification_code', // 템플릿 코드
      { 인증번호: code }
    );
  }

  /**
   * 상담 신청 완료 알림
   */
  async sendApplicationComplete(
    phone: string,
    name: string,
    company: string,
    time: string,
    service: string
  ) {
    return this.sendAlimtalk(
      phone,
      'application_complete',
      {
        고객명: name,
        회사명: company,
        상담시간: time,
        서비스유형: service
      },
      [
        {
          name: '신청내역 확인',
          linkType: 'WL',
          linkMo: 'https://88company.com/my',
          linkPc: 'https://88company.com/my'
        }
      ]
    );
  }
}
```

### 2. 통합 메시징 서비스
```typescript
// lib/messaging/unified-messaging.ts
export class UnifiedMessagingService {
  private smsService: SMSService;
  private alimtalkService: AlimtalkService;

  constructor() {
    this.smsService = new SMSService();
    this.alimtalkService = new AlimtalkService();
  }

  /**
   * 메시지 발송 (알림톡 우선, 실패 시 SMS)
   */
  async sendMessage(
    phone: string,
    type: 'verification' | 'notification',
    data: any
  ) {
    try {
      // 1. 알림톡 시도
      if (type === 'verification') {
        const result = await this.alimtalkService.sendVerificationCode(
          phone,
          data.code
        );

        if (result.success) {
          console.log('✅ 알림톡 발송 성공');
          return result;
        }
      }

      // 2. 알림톡 실패 시 SMS 발송
      console.log('⚠️ 알림톡 실패, SMS로 대체 발송');
      return await this.smsService.sendVerificationCode(
        phone,
        data.code
      );

    } catch (error) {
      console.error('메시지 발송 실패:', error);
      throw error;
    }
  }
}
```

## 💰 비용 비교 (월 10,000건 기준)

| 서비스 | SMS | 알림톡 | 절감액 | 절감률 |
|--------|-----|--------|--------|--------|
| **직접 발송** | 160,000원 | - | - | - |
| **알리고** | 160,000원 | 70,000원 | 90,000원 | 56% |
| **솔라피** | 180,000원 | 80,000원 | 100,000원 | 55% |
| **NHN Cloud** | 200,000원 | 90,000원 | 110,000원 | 55% |
| **비즈엠** | 200,000원 | 110,000원 | 90,000원 | 45% |

## ✅ 도입 시 체크리스트

### 필수 준비사항
- [ ] 사업자등록증
- [ ] 카카오톡 채널 개설
- [ ] 채널 비즈니스 인증
- [ ] 발신프로필 등록
- [ ] 템플릿 작성 및 심사
- [ ] API 키 발급
- [ ] 테스트 잔액 충전

### 템플릿 심사 주의사항
- ✅ 광고성 문구 금지
- ✅ 이모티콘 사용 제한
- ✅ 변수명 명확히 정의
- ✅ 버튼 URL 실제 존재해야 함
- ❌ 과도한 마케팅 문구
- ❌ 외부 링크 남용
- ❌ 개인정보 직접 포함

### 기술적 고려사항
- 템플릿 승인 시간 (1-3일)
- 실패 시 SMS 대체 발송 설정
- 발송 결과 웹훅 처리
- 일일 발송 한도 관리
- 친구 추가 유도 전략

## 🎯 추천 시나리오

### 88 Company에 최적화된 선택

**추천: 알리고 (알림톡 + SMS 통합)**

**이유:**
1. ✅ 기존 SMS 시스템과 통합 관리 가능
2. ✅ 가장 저렴한 가격 (7원/건)
3. ✅ 간단한 API 연동
4. ✅ 빠른 템플릿 심사 지원
5. ✅ SMS 대체 발송 자동화

**구현 전략:**
1. 1단계: 현재 SMS 시스템 유지
2. 2단계: 카카오톡 채널 생성 및 인증
3. 3단계: 알림톡 템플릿 등록
4. 4단계: 알림톡 우선, SMS 폴백 구현
5. 5단계: 점진적 전환

## 📞 지원 연락처

- **알리고**: 1661-9854
- **솔라피**: 1600-2215
- **NHN Cloud**: 1588-5850
- **비즈엠**: 1522-3385
- **카카오 채널**: 1577-3754

## 🔗 유용한 링크

- [카카오톡 채널 관리자센터](https://center-pf.kakao.com)
- [알림톡 디자인 가이드](https://kakaobusiness.gitbook.io/main/ad/bizmessage/notice-friend-talk)
- [알리고 API 문서](https://smartsms.aligo.in/admin/api/spec.html)
- [NHN Cloud API 문서](https://docs.toast.com/ko/Notification/KakaoTalk%20Bizmessage/ko/alimtalk-api-guide/)

---

*최종 업데이트: 2024-12-14*