# 🚨 긴급 배포 가이드

## 현재 상황

❌ **문제**: 코드가 수정되었지만 Vercel에 배포되지 않음
- 최신 커밋: `81a91d7` (방금 전)
- 최신 배포: 3일 전
- GitHub → Vercel 자동 배포가 작동하지 않음

✅ **정상**: 
- Supabase 데이터베이스: education, occupation 컬럼 존재 확인
- GitHub 코드: API 매핑 로직 올바르게 수정됨

## 🔥 즉시 해야 할 작업

### 옵션 1: Vercel 대시보드에서 수동 배포 (가장 빠름)

1. **Vercel 대시보드 접속**
   ```
   https://vercel.com/sk1597530-3914s-projects/88-company-web
   ```

2. **Deployments 탭 클릭**

3. **"Deploy" 버튼 클릭**
   - Branch: `master` 선택
   - 또는 최신 커밋(`81a91d7`)의 "Redeploy" 버튼 클릭

4. **배포 완료 대기** (약 1-2분)

### 옵션 2: Vercel 설정 수정 후 재배포

1. **Root Directory 설정 수정**
   ```
   https://vercel.com/sk1597530-3914s-projects/88-company-web/settings
   ```

2. **Settings → General → Root Directory**
   - 현재 값: `88-company-web/88-company-web` (잘못됨)
   - 수정 값: `88-company-web` (올바름)
   - Save 클릭

3. **Deployments 탭에서 재배포**

## 🧪 배포 확인 방법

배포 완료 후:

1. **배포 URL 확인**
   ```bash
   cd 88-company-web
   npx vercel ls --prod
   ```

2. **프로덕션 테스트**
   - https://www.88-company.com 접속
   - 챗봇에서 새로운 리드 생성
   - 7번 질문: 학력/전공 입력 → `education` 컬럼에 저장되어야 함
   - 8번 질문: 직업 입력 → `occupation` 컬럼에 저장되어야 함
   - 9번 질문: 이름 입력 → `name` 컬럼에 저장되어야 함

3. **Admin 페이지에서 확인**
   - https://www.88-company.com/admin
   - 새로 생성한 리드 데이터 확인

## 📊 현재 데이터 상태

기존 리드 데이터 (잘못된 매핑으로 저장됨):
- `name` 컬럼: "건대 기계과", "고졸" 등 학력 정보
- `education` 컬럼: null
- `occupation` 컬럼: null

새로운 리드 데이터 (배포 후):
- `name` 컬럼: 실제 이름
- `education` 컬럼: 학력/전공 정보
- `occupation` 컬럼: 직업 정보

## ❌ Supabase에서 할 작업 없음

데이터베이스는 이미 정상입니다:
- ✅ `education` 컬럼 존재
- ✅ `occupation` 컬럼 존재
- ✅ `name` 컬럼 존재

**추가 SQL 작업 불필요!**

## 🎯 다음 단계

1. Vercel 대시보드에서 수동 배포 (옵션 1)
2. 배포 완료 대기 (1-2분)
3. 새로운 테스트 리드 생성
4. Admin 페이지에서 데이터 확인

배포 후 모든 문제가 해결됩니다! 🚀
