import { useEffect } from 'react';
import { Slot } from 'expo-router';

export default function WebLayout() {
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
