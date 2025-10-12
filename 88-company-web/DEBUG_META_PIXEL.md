# 메타 픽셀 디버깅 체크리스트

## 🔍 브라우저에서 즉시 확인하기

### 1. 개발자 도구 콘솔에서 확인

```javascript
// 1. 메타 픽셀 스크립트 로딩 확인
typeof window.fbq

// 결과:
// - "function" → ✅ 정상 로딩됨
// - "undefined" → ❌ 스크립트 로딩 실패

// 2. 메타 픽셀 수동 테스트
window.fbq('track', 'Lead', {
  content_name: '테스트',
  value: 0,
  currency: 'KRW'
});

// 3. 환경변수 확인 (프로덕션에서는 표시 안됨)
console.log('Meta Pixel ID:', process.env.NEXT_PUBLIC_META_PIXEL_ID);
```

### 2. Network 탭에서 확인

1. 개발자 도구 열기 (F12)
2. **Network** 탭 클릭
3. 필터에 `fbevents` 입력
4. 페이지 새로고침

**확인 항목**:
- ✅ `fbevents.js` 파일이 **200 OK** 상태로 로드됨
- ❌ `fbevents.js` 파일이 없거나 **차단됨(blocked)** 표시

### 3. Console 탭에서 오류 확인

다음과 같은 오류가 있는지 확인:
```
❌ Refused to load the script 'fbevents.js' (CSP 차단)
❌ net::ERR_BLOCKED_BY_CLIENT (광고 차단)
❌ Failed to fetch (네트워크 오류)
```

### 4. 광고 차단 확인

**확인 방법**:
1. 브라우저 확장 프로그램 아이콘 확인
   - Adblock, uBlock Origin, Privacy Badger 등
2. 브라우저 설정 확인
   - Chrome: 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터
   - Firefox: 설정 → 개인 정보 보호 및 보안 → 향상된 추적 방지 기능
   - Safari: 환경설정 → 개인 정보 보호 → 웹사이트 추적 방지

**해결 방법**:
- 광고 차단 프로그램 일시 비활성화
- 시크릿/프라이빗 모드에서 테스트 (확장 프로그램 비활성화 상태)

---

## 🎯 메타 픽셀 작동 확인 (Facebook Events Manager)

### 방법 1: Facebook Pixel Helper (Chrome 확장 프로그램)

1. [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) 설치
2. 웹사이트 접속
3. 확장 프로그램 아이콘 클릭
4. 발송된 이벤트 확인:
   - **PageView**: 페이지 로드 시
   - **Lead**: 인증 완료 시

### 방법 2: Meta Events Manager

1. [Meta Events Manager](https://business.facebook.com/events_manager2) 접속
2. 픽셀 선택 (ID: 1193107135981842)
3. **Test Events** 탭 클릭
4. 테스트 브라우저로 웹사이트 접속
5. 실시간으로 이벤트 발송 확인

---

## 🐛 문제 해결 시나리오

### 시나리오 1: `typeof window.fbq === "undefined"`

**원인**: 메타 픽셀 스크립트 로딩 실패

**해결**:
1. Network 탭에서 `fbevents.js` 차단 확인
2. 광고 차단 프로그램 비활성화
3. 시크릿 모드에서 재테스트
4. 다른 브라우저에서 테스트

### 시나리오 2: `typeof window.fbq === "function"` 이지만 로그 없음

**원인**: 프로덕션 빌드 또는 로그 필터링

**해결**:
1. Console 필터 설정 확인 (All levels 선택)
2. Network 탭에서 `tr?id=` 요청 확인 (메타 픽셀 이벤트 전송)
3. Facebook Events Manager에서 실시간 확인

### 시나리오 3: 로컬에서는 작동하지만 프로덕션에서 안됨

**원인**: 환경변수 미설정 또는 빌드 이슈

**해결**:
```bash
# Vercel 환경변수 재확인
npx vercel env ls

# 프로덕션 재배포
git commit --allow-empty -m "chore: trigger redeploy for Meta Pixel"
git push
```

---

## ✅ 정상 작동 시 로그 흐름

```
[콘솔에서 확인되어야 하는 로그]

1. 페이지 로드:
   - (메타 픽셀 자동 로그 없음, 대신 Network 탭 확인)

2. 전화번호 입력:
   [ChatInterface] Phone submitted: 010-xxxx-xxxx
   [VerificationInput] Sending SMS to: 010-xxxx-xxxx

3. 인증번호 확인:
   [VerificationInput] ✅ 인증 성공! 1.5초 후 다음 단계로 이동
   [VerificationInput] 🎯 onVerify 콜백 호출 시작

4. 리드 저장:
   [ChatInterface] 🎯 handleVerificationComplete 호출됨
   [ChatInterface] 💾 saveLeadData 호출 시작...
   [ChatInterface] ✅ Lead saved successfully to database

5. 메타 픽셀:
   [ChatInterface] 🔍 Meta Pixel 확인 중...
   [ChatInterface] - window 객체: object
   [ChatInterface] - window.fbq 존재: true
   [ChatInterface] 📤 Meta Pixel Lead 이벤트 발송 시작...
   [ChatInterface] ✅ Meta Pixel Lead event sent

6. Network 탭에서 확인:
   → tr?id=1193107135981842&ev=Lead (Status: 200)
```

---

## 🆘 여전히 작동하지 않으면

다음 정보와 함께 문의:
1. `typeof window.fbq` 결과
2. Network 탭 스크린샷 (fbevents.js)
3. Console 탭 오류 메시지
4. 사용 중인 브라우저 및 확장 프로그램 목록
5. Facebook Pixel Helper 결과 (설치한 경우)
