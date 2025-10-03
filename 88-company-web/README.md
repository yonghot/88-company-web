# 88 - 리드 생성 챗봇

비즈니스 성장을 위한 전문 컨설팅 리드 생성 챗봇 웹앱입니다.

## 🚀 주요 기능

- 💬 대화형 챗봇 인터페이스
- 📱 휴대폰 번호 인증 시스템
- 📊 관리자 대시보드
- 📥 Excel 다운로드 기능
- 🌙 다크 모드 디자인
- 📱 모바일 반응형

## 🛠️ 기술 스택

- **Framework**: Next.js 15.5.3 (Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (또는 로컬 파일 시스템)
- **Deployment**: Vercel
- **Phone Verification**: 자체 구현 (SMS 프로바이더 연동 가능)

## 📦 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/88-company-web.git
cd 88-company-web
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# Supabase Configuration (선택사항)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# SMS Provider (선택사항)
SMS_PROVIDER=demo
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 🗄️ 데이터베이스 설정

### Supabase 사용 시

1. [Supabase](https://app.supabase.com) 에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 파일 실행
3. API 설정에서 URL과 anon key를 `.env.local`에 복사

### 로컬 파일 시스템 사용 시

Supabase 설정 없이도 자동으로 로컬 파일 시스템을 사용합니다.

## 🚀 배포

### Vercel 배포

1. [Vercel](https://vercel.com) 계정 생성
2. GitHub 저장소 연결
3. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy 클릭

### 수동 빌드

```bash
npm run build
npm start
```

## 📂 프로젝트 구조

```
88-company-web/
├── app/
│   ├── api/          # API 라우트
│   ├── admin/        # 관리자 페이지
│   └── page.tsx      # 메인 페이지
├── components/
│   ├── chatbot/      # 챗봇 컴포넌트
│   └── ui/           # UI 컴포넌트
├── lib/
│   ├── chat-flow.ts      # 채팅 플로우 로직
│   ├── chat-questions.ts # 질문 설정
│   ├── supabase.ts       # Supabase 클라이언트
│   └── types.ts          # TypeScript 타입
└── public/
    └── 88-logo.png   # 로고 이미지
```

## 🔧 커스터마이징

### 질문 수정

`lib/chat-questions.ts` 파일에서 질문과 옵션을 수정할 수 있습니다:

```typescript
export const chatQuestions = {
  welcome: {
    question: "안녕하세요! 88입니다...",
    options: ["창업 컨설팅", "투자 유치 지원", ...]
  },
  // ...
};
```

### 스타일 수정

`app/globals.css`에서 색상과 스타일을 변경할 수 있습니다.

## 📱 관리자 페이지

관리자 페이지는 `/admin`에서 접근할 수 있습니다.

기능:
- 리드 목록 조회
- 날짜별 필터링
- Excel 다운로드
- 리드 삭제

## 🔒 보안

- 휴대폰 번호 인증 필수
- 중복 등록 방지
- 환경 변수로 민감한 정보 관리
- Supabase RLS (Row Level Security) 적용

## 📝 라이센스

MIT License

## 🤝 기여

Pull Request와 Issue는 언제나 환영합니다!

## 📞 문의

문제가 있거나 도움이 필요하면 Issue를 생성해주세요.