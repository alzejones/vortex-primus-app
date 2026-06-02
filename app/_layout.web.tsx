if (typeof window !== 'undefined') {
  window.onerror = (msg, src, line, col, err) =>
    console.log('[ERRO GLOBAL]', msg, 'linha', line, err?.stack);
  window.addEventListener('unhandledrejection', (e) =>
    console.log('[PROMISE REJEITADA]', e.reason?.stack || e.reason));
}
console.log('[DEBUG WEB 1] _layout.web.tsx carregado');

import { useEffect } from 'react';
import { Slot } from 'expo-router';

export default function WebLayout() {
  console.log('[DEBUG WEB 2] render web');
  useEffect(() => {
    // Força scroll em todos os containers do Expo Web
    const style = document.createElement('style');
    style.innerHTML = `
      html, body { height: 100% !important; overflow: auto !important; }
      #root, [data-rnw-portal], div[style*="overflow: hidden"] { overflow: visible !important; }
      body > div, body > div > div { height: auto !important; min-height: 100% !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return <Slot />;
}
