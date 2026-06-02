console.log('[DEBUG 0] arquivo iniciando');

import { Slot } from "expo-router";
import { View } from "react-native";
console.log('[DEBUG 0a] imports nativos ok');

import StripeWrapper from "../components/StripeWrapper"; // 🔴 Importação do nosso Wrapper inteligente
console.log('[DEBUG 0b] imports de componentes ok');

import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
console.log('[DEBUG 0c] imports de providers ok');

import { T } from "../utils/theme";
console.log('[DEBUG 0d] todos imports ok');

console.log('[DEBUG 1] _layout.tsx carregado');

export default function RootLayout() {
  console.log('[DEBUG 2] componente raiz renderizando');
  
  console.log('[DEBUG 2a] antes de criar JSX');
  
  console.log('[DEBUG 2b] iniciando StripeWrapper');
  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  console.log('[DEBUG 2c] stripe key obtida:', stripeKey ? 'presente' : 'vazia');
  
  console.log('[DEBUG 2d] iniciando ThemeProvider');
  
  console.log('[DEBUG 2e] iniciando AuthProvider');
  
  console.log('[DEBUG 2f] criando View com theme T.bg:', T.bg);
  
  console.log('[DEBUG 2g] antes do return');
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