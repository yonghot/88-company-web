'use client';

import { useEffect } from 'react';

export default function GoogleAnalytics() {
  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

    if (!measurementId) {
      console.log('[GoogleAnalytics] Measurement ID가 설정되지 않았습니다.');
      return;
    }

    try {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `;
      document.head.appendChild(script2);

      console.log('[GoogleAnalytics] 초기화 완료:', measurementId);
    } catch (error) {
      console.error('[GoogleAnalytics] 초기화 실패:', error);
    }
  }, []);

  return null;
}
