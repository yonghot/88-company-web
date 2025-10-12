# Vercel 배포 전략 설명

## Preview vs Production 배포

### Preview 배포 (자동)
- **트리거**: 모든 Git push (master 포함)
- **URL**: 고유한 URL (예: `https://88-company-7uypg3n62-...vercel.app`)
- **목적**: 테스트 및 검토
- **Production 영향**: 없음

### Production 배포 (조건부 자동)
- **트리거**: Production Branch에 push (설정에서 지정)
- **URL**: 도메인 연결 (예: `https://www.88-company.com`)
- **목적**: 실제 사용자 서비스
- **Production 영향**: 실제 사이트 업데이트

## 왜 Preview와 Production이 다른가?

### Vercel 프로젝트 설정 확인 필요

현재 상황:
- ✅ Preview 배포: 자동 작동 (모든 push마다 생성됨)
- ❌ Production 배포: 자동 작동 안 함

**근본 원인**: Production Branch 설정이 `master`가 아닐 가능성

## 해결 방법

### 1. Vercel 대시보드에서 설정 확인

1. **Vercel 대시보드 접속**
   ```
   https://vercel.com/sk1597530-3914s-projects/88-company-web/settings
   ```

2. **Git → Production Branch 확인**
   - Settings → Git → Production Branch
   - 현재 값이 `master`가 아닐 수 있음
   - `master`로 변경 후 Save

3. **설정 후**
   - 다음 push부터 자동으로 Production 배포됨
   - Preview 배포도 계속 생성됨

### 2. 왜 이런 설정이 필요한가?

**다중 브랜치 전략 지원**:
- `master`: Staging 환경
- `production`: Production 환경
- `develop`: Development 환경

**예시**:
```
develop → Preview 배포 (개발자 테스트)
master → Preview 배포 (QA 테스트)
production → Production 배포 (실제 서비스)
```

## 현재 프로젝트 권장 설정

**단일 브랜치 전략** (master만 사용):
- Production Branch: `master`
- 모든 push가 Preview + Production 배포
- 가장 간단하고 빠른 배포

## 임시 해결책 (현재 사용 중)

```bash
# 최신 Preview 배포를 Production으로 승격
npx vercel promote <preview-url> --yes
```

**단점**:
- 매번 수동으로 승격 필요
- 자동화 불가

## 영구 해결책

Vercel 대시보드 설정 변경:
1. Production Branch를 `master`로 설정
2. 다음 push부터 자동 Production 배포

## Git Workflow 권장사항

### 현재 (문제 있음)
```
git push origin master
→ Preview 배포만 생성
→ 수동 승격 필요
```

### 수정 후 (권장)
```
git push origin master
→ Preview 배포 + Production 배포 자동 생성
→ 수동 작업 불필요
```

## 다음 단계

1. **Vercel 대시보드 설정 확인**
   - Production Branch가 `master`인지 확인
   - 아니면 `master`로 변경

2. **테스트**
   ```bash
   git commit --allow-empty -m "test: production deployment"
   git push origin master
   ```

3. **확인**
   ```bash
   npx vercel ls --prod
   ```
   - 새로운 Production 배포가 자동으로 생성되어야 함

이렇게 설정하면 앞으로는 수동 승격 없이 자동으로 배포됩니다! 🚀
