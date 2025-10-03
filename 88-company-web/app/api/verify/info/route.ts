import { NextResponse } from 'next/server';

/**
 * GET /api/verify/info
 * API 사용 안내 페이지
 */
export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>88 Company - SMS 인증 API</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 800px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
      background: linear-gradient(to right, #00E5DB, #00C7BE);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      display: inline-block;
      background: #00E5DB;
      color: #1a1a1a;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
    }
    h2 {
      color: #00E5DB;
      font-size: 1.3rem;
      margin-bottom: 15px;
    }
    code {
      background: rgba(0, 0, 0, 0.3);
      padding: 3px 8px;
      border-radius: 5px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9rem;
    }
    pre {
      background: rgba(0, 0, 0, 0.3);
      padding: 15px;
      border-radius: 10px;
      overflow-x: auto;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
    }
    a {
      color: #00E5DB;
      text-decoration: none;
      font-weight: bold;
    }
    a:hover {
      text-decoration: underline;
    }
    .warning {
      background: rgba(255, 152, 0, 0.2);
      border-left: 4px solid #ff9800;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>SMS 인증 API</h1>
    <div class="badge">88 Company API v1.0</div>

    <div class="warning">
      ⚠️ 브라우저로 직접 접속하신 것 같습니다. 이 페이지는 API 엔드포인트입니다.
    </div>

    <div class="section">
      <h2>📱 SMS 인증 발송</h2>
      <p><strong>Method:</strong> <code>POST</code></p>
      <p><strong>URL:</strong> <code>/api/verify</code></p>
      <pre>{
  "action": "send",
  "phone": "010-1234-5678"
}</pre>
    </div>

    <div class="section">
      <h2>✅ 인증번호 확인</h2>
      <p><strong>Method:</strong> <code>POST</code></p>
      <p><strong>URL:</strong> <code>/api/verify</code></p>
      <pre>{
  "action": "verify",
  "phone": "010-1234-5678",
  "code": "123456"
}</pre>
    </div>

    <div class="section">
      <h2>📊 통계 조회 (관리자 전용)</h2>
      <p><strong>Method:</strong> <code>GET</code></p>
      <p><strong>URL:</strong> <code>/api/verify</code></p>
      <p><strong>Headers:</strong></p>
      <pre>Authorization: Bearer {ADMIN_SECRET_KEY}</pre>
    </div>

    <div class="section">
      <h2>🧪 테스트 도구</h2>
      <p>API를 테스트하려면 아래 페이지를 방문하세요:</p>
      <p><a href="/test-verify">👉 /test-verify - API 테스트 페이지</a></p>
    </div>

    <div style="text-align: center; margin-top: 40px; opacity: 0.7;">
      <p>88 Company © 2025</p>
      <p><a href="/">메인 페이지로 돌아가기</a></p>
    </div>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}