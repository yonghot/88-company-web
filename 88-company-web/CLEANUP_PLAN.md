# 프로젝트 정리 계획

## 🗑️ 삭제할 파일 (총 25개)

### 1. 구버전 컴포넌트 (5개)
- `components/chatbot/RealTimeChatInterface.tsx` - ChatInterface.tsx로 교체됨
- `components/admin/QuestionCard.tsx` - 드래그앤드롭 UI 제거로 미사용
- `components/admin/QuestionEditModal.tsx` - 질문 편집 UI 제거로 미사용
- `components/admin/ChatPreview.tsx` - 실시간 미리보기 제거로 미사용
- `components/admin/DatabaseStatusIndicator.tsx` - 미사용

### 2. 구버전 서비스 (3개)
- `lib/chat/enhanced-realtime-service.ts` - static-question-service.ts로 교체됨
- `lib/chat/dynamic-question-service.ts` - 더 이상 필요 없음
- `lib/chat/question-manager.ts` - 테스트 페이지에서만 사용

### 3. 구버전 API 라우트 (4개)
- `app/api/admin/questions/route.ts` - CRUD 작업 더 이상 필요 없음
- `app/api/admin/questions/reorder/route.ts` - 재정렬 기능 제거됨
- `app/api/admin/questions/recover/route.ts` - 복구 페이지용
- `app/api/admin/questions/file/route.ts` - 파일 시스템 접근, 미사용 가능성

### 4. 구버전 페이지 (3개)
- `app/test/page.tsx` - 실시간 동기화 테스트용
- `app/recover/page.tsx` - localStorage 복구용
- `app/test-verify/page.tsx` - SMS 검증 테스트용

### 5. 구버전 테스트 스크립트 (7개)
- `scripts/test-realtime-sync.ts` - 실시간 동기화 테스트
- `scripts/test-db-sync.ts` - DB 동기화 테스트
- `scripts/test-ui-components.ts` - 제거된 UI 컴포넌트 테스트
- `scripts/check-cached-questions.ts` - 캐시된 질문 확인
- `scripts/fetch-current-questions.ts` - 현재 질문 가져오기
- `scripts/convert-question-types.ts` - 질문 타입 변환
- `scripts/restore-user-questions.ts` - 사용자 질문 복구

### 6. 구버전 문서 (3개)
- `CLEANUP-REPORT.md` - 이전 정리 보고서
- `IMPROVEMENT-REPORT.md` - 이전 개선 보고서
- `QA-REPORT.md` - 이전 QA 보고서

## ✏️ 수정할 파일 (3개)

### 1. Export 정리
- `lib/chat/index.ts` - DynamicQuestionService export 제거

### 2. API 라우트 정리 (optional)
- `app/api/admin/questions/backups/route.ts` - 사용 여부 확인 후 결정
- 백업 기능이 여전히 필요하면 유지

## 📊 정리 효과 예상

- **파일 수 감소**: 25개 파일 삭제
- **코드베이스 크기**: ~3,000 줄 이상 감소
- **유지보수성**: 단순화된 아키텍처로 개선
- **명확성**: 하나의 질문 관리 방식 (정적 로딩)

## ⚠️ 주의사항

1. **백업 필수**: Git으로 버전 관리되지만 추가 백업 권장
2. **점진적 삭제**: 한 번에 하나씩 삭제하고 테스트
3. **의존성 확인**: 각 파일 삭제 전 참조 확인

## 🔄 실행 순서

1. 파일 삭제 전 현재 상태 커밋
2. 컴포넌트 삭제
3. 서비스 삭제
4. API 라우트 삭제
5. 페이지 삭제
6. 테스트 스크립트 삭제
7. 문서 삭제
8. Export 정리
9. 최종 테스트
10. 정리 완료 커밋
