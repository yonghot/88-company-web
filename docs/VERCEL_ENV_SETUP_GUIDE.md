# Vercel 환경변수 설정 가이드

## 📋 목차
1. [Vercel 대시보드 접속](#1-vercel-대시보드-접속)
2. [환경변수 설정 페이지 이동](#2-환경변수-설정-페이지-이동)
3. [환경변수 추가하기](#3-환경변수-추가하기)
4. [재배포하기](#4-재배포하기)
5. [설정 확인하기](#5-설정-확인하기)

---

## 1. Vercel 대시보드 접속

### 로그인
1. https://vercel.com 접속
2. **Continue with GitHub** 클릭
3. GitHub 계정으로 로그인

### 프로젝트 선택
1. 대시보드에서 **88-company-web** 프로젝트 찾기
2. 프로젝트 카드 클릭

---

## 2. 환경변수 설정 페이지 이동

### Settings 탭 찾기
1. 프로젝트 페이지 상단 메뉴에서 **Settings** 클릭
   ```
   Overview | Deployments | Analytics | Speed Insights | [Settings] | ...
   ```

2. 왼쪽 사이드바에서 **Environment Variables** 클릭
   ```
   General
   Domains
   Integrations
   Git
   Functions
   [Environment Variables] ← 이것 클릭
   Security
   ```

---

## 3. 환경변수 추가하기

### 📝 SMS 인증 기본 설정 (Demo 모드)

#### Step 1: 첫 번째 변수 추가 (SMS_PROVIDER)
1. **Key** 입력란: `SMS_PROVIDER`
2. **Value** 입력란: `demo`
3. **Environment** 체크박스:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Add** 버튼 클릭

#### Step 2: 두 번째 변수 추가 (SHOW_DEMO_CODE)
1. **Key** 입력란: `SHOW_DEMO_CODE`
2. **Value** 입력란: `true`
3. **Environment** 체크박스:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Add** 버튼 클릭

#### Step 3: 관리자 비밀번호 추가 (선택사항)
1. **Key** 입력란: `ADMIN_PASSWORD`
2. **Value** 입력란: `원하는_비밀번호` (예: `mySecretPass123`)
3. **Environment** 체크박스:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
4. **Add** 버튼 클릭

### 🔒 실제 SMS 서비스 설정 (NHN Cloud)

실제 SMS를 발송하려면 다음 변수들을 추가로 설정:

#### NHN Cloud 설정
```
SMS_PROVIDER = nhncloud
NHN_APP_KEY = [NHN Console에서 복사한 App Key]
NHN_SECRET_KEY = [NHN Console에서 복사한 Secret Key]
NHN_SEND_NO = 010-1234-5678 [등록된 발신번호]
```

### 💡 환경변수 추가 화면 예시

```
┌─────────────────────────────────────────────────┐
│ Add Environment Variable                        │
│                                                 │
│ Key                                            │
│ [SMS_PROVIDER                    ]             │
│                                                 │
│ Value (Will be Encrypted)                      │
│ [demo                            ]             │
│                                                 │
│ Environment                                    │
│ ☑ Production                                   │
│ ☑ Preview                                      │
│ ☑ Development                                  │
│                                                 │
│ [Add]                                          │
└─────────────────────────────────────────────────┘
```

---

## 4. 재배포하기

환경변수를 추가한 후 반드시 재배포해야 적용됩니다.

### 방법 1: 자동 재배포 (권장)
환경변수 추가 후 나타나는 알림에서:
1. **"Redeploy"** 버튼 클릭
2. **"Redeploy with existing Build Cache"** 선택
3. 배포 완료 대기 (2-3분)

### 방법 2: 수동 재배포
1. 상단 메뉴에서 **Deployments** 탭 클릭
2. 최신 배포 항목 찾기
3. 오른쪽 **"..."** 메뉴 클릭
4. **"Redeploy"** 선택
5. 팝업에서 **"Redeploy"** 확인

---

## 5. 설정 확인하기

### 환경변수 확인
1. **Settings → Environment Variables** 페이지에서 추가된 변수 목록 확인
2. 각 변수 옆에 환경(Production/Preview/Development) 아이콘 표시 확인

### 배포 로그 확인
1. **Deployments** 탭에서 최신 배포 클릭
2. **Build Logs** 확인
3. "Environment Variables loaded" 메시지 확인

### 실제 작동 테스트
1. 배포된 사이트 접속: `https://88-company-web.vercel.app`
2. 챗봇에서 전화번호 인증 단계까지 진행
3. Demo 모드인 경우 콘솔에 인증번호 표시 확인

---

## 🔧 문제 해결

### 환경변수가 적용되지 않는 경우
1. **캐시 문제**
   - Redeploy 시 "Use existing Build Cache" 체크 해제
   - 또는 VERCEL_FORCE_NO_BUILD_CACHE=1 환경변수 추가

2. **변수명 오타 확인**
   - 대소문자 구분됨
   - 언더스코어(_) 위치 확인

3. **Value 값 확인**
   - 따옴표 불필요 (자동 처리됨)
   - 공백 주의

### 환경변수 수정하기
1. 변수 옆 **Edit** 아이콘 클릭
2. 값 수정
3. **Save** 클릭
4. 재배포 필요

### 환경변수 삭제하기
1. 변수 옆 **Delete** 아이콘 클릭
2. 확인 팝업에서 **Delete** 클릭
3. 재배포 필요

---

## 📝 필수 환경변수 체크리스트

### Demo 모드 (개발/테스트)
- [x] `SMS_PROVIDER` = `demo`
- [x] `SHOW_DEMO_CODE` = `true`
- [ ] `ADMIN_PASSWORD` = 원하는 비밀번호 (선택)

### Production 모드 (실제 운영)
- [ ] `SMS_PROVIDER` = `nhncloud`
- [ ] `NHN_APP_KEY` = NHN Cloud App Key
- [ ] `NHN_SECRET_KEY` = NHN Cloud Secret Key
- [ ] `NHN_SEND_NO` = 등록된 발신번호
- [ ] `ADMIN_PASSWORD` = 강력한 비밀번호 (필수)
- [ ] `SHOW_DEMO_CODE` = `false` (또는 제거)

---

## 🚀 빠른 시작 (복사용)

### Demo 모드 환경변수 세트
```
SMS_PROVIDER=demo
SHOW_DEMO_CODE=true
ADMIN_PASSWORD=159753
```

### NHN Cloud 환경변수 세트
```
SMS_PROVIDER=nhncloud
NHN_APP_KEY=your_app_key_here
NHN_SECRET_KEY=your_secret_key_here
NHN_SEND_NO=010-1234-5678
ADMIN_PASSWORD=your_strong_password
```

---

## 📞 지원

문제가 지속되면:
1. Vercel 대시보드의 **Support** 탭 확인
2. Build Logs에서 오류 메시지 확인
3. GitHub Issues에 문의: https://github.com/yonghot/88-company-web/issues

---

*최종 업데이트: 2025년 9월 18일*