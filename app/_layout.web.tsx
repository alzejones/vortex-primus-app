import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import StripeWrapper from '../components/StripeWrapper';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { T } from '../utils/theme';

export default function WebLayout() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      html, body { height: 100% !important; overflow: auto !important; }
      #root, [data-rnw-portal], div[style*="overflow: hidden"] { overflow: visible !important; }
      body > div, body > div > div { height: auto !important; min-height: 100% !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  return (
    <StripeWrapper publishableKey={stripeKey}>
      <ThemeProvider>
        <AuthProvider>
          <View style={{ flex: 1, backgroundColor: T.bg }}>
            <Slot />
          </View>
        </AuthProvider>
      </ThemeProvider>
    </StripeWrapper>
  );
}