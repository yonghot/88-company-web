'use client';

import { useEffect, useState } from 'react';

export function MetaPixelDebug() {
  const [debugInfo, setDebugInfo] = useState({
    pixelId: '',
    fbqExists: false,
    scriptLoaded: false,
  });

  useEffect(() => {
    const checkMetaPixel = () => {
      const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || 'NOT SET';
      const fbqExists = typeof window.fbq === 'function';
      const scriptLoaded = !!document.querySelector('script[src*="facebook.net/en_US/fbevents.js"]');

      setDebugInfo({ pixelId, fbqExists, scriptLoaded });

      console.log('=== Meta Pixel Debug (Component) ===');
      console.log('Pixel ID:', pixelId);
      console.log('fbq exists:', fbqExists);
      console.log('Script loaded:', scriptLoaded);
    };

    setTimeout(checkMetaPixel, 1000);
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 text-black dark:text-white p-4 rounded-lg shadow-lg text-xs z-50">
      <div className="font-bold mb-2">🔍 Meta Pixel Debug</div>
      <div>Pixel ID: {debugInfo.pixelId}</div>
      <div>fbq 함수: {debugInfo.fbqExists ? '✅' : '❌'}</div>
      <div>스크립트: {debugInfo.scriptLoaded ? '✅' : '❌'}</div>
    </div>
  );
}
