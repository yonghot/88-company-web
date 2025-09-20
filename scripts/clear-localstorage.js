// localStorage 완전 제거 스크립트
// 브라우저 콘솔에서 실행하거나 관리자 페이지에 추가할 수 있습니다.

function clearAllLocalStorage() {
  console.log('🧹 Clearing all localStorage data...');

  // 현재 도메인의 모든 localStorage 키 가져오기
  const keys = Object.keys(localStorage);
  console.log(`Found ${keys.length} keys in localStorage:`, keys);

  // 특히 문제가 될 수 있는 키들
  const problematicKeys = [
    'admin_questions',
    'questions',
    'chat_questions',
    'chatQuestions',
    'questionFlow',
    'questionsCache'
  ];

  // 문제가 될 수 있는 키들 먼저 제거
  problematicKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`❌ Removing problematic key: ${key}`);
      localStorage.removeItem(key);
    }
  });

  // 모든 localStorage 데이터 제거
  localStorage.clear();

  console.log('✅ localStorage cleared successfully!');
  console.log('🔄 Please refresh the page to ensure changes take effect.');

  // 확인
  if (Object.keys(localStorage).length === 0) {
    console.log('✨ Verification: localStorage is completely empty');
  } else {
    console.warn('⚠️ Warning: Some localStorage data still remains:', Object.keys(localStorage));
  }
}

// 브라우저 콘솔에서 실행하려면:
// clearAllLocalStorage();

// 또는 페이지 로드 시 자동으로 실행하려면:
if (typeof window !== 'undefined') {
  // URL 파라미터로 제어할 수 있도록
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('clearStorage') === 'true') {
    clearAllLocalStorage();
    // URL에서 파라미터 제거
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = clearAllLocalStorage;
}