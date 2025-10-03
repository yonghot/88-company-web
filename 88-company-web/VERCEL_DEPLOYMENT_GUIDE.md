# 📚 Vercel 배포 가이드 - SMS 환경 변수 설정

## 🚨 중요: 프로덕션 SMS 설정

프로덕션 환경에서 SMS가 작동하려면 **반드시** Vercel에 환경 변수를 설정해야 합니다.

## 📝 필수 환경 변수

### 1. Vercel Dashboard 접속
1. https://vercel.com 로그인
2. `88-company-web` 프로젝트 선택
3. **Settings** → **Environment Variables** 이동

### 2. 다음 환경 변수 추가

| 변수명 | 값 | 설명 | 환경 |
|--------|---|------|------|
| `SMS_PROVIDER` | `nhncloud` | SMS 프로바이더 설정 | Production, Preview, Development |
| `NHN_APP_KEY` | `V9bJ5oBpB0O009Pl` | NHN Cloud App Key | Production, Preview, Development |
| `NHN_SECRET_KEY` | `GgpYWYExRH1AtgnU1gByX4jwBsHna6E5` | NHN Cloud Secret Key | Production, Preview, Development |
| `NHN_SEND_NO` | `010-5317-9499` | 발신 번호 | Production, Preview, Development |
| `ADMIN_PASSWORD` | `159753` | 관리자 페이지 비밀번호 | Production, Preview, Development |
| `ENABLE_PRODUCTION_LOGS` | `true` | 프로덕션 로깅 활성화 (선택) | Production |

### 3. 🔴 중요: Supabase 환경 변수 (필수!)

데이터를 영구 저장하려면 **반드시** 설정해야 합니다:

| 변수명 | 값 | 설명 | 환경 |
|--------|---|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tjizerpeyteokqhufqea.supabase.co` | Supabase URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaXplcnBleXRlb2txaHVmcWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODkxMTEsImV4cCI6MjA3MzI2NTExMX0.lpw_F9T7tML76NyCm1_6NJ6kyFdXtYsoUehK9ZhZT7s` | Supabase Anon Key | Production, Preview, Development |

**⚠️ 주의**: Supabase가 설정되지 않으면 리드 데이터가 저장되지 않습니다!

## ⚠️ 주의사항

### NEXT_PUBLIC_ 접두사
- `SMS_PROVIDER`, `NHN_APP_KEY`, `NHN_SECRET_KEY`, `NHN_SEND_NO`는 **서버 사이드 전용**
- 보안상 `NEXT_PUBLIC_` 접두사를 붙이면 안 됩니다
- 클라이언트에서 접근할 수 없어야 합니다

### 환경별 설정
- **Production**: 실제 서비스용
- **Preview**: PR 및 브랜치 배포용
- **Development**: 개발 환경용

모든 환경에 동일하게 설정하는 것을 권장합니다.

## 🔍 설정 확인 방법

### 1. Debug API 사용
```bash
# 프로덕션
curl https://88-company-web.vercel.app/api/debug-sms

# 로컬
curl http://localhost:3000/api/debug-sms
```

예상 응답:
```json
{
  "smsConfig": {
    "SMS_PROVIDER": "nhncloud",
    "NHN_APP_KEY": "SET",
    "NHN_SECRET_KEY": "GgpY***E5",
    "NHN_SEND_NO": "010-5317-9499"
  },
  "analysis": {
    "hasNHNConfig": true
  }
}
```

### 2. 테스트 SMS API 사용 (새로 추가!)
```bash
# 프로덕션 테스트 (관리자 비밀번호 필요)
curl -X GET "https://88-company-web.vercel.app/api/test-sms?phone=010-1234-5678" \
  -H "x-admin-password: 159753"

# 헬스체크
curl -X POST "https://88-company-web.vercel.app/api/test-sms/health" \
  -H "x-admin-password: 159753"
```

### 3. 실제 SMS 테스트
1. https://88-company-web.vercel.app 접속
2. 챗봇에서 전화번호 입력 단계까지 진행
3. 실제 전화번호 입력
4. SMS 수신 확인

## 🐛 문제 해결

### SMS가 발송되지 않는 경우

1. **환경 변수 확인**
   - Vercel Dashboard에서 모든 환경 변수가 설정되어 있는지 확인
   - 특히 `SMS_PROVIDER=nhncloud` 확인

2. **재배포**
   - 환경 변수 추가 후 반드시 재배포 필요
   ```bash
   vercel --prod
   ```

3. **Function Logs 확인**
   - Vercel Dashboard → Functions → Logs
   - `/api/verify` 함수의 로그 확인

### Demo 모드로 전환되는 경우

환경 변수가 제대로 설정되지 않으면 자동으로 Demo 모드로 전환됩니다:
- `SMS_PROVIDER`가 설정되지 않음
- `NHN_APP_KEY`, `NHN_SECRET_KEY`, `NHN_SEND_NO` 중 하나라도 없음

## 📱 Demo 모드 vs Production 모드

| 모드 | SMS 발송 | 인증번호 표시 | 용도 |
|------|---------|--------------|------|
| Demo | ❌ | ✅ (화면에 표시) | 개발/테스트 |
| Production | ✅ | ❌ | 실제 서비스 |

## 🔄 환경 변수 업데이트 절차

1. Vercel Dashboard에서 환경 변수 수정
2. 저장 (Save 버튼 클릭)
3. 재배포 트리거:
   - 방법 1: GitHub에 커밋 푸시
   - 방법 2: Vercel Dashboard에서 Redeploy
   - 방법 3: CLI에서 `vercel --prod`

## 📞 지원

문제가 지속되면:
1. NHN Cloud Console에서 SMS 서비스 상태 확인
2. 발신번호 승인 상태 확인
3. API Key/Secret Key 유효성 확인

---
작성일: 2025-01-22
최종 업데이트: SMS 프로덕션 설정 가이드