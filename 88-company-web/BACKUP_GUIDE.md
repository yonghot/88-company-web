# 백업 시스템 가이드

## 📋 개요

88 Company 프로젝트의 데이터베이스 백업 시스템입니다. `leads`와 `chat_questions` 테이블의 데이터를 안전하게 백업하고 복구할 수 있습니다.

## 🏗️ 백업 테이블 구조

### 1. leads_backup 테이블
리드 데이터의 백업 저장소입니다.

**컬럼**:
- `id`, `welcome`, `experience`, `business_idea`, `education`, `occupation`, `region`, `gender`, `age`, `name`, `phone`, `verified` - 원본 리드 데이터
- `original_created_at`, `original_updated_at` - 원본 타임스탬프
- `backup_id` - 백업 고유 ID (Primary Key)
- `backup_created_at` - 백업 생성 시각
- `backup_reason` - 백업 사유
- `backup_created_by` - 백업 생성자

### 2. chat_questions_backup 테이블
챗봇 질문 데이터의 백업 저장소입니다.

**컬럼**:
- `original_id`, `type`, `question`, `placeholder`, `options`, `validation`, `order_index` - 원본 질문 데이터
- `original_created_at`, `original_updated_at` - 원본 타임스탬프
- `backup_id` - 백업 고유 ID (Primary Key)
- `backup_created_at` - 백업 생성 시각
- `backup_reason` - 백업 사유
- `backup_created_by` - 백업 생성자

## 🚀 설정 방법

### 1. 백업 테이블 생성

Supabase SQL Editor에서 다음 SQL 파일을 실행하세요:

```bash
# 파일 위치
supabase/create-backup-tables.sql
```

이 SQL은 다음을 수행합니다:
- ✅ 기존 백업 테이블 삭제 (데이터 포함)
- ✅ 새로운 백업 테이블 생성 (leads_backup, chat_questions_backup)
- ✅ 인덱스 생성
- ✅ RLS 정책 설정
- ✅ 백업 함수 생성 (`backup_all_leads`, `backup_all_questions`)
- ✅ 정리 함수 생성 (`cleanup_old_backups`)
- ✅ 통계 뷰 생성 (`leads_backup_stats`, `questions_backup_stats`)

### 2. 환경 변수 확인

`.env.local` 파일에 다음 변수가 설정되어 있어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 💻 사용 방법

### 기본 사용법

```bash
# 전체 백업 (leads + chat_questions)
npm run backup

# Leads만 백업
npm run backup:leads

# Chat Questions만 백업
npm run backup:questions

# 백업 통계 확인
npm run backup:stats

# 오래된 백업 정리 (30일 기준)
npm run backup:cleanup
```

### 고급 사용법

```bash
# 백업 사유 지정
npx tsx scripts/backup-database.ts -t leads -r "before_migration"

# 백업 + 통계 표시
npx tsx scripts/backup-database.ts -s

# 60일 이상 오래된 백업 정리
npx tsx scripts/backup-database.ts -c --cleanup-days 60

# 도움말
npx tsx scripts/backup-database.ts --help
```

## 📊 백업 통계 조회

### SQL 쿼리로 통계 확인

```sql
-- Leads 백업 통계
SELECT * FROM leads_backup_stats;

-- Chat Questions 백업 통계
SELECT * FROM questions_backup_stats;
```

### 스크립트로 통계 확인

```bash
npm run backup:stats
```

## 🔄 백업 함수 사용

### Supabase SQL Editor에서 직접 실행

```sql
-- Leads 전체 백업
SELECT backup_all_leads('manual_backup');

-- Chat Questions 전체 백업
SELECT backup_all_questions('before_migration');

-- 30일 이상 오래된 백업 정리
SELECT cleanup_old_backups(30);
```

## 🛡️ 백업 복구 방법

### 1. 최신 백업 확인

```sql
-- Leads 최신 백업 조회
SELECT * FROM leads_backup
ORDER BY backup_created_at DESC
LIMIT 10;

-- 특정 리드의 백업 이력 조회
SELECT * FROM leads_backup
WHERE id = '01012345678'
ORDER BY backup_created_at DESC;
```

### 2. 백업에서 복구

