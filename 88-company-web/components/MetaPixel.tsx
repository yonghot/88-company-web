'use client';

import { useEffect } from 'react';

export default function MetaPixel() {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  useEffect(() => {
    if (!metaPixelId) {
      console.warn('[MetaPixel] ⚠️ NEXT_PUBLIC_META_PIXEL_ID가 설정되지 않았습니다.');
      return;
    }

    if (typeof window.fbq !== 'undefined') {
      console.log('[MetaPixel] ℹ️ Meta Pixel이 이미 로드되어 있습니다.');
      return;
    }

    console.log('[MetaPixel] 🚀 Meta Pixel 초기화 시작...');
    console.log('[MetaPixel] Pixel ID:', metaPixelId);

    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${metaPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" />`;
    document.body.appendChild(noscript);

    console.log('[MetaPixel] ✅ Meta Pixel 초기화 완료');
    console.log('[MetaPixel] window.fbq 타입:', typeof window.fbq);
  }, [metaPixelId]);

  return null;
}
