import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Button, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function Login() {
  const router = useRouter();
  const { session, loading } = useAuth();

  // 🔍 LOG GERAL DE ESTADO
  useEffect(() => {
    console.log("🧠 SESSION:", session);
    console.log("⏳ LOADING:", loading);
  }, [session, loading]);

  // 🔍 ESCUTA MUDANÇA DE AUTH
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔁 AUTH EVENT:", event);
        console.log("📦 SESSION EVENT:", session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔍 CAPTURA URL DE RETORNO (CRÍTICO)
  useEffect(() => {
    const handleUrl = (url: string) => {
      console.log("🌍 URL RECEBIDA:", url);
    };
    
  }, []);

  // 🔍 REDIRECIONAMENTO
  useEffect(() => {
    if (loading) return;

    if (session) {
      console.log("✅ REDIRECIONANDO PARA PROTECTED");
      router.replace("/(protected)");
    }
  }, [session, loading]);

  // 🚀 LOGIN GOOGLE
  async function handleLogin() {
    console.log("🔥 INICIANDO LOGIN GOOGLE");

    const redirectUrl = "https://vortex-primus-app.vercel.app";

    console.log("🔗 REDIRECT URL:", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    console.log("📤 RESPONSE signInWithOAuth:", data);
    if (error) console.log("❌ ERROR:", error);
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>LOGIN DEBUG MODE</Text>
      <Button title="Entrar com Google" onPress={handleLogin} />
    </View>
  );
}

