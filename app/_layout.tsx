import { Slot } from "expo-router";
import { View } from "react-native";
import StripeWrapper from "../components/StripeWrapper"; // 🔴 Importação do nosso Wrapper inteligente
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { T } from "../utils/theme";

console.log('[DEBUG 1] _layout.tsx carregado');

export default function RootLayout() {
  console.log('[DEBUG 2] componente raiz renderizando');
  console.log('[DEBUG 3] iniciando providers');
  return (
    <StripeWrapper publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}>
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