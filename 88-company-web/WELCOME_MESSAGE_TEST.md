# 웰컴 메시지 테스트 가이드

## 🎯 목표
웰컴 메시지와 첫 번째 질문이 동시에 출력되고, 사용자는 첫 번째 질문에만 답변하도록 구현

## 📋 테스트 단계

### 1단계: 개발 서버 실행
```bash
cd 88-company-web
npm run dev
```

### 2단계: 브라우저 열기
```
http://localhost:3000
```

### 3단계: 개발자 도구 콘솔 확인
브라우저 개발자 도구(F12)를 열고 콘솔 탭에서 다음 로그를 확인:

#### ✅ 정상 동작 시 로그:
```
[StaticQuestionService] Loading questions from database...
[StaticQuestionService] Successfully loaded 11 questions
[ChatInterface] Loading questions from database...
[ChatInterface] Loaded 10 questions
[ChatInterface] ✅ Welcome message added (order_index=0)
[ChatInterface] Welcome content: 안녕하세요! 88 Company입니다. 👋...
[ChatInterface] ✅ First question added: step_1
[ChatInterface] Total initial messages: 2
[ChatInterface] 🎯 Chat initialized
[ChatInterface] - Current step: step_1
[ChatInterface] - Messages displayed: 2
[ChatInterface] - User will answer: 현재 사업자등록증이 없는 예비창업자 이신가요?...
```

#### ❌ 웰컴 메시지 없을 때 로그:
```
[ChatInterface] ⚠️ No welcome message found (order_index=0)
[ChatInterface] Please run: npx tsx scripts/add-welcome-final.ts
```

### 4단계: 화면 확인
챗봇 화면에서 확인해야 할 사항:

1. **두 개의 봇 메시지가 동시에 표시됨**:
   - 첫 번째: 웰컴 메시지 (안녕하세요! 88 Company입니다...)
   - 두 번째: 첫 질문 (현재 사업자등록증이 없는 예비창업자 이신가요?)

2. **입력 필드는 첫 질문용**:
   - 선택 버튼이 표시됨 (예 / 아니오)
   - 또는 텍스트 입력 필드

3. **진행도는 0/10**:
   - 아직 답변하지 않았으므로 0단계

## 🔧 문제 해결

### 문제 1: 웰컴 메시지가 표시되지 않음

#### 해결 방법 A: 캐시 새로고침
```bash
# 브라우저에서:
http://localhost:3000/admin
# "캐시 새로고침" 버튼 클릭
```

#### 해결 방법 B: 스크립트 재실행
```bash
cd 88-company-web
npx tsx scripts/add-welcome-final.ts
```

#### 해결 방법 C: 수동으로 Supabase에서 확인
1. https://app.supabase.com 접속
2. 프로젝트 선택
3. Table Editor → chat_questions
4. order_index=0 행 확인
5. 없으면 "Insert row" 클릭 후 추가

### 문제 2: 두 메시지가 순차적으로 표시됨

이것은 정상입니다. React가 messages 배열을 순서대로 렌더링하기 때문입니다.
중요한 것은:
- 두 메시지가 **동시에 DOM에 추가**되었다는 점
- 사용자가 **첫 질문에만 답변**할 수 있다는 점

### 문제 3: 진행도가 1/10으로 표시됨

이것은 버그입니다. 다음을 확인:
1. StaticQuestionService의 getTotalSteps()가 order_index=0을 제외하는지
2. ProgressBar의 getProgressSteps()가 올바르게 계산하는지

## ✅ 예상 동작

### 시나리오: 사용자가 챗봇 시작
1. **화면**: 웰컴 메시지 + 첫 질문 동시 표시
2. **진행도**: 0/10
3. **입력**: 첫 질문에 대한 선택 버튼 표시
4. **사용자 액션**: "예" 또는 "아니오" 선택
5. **결과**:
   - 사용자 메시지 추가됨
   - 진행도: 1/10
   - 두 번째 질문 표시됨
   - leadData에 step_1 답변 저장됨

### 데이터 흐름
```
initializeChat() 호출
  ↓
messages = [
  { type: 'bot', content: '안녕하세요! 88 Company...' },  // 웰컴
  { type: 'bot', content: '현재 사업자등록증이...' }      // 첫 질문
]
  ↓
currentStep = 'step_1'
  ↓
입력 필드는 step_1에 대한 것
  ↓
사용자 답변 → leadData['step_1'] = '답변'
```

## 📊 디버깅 체크리스트

- [ ] 개발 서버 실행 중
- [ ] 콘솔에 "Welcome message added" 로그 확인
- [ ] 화면에 두 개의 봇 메시지 표시
- [ ] 입력 필드가 첫 질문용인지 확인 (currentStep=step_1)
- [ ] 진행도가 0/10인지 확인
- [ ] 답변 입력 시 step_1에 저장되는지 확인
- [ ] 답변 후 진행도가 1/10이 되는지 확인
- [ ] 두 번째 질문이 표시되는지 확인

## 🎯 성공 기준

✅ 웰컴 메시지와 첫 질문이 동시에 화면에 표시됨
✅ 입력 필드는 첫 질문에 대한 것만 표시됨
✅ 사용자 답변은 첫 질문(step_1)에 저장됨
✅ 진행도는 웰컴 메시지를 제외하고 계산됨 (0/10 → 1/10)
✅ 웰컴 메시지는 답변 불필요
