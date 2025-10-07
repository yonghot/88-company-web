# 소셜 미디어 캐시 초기화 가이드

## 카카오톡 링크 캐시 초기화

1. 카카오톡 개발자 도구 접속:
   https://developers.kakao.com/tool/clear/og

2. URL 입력: `https://www.88-company.com`

3. "초기화" 버튼 클릭

4. 완료 후 카카오톡에서 링크 다시 공유하여 확인

## 페이스북 링크 캐시 초기화

1. 페이스북 공유 디버거 접속:
   https://developers.facebook.com/tools/debug/

2. URL 입력: `https://www.88-company.com`

3. "디버그" 버튼 클릭

4. "다시 가져오기" 버튼 클릭하여 캐시 갱신

## 트위터/X 카드 검증

1. Twitter Card Validator 접속:
   https://cards-dev.twitter.com/validator

2. URL 입력하여 메타데이터 확인

## 배포된 메타데이터 확인 (현재 상태)

실제 배포된 HTML에는 다음 메타데이터가 올바르게 포함되어 있습니다:

```html
<!-- Favicon -->
<link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16"/>
<link rel="icon" href="/88-logo.png"/>
<link rel="apple-touch-icon" href="/88-logo.png"/>

<!-- OpenGraph -->
<meta property="og:title" content="에이티에잇 컴퍼니"/>
<meta property="og:description" content="예비창업자를 위한 최저가 토털 솔루션"/>
<meta property="og:url" content="https://www.88-company.com"/>
<meta property="og:site_name" content="88 Company"/>
<meta property="og:locale" content="ko_KR"/>
<meta property="og:type" content="website"/>
<meta property="og:image" content="https://www.88-company.com/og-image.png"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="에이티에잇 컴퍼니"/>
<meta name="twitter:description" content="예비창업자를 위한 최저가 토털 솔루션"/>
<meta name="twitter:image" content="https://www.88-company.com/og-image.png"/>
```

## 주의사항

- **즉시 반영되지 않음**: SNS 플랫폼은 최소 수 분에서 수 시간까지 캐시를 유지할 수 있습니다
- **재공유 필요**: 캐시 초기화 후 링크를 다시 공유해야 새 메타데이터가 적용됩니다
- **브라우저별 차이**: 브라우저마다 파비콘 캐싱 정책이 다를 수 있습니다