```sql
-- 특정 백업으로 복구 (예: 특정 시점으로 롤백)
INSERT INTO leads (
  id, welcome, experience, business_idea, education, occupation,
  region, gender, age, name, phone, verified, created_at, updated_at
)
SELECT
  id, welcome, experience, business_idea, education, occupation,
  region, gender, age, name, phone, verified,
  original_created_at, original_updated_at
FROM leads_backup
WHERE backup_created_at = '2025-10-04 12:00:00+00'
ON CONFLICT (id) DO UPDATE SET
  welcome = EXCLUDED.welcome,
  experience = EXCLUDED.experience,
  business_idea = EXCLUDED.business_idea,
  education = EXCLUDED.education,
  occupation = EXCLUDED.occupation,
  region = EXCLUDED.region,
  gender = EXCLUDED.gender,
  age = EXCLUDED.age,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  verified = EXCLUDED.verified,
  updated_at = NOW();
```

### 3. 특정 리드 복구

```sql
-- 특정 리드만 최신 백업에서 복구
INSERT INTO leads
SELECT
  id, welcome, experience, business_idea, education, occupation,
  region, gender, age, name, phone, verified,
  original_created_at, original_updated_at
FROM leads_backup
WHERE id = '01012345678'
ORDER BY backup_created_at DESC
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  welcome = EXCLUDED.welcome,
  experience = EXCLUDED.experience,
  updated_at = NOW();
```

## ⚙️ 자동 백업 설정 (선택 사항)

### Supabase Cron Job으로 자동 백업

```sql
-- 매일 자정에 자동 백업 (Supabase Pro 이상)
SELECT cron.schedule(
  'daily-backup-leads',
  '0 0 * * *',
  $$SELECT backup_all_leads('auto_daily_backup')$$
);

SELECT cron.schedule(
  'daily-backup-questions',
  '0 0 * * *',
  $$SELECT backup_all_questions('auto_daily_backup')$$
);

-- 매주 일요일 자정에 오래된 백업 정리
SELECT cron.schedule(
  'weekly-cleanup-backups',
  '0 0 * * 0',
  $$SELECT cleanup_old_backups(30)$$
);
```

### GitHub Actions로 자동 백업

`.github/workflows/backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 0 * * *'  # 매일 자정
  workflow_dispatch:  # 수동 실행

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run backup
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## 📌 주의사항

### 1. Service Role Key 보안
- `SUPABASE_SERVICE_ROLE_KEY`는 **절대 클라이언트 사이드에 노출하지 마세요**
- 서버 사이드 스크립트에서만 사용하세요
- GitHub Secrets 또는 환경 변수로 안전하게 관리하세요

### 2. 백업 정리 주기
- 기본값: 30일 이상 오래된 백업 자동 삭제
- 필요에 따라 `cleanup_old_backups()` 함수의 일수 조정
- 중요한 백업은 별도 저장소에 보관 권장

### 3. 백업 용량 관리
- 백업 테이블도 데이터베이스 용량을 차지합니다
- 정기적으로 `backup:stats`로 용량 확인
- 불필요한 백업은 정리하세요

## 🔍 문제 해결

### 백업 실패 시

```bash
# 환경 변수 확인
npm run test:env

# Supabase 연결 확인
npm run test:database

# 백업 함수 존재 확인 (Supabase SQL Editor)
SELECT proname FROM pg_proc WHERE proname LIKE 'backup%';
```

### 백업 테이블이 없는 경우

```bash
# 백업 테이블 재생성
# Supabase SQL Editor에서 supabase/create-backup-tables.sql 실행
```

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-10-04 | v1.0.0 | 백업 시스템 초기 구축 |
| 2025-10-04 | v1.0.0 | leads_backup, chat_questions_backup 테이블 생성 |
| 2025-10-04 | v1.0.0 | 백업 함수 및 스크립트 작성 |

---

**💡 Tip**: 중요한 작업(마이그레이션, 대량 수정 등) 전에는 항상 백업을 먼저 수행하세요!

```bash
# 안전한 작업 순서
npm run backup -r "before_important_task"
# ... 작업 수행 ...
npm run backup:stats  # 백업 확인
```
