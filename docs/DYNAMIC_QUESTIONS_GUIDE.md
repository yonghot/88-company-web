# 동적 질문 관리 시스템 가이드

## 📌 개요
Supabase를 활용한 실시간 챗봇 질문 편집 시스템입니다. 재배포 없이 관리자 페이지에서 질문을 추가, 수정, 삭제할 수 있습니다.

## 🚀 주요 기능

### 1. 실시간 질문 편집
- 관리자 페이지에서 질문 내용, 타입, 순서 변경
- 재배포 없이 즉시 반영
- 드래그 앤 드롭으로 순서 조정

### 2. 폴백 시스템
- Supabase 연결 실패시 자동으로 정적 질문 사용
- 무중단 서비스 보장
- 캐싱으로 성능 최적화 (5분 TTL)

### 3. 질문 타입
- `text`: 단문 입력
- `textarea`: 장문 입력
- `select`: 드롭다운 선택
- `quick-reply`: 빠른 답변 버튼
- `verification`: 휴대폰 인증

## 🔧 설정 방법

### 1. Supabase 설정
```bash
# Supabase 대시보드에서 SQL Editor 열기
# supabase/migrations/002_chat_questions.sql 내용 실행
```

### 2. 환경 변수 설정
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ADMIN_SECRET_KEY=your_admin_secret
```

### 3. 관리자 페이지 접속
```
/admin/questions
```

## 📝 사용 방법

### 질문 추가
1. "새 질문 추가" 버튼 클릭
2. 필수 정보 입력:
   - Step ID: 고유 식별자 (예: custom_question)
   - Type: 질문 유형 선택
   - Question: 질문 내용
   - Next Step: 다음 단계 ID
3. "저장" 클릭

### 질문 수정
1. 질문 카드의 편집 아이콘 클릭
2. 내용 수정
3. "저장" 클릭
4. 관리자 비밀번호 입력

### 순서 변경
- 위/아래 화살표로 순서 조정
- 자동 저장

### 질문 삭제
- 휴지통 아이콘 클릭
- 확인 후 관리자 비밀번호 입력

## 🔄 질문 플로우 예시

```javascript
{
  step: "service_type",
  type: "quick-reply",
  question: "어떤 서비스를 찾고 계신가요?",
  options: ["컨설팅", "프로토타입", "사업계획서"],
  next_step: "budget"
}
↓
{
  step: "budget",
  type: "select",
  question: "예산은 어느 정도이신가요?",
  options: ["88만원 이하", "88~200만원", "200만원 이상"],
  next_step: "timeline"
}
↓
{
  step: "timeline",
  type: "quick-reply",
  question: "언제까지 완료되어야 하나요?",
  options: ["1개월", "3개월", "6개월"],
  next_step: "name"
}
```

## 🛡️ 보안

### API 인증
- 모든 수정/삭제 작업은 `ADMIN_SECRET_KEY` 필요
- Bearer 토큰 방식 인증

### RLS (Row Level Security)
- 읽기: 공개 (is_active = true)
- 쓰기: service_role만 가능

## 🐛 문제 해결

### Supabase 연결 실패
- 환경 변수 확인
- Supabase 프로젝트 상태 확인
- 자동으로 정적 질문 폴백

### 질문이 반영되지 않음
- 캐시 TTL (5분) 대기
- 브라우저 새로고침
- `/admin/questions`에서 "새로고침" 클릭

### 관리자 페이지 접근 불가
- `ADMIN_SECRET_KEY` 환경 변수 설정 확인
- 올바른 비밀번호 입력

## 📊 데이터베이스 스키마

### chat_questions 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| step | TEXT | 단계 식별자 |
| type | TEXT | 질문 타입 |
| question | TEXT | 질문 내용 |
| placeholder | TEXT | 입력 힌트 |
| options | JSONB | 선택 옵션 |
| validation | JSONB | 검증 규칙 |
| next_step | TEXT | 다음 단계 |
| order_index | INTEGER | 순서 |
| is_active | BOOLEAN | 활성 여부 |

### chat_flows 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | 고유 ID |
| name | TEXT | 플로우 이름 |
| start_step | TEXT | 시작 단계 |
| is_active | BOOLEAN | 활성 여부 |

## 🚀 향후 개선사항
- [ ] 드래그 앤 드롭 순서 변경
- [ ] 질문 미리보기 기능
- [ ] A/B 테스팅 지원
- [ ] 다국어 질문 관리
- [ ] 조건부 분기 지원