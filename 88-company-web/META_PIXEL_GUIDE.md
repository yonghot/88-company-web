# 메타 픽셀 전환 추적 구현 가이드

## 개요

챗봇에서 사용자가 전화번호 인증까지 완료하고 데이터베이스에 리드가 저장되면, 메타 픽셀 Lead 이벤트가 자동으로 발송되어 광고 성과를 추적합니다.

## 트리거 조건

✅ **리드 확보 완료 시점**:
1. 사용자가 모든 챗봇 질문에 답변
2. 전화번호 입력 및 SMS 인증 완료
3. 데이터베이스에 리드 데이터 저장 성공

⚠️ **주의**: 위 3가지 조건이 **모두 충족**되어야 메타 픽셀 이벤트가 발송됩니다.

## 설정 방법

### 1. 메타 픽셀 ID 확인

1. [Meta Events Manager](https://business.facebook.com/events_manager2)에 로그인
2. 데이터 소스 → 픽셀 선택
3. 픽셀 ID 복사 (숫자로만 구성, 예: 1234567890123456)

### 2. 환경 변수 설정

`.env.local` 파일에 픽셀 ID 추가:

```env
# 메타 픽셀 설정
NEXT_PUBLIC_META_PIXEL_ID=1234567890123456
```

**중요**: `NEXT_PUBLIC_` 접두사가 반드시 필요합니다.

### 3. 프로덕션 환경 설정

Vercel 대시보드에서 환경 변수 추가:
1. Vercel 프로젝트 → Settings → Environment Variables
2. 변수명: `NEXT_PUBLIC_META_PIXEL_ID`
3. 값: 메타 픽셀 ID
4. 환경: Production, Preview, Development 모두 선택
5. Save 후 재배포

## 발송되는 이벤트

### PageView 이벤트 (자동)
- **발송 시점**: 사용자가 사이트 방문 시
- **위치**: `app/layout.tsx`
- **목적**: 페이지 조회수 추적

### Lead 이벤트 (전환)
- **발송 시점**: 리드 확보 완료 시 (전화번호 인증 + DB 저장 성공)
- **위치**: `components/chatbot/ChatInterface.tsx` > `saveLeadData` 함수
- **이벤트 파라미터**:
  ```javascript
  {
    content_name: '88 Company 상담 신청',
    content_category: '정부지원사업 컨설팅',
    value: 0,
    currency: 'KRW'
  }
  ```

## 테스트 방법

### 로컬 테스트

1. **환경 변수 설정 확인**:
   ```bash
   # .env.local 파일에 NEXT_PUBLIC_META_PIXEL_ID 있는지 확인
   cat .env.local | grep NEXT_PUBLIC_META_PIXEL_ID
   ```

2. **개발 서버 재시작**:
   ```bash
   # 환경 변수 변경 시 반드시 재시작
   npm run dev
   ```

3. **Facebook Pixel Helper 설치**:
   - [Chrome 확장 프로그램](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) 설치

4. **이벤트 발송 테스트**:
   - 브라우저에서 `http://localhost:3000` 접속
   - 개발자 도구 Console 탭 열기 (F12)
   - 챗봇의 모든 질문에 답변
   - 전화번호 입력 및 인증 완료
   - Console에서 확인:
     ```
     [ChatInterface] ✅ Lead saved successfully to database
     [ChatInterface] ✅ Meta Pixel Lead event sent
     ```
   - Facebook Pixel Helper 아이콘 확인 (초록색 체크마크)

### 프로덕션 테스트

1. **Meta Events Manager 실시간 이벤트 확인**:
   - [Meta Events Manager](https://business.facebook.com/events_manager2) 접속
   - 픽셀 선택 → 테스트 이벤트 탭
   - 브라우저 이름 입력 후 "Open Chrome" 클릭
   - 프로덕션 사이트에서 챗봇 완료
   - 실시간으로 Lead 이벤트 확인

2. **브라우저 Console 확인**:
   ```javascript
   // 페이지 로드 시 픽셀 초기화 확인
   // Console에 다음 로그 표시되어야 함:
   [ChatInterface] ✅ Meta Pixel Lead event sent
   ```

3. **네트워크 탭 확인**:
   - 개발자 도구 Network 탭
   - `facebook.net` 도메인 요청 확인
   - `/tr?id=YOUR_PIXEL_ID&ev=Lead` 요청 확인

## 안전성 보장

### 보수적 구현 원칙

✅ **기존 기능 보호**:
- 메타 픽셀 ID가 없어도 챗봇 정상 작동
- 메타 픽셀 로딩 실패 시에도 리드 저장 프로세스 영향 없음
- 전화번호 인증 프로세스와 완전 분리

✅ **에러 격리**:
```typescript
try {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', { ... });
  }
} catch (pixelError) {
  console.error('[ChatInterface] ⚠️ Meta Pixel error (non-critical):', pixelError);
  // 에러 발생해도 메인 로직 계속 진행
}
```

✅ **타입 안전성**:
- `types/meta-pixel.d.ts`에 Window 인터페이스 확장
- TypeScript 컴파일 타임 체크

### 장애 시나리오 테스트

1. **메타 픽셀 ID 없는 경우**:
   ```bash
   # .env.local에서 NEXT_PUBLIC_META_PIXEL_ID 제거
   npm run dev
   ```
   - 예상 결과: 챗봇 정상 작동, Console에 "Meta Pixel not available" 로그

2. **메타 픽셀 스크립트 로딩 실패**:
   - 네트워크 차단 (개발자 도구 Network 탭 → Offline)
   - 예상 결과: 챗봇 정상 작동, 리드 저장 성공, 픽셀 이벤트만 실패

3. **fbq 함수 실행 에러**:
   ```javascript
   // Console에서 강제로 에러 발생
   window.fbq = () => { throw new Error('Test error'); };
   ```
   - 예상 결과: 에러 로그 출력되지만 챗봇 프로세스 계속 진행

## 디버깅 가이드

### Console 로그 확인

정상 작동 시 표시되는 로그:

```
[ChatInterface] ✅ Lead saved successfully to database
[ChatInterface] ✅ Meta Pixel Lead event sent
```

메타 픽셀 미설정 시:

```
[ChatInterface] ✅ Lead saved successfully to database
[ChatInterface] ℹ️ Meta Pixel not available (NEXT_PUBLIC_META_PIXEL_ID not set)
```

메타 픽셀 에러 시:

```
[ChatInterface] ✅ Lead saved successfully to database
[ChatInterface] ⚠️ Meta Pixel error (non-critical): [에러 메시지]
```

### 일반적인 문제 해결

**문제**: 메타 픽셀 이벤트가 발송되지 않음

**해결 방법**:
1. `.env.local`에 `NEXT_PUBLIC_META_PIXEL_ID` 설정 확인
2. 개발 서버 재시작 (`npm run dev`)
3. 브라우저 하드 리프레시 (Ctrl + Shift + R)
4. Console에서 `window.fbq` 함수 존재 확인
5. Facebook Pixel Helper로 픽셀 로드 상태 확인

**문제**: Vercel 프로덕션에서 이벤트 미발송

**해결 방법**:
1. Vercel 환경 변수 설정 확인
2. `NEXT_PUBLIC_` 접두사 확인
3. 재배포 필요 (환경 변수 변경 시)
4. Meta Events Manager 테스트 이벤트로 실시간 확인

## 성과 측정

### Meta Events Manager 확인 항목

1. **이벤트 수**: Lead 이벤트 발생 횟수
2. **전환율**: PageView 대비 Lead 비율
3. **광고 캠페인 최적화**: Lead 이벤트 기반 자동 최적화
4. **맞춤 타겟**: Lead 이벤트 기반 유사 타겟 생성

### 권장 대시보드 설정

- **일일 Lead 이벤트 수**: 목표 대비 실제 달성률
- **시간대별 분석**: 가장 많은 전환이 발생하는 시간
- **디바이스별 분석**: 모바일 vs 데스크톱 전환율
- **광고 세트별 성과**: 어떤 광고가 가장 효과적인지

## 참고 자료

- [Meta Pixel 공식 문서](https://developers.facebook.com/docs/meta-pixel)
- [Meta Events Manager](https://business.facebook.com/events_manager2)
- [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
- [메타 픽셀 표준 이벤트 가이드](https://developers.facebook.com/docs/meta-pixel/reference)

## 변경 이력

### 2025-10-11 - 초기 구현
- PageView 이벤트 자동 발송 (layout.tsx)
- Lead 이벤트 발송 (전화번호 인증 완료 + DB 저장 시)
- TypeScript 타입 정의 추가
- 보수적 에러 처리 구현
- 디버깅 로그 추가
