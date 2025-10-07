# 프로덕션 웰컴 메시지 이슈 해결 가이드

## ✅ 해결 완료 (2025-10-07)

**모든 문제가 해결되었습니다!**
- ✅ Vercel 배포 완료 (커밋 `4d82ce3`)
- ✅ Preview 배포를 Production으로 승격 완료
- ✅ 데이터베이스 웰컴 메시지 업데이트 완료
- ✅ 캐시 새로고침 완료 (12개 질문 로드)
- ✅ 프로덕션 데이터베이스 검증 완료

**주요 이슈**: Vercel 프로젝트 설정에서 Production Branch가 `master`로 설정되어 있지 않아 Preview로만 배포됨
- **해결**: `npx vercel promote <preview-url> --yes`로 Preview 배포를 Production으로 승격

**다음 단계**:
1. Vercel 대시보드 → Settings → Git → Production Branch를 `master`로 변경 (향후 자동 배포 위해)
2. 프로덕션 사이트 테스트: https://www.88-company.com

---

## 🔍 문제 증상 (해결됨)

- ❌ 웰컴 메시지만 출력됨 (첫 질문 미출력)
- ❌ text 타입 입력 필드 표시 (웰컴 메시지용)
- ❌ 진행도 11단계로 표시

## 🎯 근본 원인

### 원인 1: 프로덕션 코드 버전 불일치
프로덕션에 배포된 코드가 order_index=0을 제외하지 않음

**변경 전 코드** (프로덕션):
```typescript
getActiveQuestions(): ChatQuestion[] {
  return this.questionsCache
    .filter(q => q.order_index !== 999)  // ❌ order_index=0 포함
    .sort((a, b) => a.order_index - b.order_index);
}
```

**변경 후 코드** (최신):
```typescript
getActiveQuestions(): ChatQuestion[] {
  return this.questionsCache
    .filter(q => q.order_index !== 999 && q.order_index !== 0)  // ✅ order_index=0 제외
    .sort((a, b) => a.order_index - b.order_index);
}
```

### 원인 2: 웰컴 메시지 내용 불일치
프로덕션 데이터베이스에 이미 다른 웰컴 메시지가 존재

## ✅ 해결 방법

### 1단계: Vercel 배포 확인

```bash
# Vercel 대시보드 확인
https://vercel.com/yonghot/88-company-web/deployments

# 최신 커밋 확인
Git Commit: bce8bca (feat: 챗봇 웰컴 메시지 기능 구현)
```

#### 배포 상태 확인 방법:
1. Vercel 대시보드 접속
2. 최신 배포가 "Ready" 상태인지 확인
3. 커밋 해시가 `bce8bca`인지 확인

### 2단계: 웰컴 메시지 업데이트 (✅ 완료)

```bash
cd 88-company-web
npx tsx scripts/update-welcome-message.ts
```

결과:
```
✅ Welcome message updated successfully!
```

### 3단계: Vercel 배포 대기

- Vercel이 최신 커밋을 자동 배포 중
- 일반적으로 2-5분 소요
- 배포 완료 확인: https://vercel.com/yonghot/88-company-web

### 4단계: 캐시 새로고침

#### 방법 A: 관리자 페이지에서 캐시 새로고침
```
1. https://www.88-company.com/admin 접속
2. 비밀번호 입력: 159753
3. "캐시 새로고침" 버튼 클릭
```

#### 방법 B: API로 캐시 새로고침
```bash
curl -X POST https://www.88-company.com/api/admin/refresh-cache \
  -H "Content-Type: application/json" \
  -d '{"password":"159753"}'
```

### 5단계: 프로덕션 테스트

```
https://www.88-company.com
```

**예상 결과**:
1. ✅ 웰컴 메시지 출력:
   ```
   안녕하세요! 88 Company입니다. 👋

   예비창업자를 위한 정부지원사업 컨설팅을 도와드리고 있습니다.
   ...
   ```

2. ✅ 첫 질문 동시 출력:
   ```
   현재 사업자등록증이 없는 예비창업자 이신가요?
   ```

3. ✅ 선택 버튼 표시:
   ```
   [ 예 ] [ 아니오 ]
   ```

4. ✅ 진행도: 0/10 표시

## 🔧 Vercel 배포 트러블슈팅

### 문제: 배포가 완료되지 않음

#### 해결 1: 수동 배포 트리거
```bash
cd 88-company-web
git commit --allow-empty -m "trigger deployment"
git push
```

#### 해결 2: Vercel CLI로 직접 배포
```bash
npx vercel --prod
```

#### 해결 3: Vercel 대시보드에서 Redeploy
1. https://vercel.com/yonghot/88-company-web/deployments
2. 최신 배포 선택
3. "Redeploy" 버튼 클릭
4. "Redeploy to Production" 선택

### 문제: 배포는 완료되었지만 변경사항이 반영되지 않음

#### 해결: Build Cache 삭제
```bash
# Vercel 대시보드에서
Settings → General → Build & Development Settings
→ "Clear Build Cache" 클릭
```

## 📊 검증 체크리스트

프로덕션에서 다음 사항을 확인:

- [ ] 웰컴 메시지 + 첫 질문 동시 출력
- [ ] 입력 필드가 첫 질문용 (select 타입)
- [ ] 진행도 0/10 표시
- [ ] 웰컴 메시지 내용 정확 ("88 Company입니다" 포함)
- [ ] 답변 입력 시 step_1에 저장
- [ ] 답변 후 진행도 1/10으로 변경

## 🐛 여전히 문제가 발생하면

### 디버깅 방법

1. **브라우저 콘솔 확인** (F12):
   ```
   [ChatInterface] ✅ Welcome message added (order_index=0)
   [ChatInterface] ✅ First question added: step_1
   [ChatInterface] Total initial messages: 2
   ```

2. **Network 탭 확인**:
   - `/api/leads` 요청 확인
   - 응답 상태 코드 200 확인

3. **Vercel 로그 확인**:
   ```
   https://vercel.com/yonghot/88-company-web/deployments
   → 최신 배포 클릭 → "Build Logs" 확인
   ```

### 긴급 롤백

문제가 계속되면 이전 버전으로 롤백:

```bash
cd 88-company-web
git revert HEAD
git push
```

또는 Vercel 대시보드에서:
1. 이전 배포 선택 (eb5c68d)
2. "Promote to Production" 클릭

## 📞 지원

문제가 해결되지 않으면:
- GitHub Issue 생성
- Vercel Support 문의
- 로컬 환경에서 재현 확인

## ✅ 완료 후 확인사항

- [ ] 프로덕션 웹사이트 정상 작동
- [ ] 모든 질문 단계 정상 진행
- [ ] 전화번호 인증 정상 작동
- [ ] 완료 메시지 정상 표시
- [ ] 관리자 페이지에서 리드 확인 가능
