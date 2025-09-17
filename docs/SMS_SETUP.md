# NHN Cloud SMS 인증 시스템 설정 가이드

## 📱 개요

본 시스템은 NHN Cloud SMS API를 사용한 휴대폰 본인 인증 시스템입니다.
안전하고 신뢰할 수 있는 사용자 인증을 제공합니다.

## 🚀 주요 기능

### 보안 기능
- ✅ **보안 강화된 인증번호 생성**: crypto 모듈 사용
- ✅ **Rate Limiting**: 무차별 대입 공격 방지
- ✅ **일일 발송 한도**: 10회 제한
- ✅ **재발송 간격 제한**: 최소 60초
- ✅ **인증 시도 횟수 제한**: 5회
- ✅ **만료 시간**: 3분
- ✅ **중복 번호 검증**

### 사용자 경험 개선
- 🎨 **직관적인 UI/UX**: 시각적 피드백 강화
- ⏱️ **실시간 타이머**: 남은 시간 표시
- 📊 **진행 상태 표시**: 6자리 입력 진행도
- ♿ **접근성 개선**: ARIA 속성, 키보드 지원
- 📱 **모바일 최적화**: 숫자 키패드 자동 표시

### 에러 처리
- 🔄 **자동 재시도**: 최대 3회 자동 재시도
- 📝 **상세한 에러 메시지**: 사용자 친화적 안내
- 🔧 **점진적 지연**: 재시도 시 지연 시간 증가

## ⚙️ 환경 변수 설정

### 필수 환경 변수

`.env.local` 파일에 다음 설정을 추가하세요:

```env
# NHN Cloud SMS 설정 (필수)
NHN_APP_KEY=your_app_key_here
NHN_SECRET_KEY=your_secret_key_here
NHN_SEND_NO=010-1234-5678  # 사전 등록된 발신번호

# NHN Cloud SMS 추가 설정 (선택)
NHN_PROJECT_ID=your_project_id  # 프로젝트 ID (선택사항)
NHN_API_URL=https://api-sms.cloud.toast.com  # API 엔드포인트 (기본값 사용 권장)

# 개발 환경 설정
NODE_ENV=development  # production으로 변경 시 보안 강화
SHOW_DEMO_CODE=true   # 개발 환경에서 인증번호 표시 (production에서는 false)

# Supabase 설정 (선택 - 인증 코드 저장용)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# 관리자 설정 (선택)
ADMIN_SECRET_KEY=your_admin_secret  # 통계 조회용 API 키
```

## 🔧 NHN Cloud 설정 방법

### 1. NHN Cloud Console 접속
1. [NHN Cloud Console](https://console.toast.com) 로그인
2. 프로젝트 선택 또는 생성

### 2. SMS 서비스 활성화
1. 좌측 메뉴에서 **Notification > SMS** 선택
2. **서비스 활성화** 클릭
3. 약관 동의 후 활성화

### 3. App Key 및 Secret Key 확인
1. SMS 서비스 대시보드에서 **URL & Appkey** 클릭
2. **App Key** 복사 → `NHN_APP_KEY`에 설정
3. **Secret Key** 복사 → `NHN_SECRET_KEY`에 설정

### 4. 발신번호 등록
1. **발신번호 관리** 메뉴 선택
2. **발신번호 등록** 클릭
3. 사업자등록증 및 통신서비스 이용 증명 서류 제출
4. 승인 완료 후 발신번호 → `NHN_SEND_NO`에 설정

> ⚠️ **중요**: 발신번호는 반드시 사전 등록 및 승인이 필요합니다.

## 📊 사용량 및 요금

### NHN Cloud SMS 요금 (2024년 기준)
- **단문 SMS (90바이트 이하)**: 8.5원/건
- **장문 SMS (2000바이트 이하)**: 25원/건
- **MMS**: 110원/건

### 월 예상 비용 계산
```
일일 인증 건수: 100건
월 인증 건수: 3,000건
월 예상 비용: 25,500원 (단문 기준)
```

## 🔐 보안 권장사항

### Production 환경 설정
```env
NODE_ENV=production
SHOW_DEMO_CODE=false
```

### 추가 보안 강화 방법
1. **IP 화이트리스트**: NHN Cloud Console에서 허용 IP 설정
2. **HTTPS 필수**: 모든 API 통신은 HTTPS 사용
3. **환경 변수 암호화**: Vercel 등 호스팅 서비스의 암호화 기능 활용
4. **로그 관리**: 민감 정보 로깅 방지

## 🧪 테스트 방법

### 1. 개발 환경 테스트
```bash
# 환경 변수 확인
npm run test:env

# SMS 발송 테스트
npm run test:sms

# 전체 인증 플로우 테스트
npm run test:verification
```

### 2. 수동 테스트 체크리스트
- [ ] 인증번호 발송 성공
- [ ] 3분 타이머 정상 작동
- [ ] 인증번호 입력 및 검증
- [ ] 재발송 기능
- [ ] 일일 한도 제한
- [ ] 에러 메시지 표시
- [ ] 모바일 환경 테스트

## 📈 모니터링

### 통계 API 사용
```bash
# 인증 서비스 통계 조회
curl -H "Authorization: Bearer YOUR_ADMIN_SECRET_KEY" \
  http://localhost:3000/api/verify/stats
```

### 응답 예시
```json
{
  "success": true,
  "stats": {
    "provider": "NHN Cloud",
    "rateLimiter": {
      "totalEntries": 45,
      "blockedNumbers": 2,
      "recentAttempts": 15
    },
    "todayCount": 123,
    "activeVerifications": 5,
    "dailyLimit": 10
  }
}
```

## 🚨 문제 해결

### 자주 발생하는 문제

#### 1. "NHN Cloud SMS 설정이 필요합니다" 오류
**원인**: 환경 변수가 설정되지 않음
**해결**: `.env.local` 파일에 필수 환경 변수 추가

#### 2. "발신번호가 등록되지 않았습니다" 오류
**원인**: NHN Cloud에 발신번호 미등록
**해결**: NHN Cloud Console에서 발신번호 등록 및 승인 대기

#### 3. "인증번호 발송 실패" 반복
**원인**: API Key 불일치 또는 네트워크 문제
**해결**:
- App Key, Secret Key 재확인
- NHN Cloud 서비스 상태 확인
- 네트워크 연결 확인

#### 4. Rate Limiting 오류
**원인**: 너무 빈번한 요청
**해결**: 60초 대기 후 재시도

## 📚 참고 자료

- [NHN Cloud SMS API 문서](https://docs.toast.com/ko/Notification/SMS/ko/api-guide/)
- [NHN Cloud Console](https://console.toast.com)
- [Next.js 환경 변수 문서](https://nextjs.org/docs/basic-features/environment-variables)

## 🤝 지원

문제가 지속되면 다음 채널로 문의하세요:
- NHN Cloud 기술 지원: 1600-7430
- GitHub Issues: [88-company-web/issues](https://github.com/yonghot/88-company-web/issues)

---

*최종 업데이트: 2025년 1월*