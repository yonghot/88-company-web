# 🚨 NHN Cloud SMS 문제 해결 가이드

## 📌 진단 결과

### 발견된 문제
- **API 응답**: `"Not found" (코드: -9998)`
- **원인**: App Key가 SMS 서비스와 연결되지 않음
- **영향**: SMS 발송 불가능

### 상세 진단 내용
```
✅ 환경 변수 설정: 정상
✅ API 엔드포인트: 정상 (https://api-sms.cloud.toast.com)
✅ 발신번호 형식: 정상 (010-5317-9499)
❌ App Key 인증: 실패 - "Not found" 에러
❌ SMS 서비스 연결: 실패
```

## 🔧 해결 방법

### 방법 1: NHN Cloud Console에서 확인 (권장)

1. **NHN Cloud Console 접속**
   - https://console.nhncloud.com 로그인

2. **SMS 서비스 확인**
   ```
   ① 프로젝트 선택
   ② 좌측 메뉴에서 "Notification" → "SMS" 클릭
   ③ 서비스 상태 확인:
      - "사용" 상태인지 확인
      - "사용 안 함"이면 "사용" 버튼 클릭
   ```

3. **올바른 App Key 확인**
   ```
   ⚠️ 중요: SMS 서비스의 App Key는 프로젝트 App Key와 다릅니다!

   ① SMS 서비스 페이지에서 "URL & Appkey" 클릭
   ② "Appkey" 값 복사 (16자리)
   ③ "SecretKey" 값 복사 (32자리)
   ```

4. **발신번호 등록 확인**
   ```
   ① SMS 서비스 페이지에서 "발신번호 관리" 클릭
   ② 010-5317-9499가 "승인" 상태인지 확인
   ③ 없거나 "대기" 상태면 인증 완료 필요
   ```

5. **.env.local 파일 업데이트**
   ```env
   # SMS 서비스 페이지에서 복사한 값으로 교체
   NHN_APP_KEY=SMS_서비스의_App_Key_입력
   NHN_SECRET_KEY=SMS_서비스의_Secret_Key_입력
   NHN_SEND_NO=010-5317-9499
   SMS_PROVIDER=nhncloud
   ```

### 방법 2: 임시로 Demo 모드 사용

개발/테스트 중이라면 demo 모드를 사용할 수 있습니다:

```env
# .env.local 파일 수정
SMS_PROVIDER=demo
SHOW_DEMO_CODE=true
```

Demo 모드 특징:
- 실제 SMS 발송 없음
- 인증번호가 화면에 표시됨
- 개발/테스트용으로만 사용

### 방법 3: 다른 SMS 프로바이더 사용

알리고(Aligo) SMS로 전환:
```env
SMS_PROVIDER=aligo
ALIGO_USER_ID=your_user_id
ALIGO_API_KEY=your_api_key
ALIGO_SEND_NO=010-5317-9499
```

## 🔍 검증 방법

### 1. 진단 스크립트 실행
```bash
cd 88-company-web
npx tsx scripts/test-nhn-sms.ts
```

성공 시 출력:
```
✅ Health Check 성공!
```

### 2. 웹 애플리케이션에서 테스트
```bash
npm run dev
```
- http://localhost:3000 접속
- 챗봇에서 전화번호 입력 단계까지 진행
- SMS 발송 확인

## 📋 체크리스트

- [ ] NHN Cloud Console 로그인 가능
- [ ] SMS 서비스 "사용" 상태
- [ ] SMS 서비스의 App Key 복사 (프로젝트 App Key와 다름!)
- [ ] SMS 서비스의 Secret Key 복사
- [ ] 발신번호 010-5317-9499 승인 완료
- [ ] .env.local 파일 업데이트
- [ ] 서버 재시작 (`npm run dev`)
- [ ] 진단 스크립트 성공

## 💡 추가 팁

### App Key 종류 구분
- **프로젝트 App Key**: 프로젝트 전체에서 사용 (SMS에는 사용 안 됨)
- **SMS 서비스 App Key**: SMS 발송에만 사용 ⭐

### 일반적인 실수
1. ❌ 프로젝트 App Key를 SMS에 사용
2. ❌ 발신번호 미등록 상태에서 발송 시도
3. ❌ SMS 서비스 미활성화 상태

### 지원 문의
- NHN Cloud 기술 지원: 1600-7893
- 이메일: support@nhncloud.com
- 문의 시 제공할 정보:
  - 프로젝트 ID
  - App Key (앞 4자리만)
  - 에러 코드: -9998

## 📱 즉시 해결책 (Demo 모드)

바로 테스트가 필요하다면:

```bash
# 1. .env.local 수정
echo "SMS_PROVIDER=demo" >> .env.local
echo "SHOW_DEMO_CODE=true" >> .env.local

# 2. 서버 재시작
npm run dev
```

이제 SMS 인증 단계에서 화면에 인증번호가 표시됩니다.

---
작성일: 2025-01-22
문제 코드: -9998 (Not found)