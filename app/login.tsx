import { useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Login() {

  // 🌍 DEBUG DA URL ATUAL
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("🌍 CURRENT URL:", window.location.href);
    }
  }, []);

  // 🧠 DEBUG DA SESSÃO INICIAL
  useEffect(() => {
    const getSession = async () => {
      console.log("🚀 GET SESSION START");

      const { data, error } = await supabase.auth.getSession();

      console.log("📦 INITIAL SESSION:", data);
      console.log("❌ INITIAL ERROR:", error);
    };

    getSession();
  }, []);

  // 🔁 DEBUG DE EVENTOS DE AUTH
  useEffect(() => {
    console.log("🧠 INIT AUTH LISTENER");

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔁 AUTH EVENT:", event);
        console.log("📦 SESSION EVENT:", session);
      }
    );

    return () => {
      console.log("🧹 REMOVE LISTENER");
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔐 LOGIN GOOGLE COM DEBUG
  const handleLoginWithGoogle = async () => {
    console.log("🟢 CLICK LOGIN");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            prompt: "select_account", // força seleção de conta
          },
        },
      });

      console.log("📦 RESPONSE:", data);
      console.log("❌ ERROR:", error);

      if (data?.url) {
        console.log("🌍 REDIRECT URL:", data.url);
        // ⚠️ No web, o Supabase já redireciona automaticamente
      }

    } catch (err) {
      console.log("🔥 EXCEPTION:", err);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VORTEX Login</Text>

      <Button
        title="Entrar com Google"
        onPress={handleLoginWithGoogle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
  },
});
