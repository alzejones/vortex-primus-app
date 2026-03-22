import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Button, Platform, StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

// Necessário para o fluxo nativo não travar
if (Platform.OS !== "web") {
  WebBrowser.maybeCompleteAuthSession();
}

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

  // 🔐 LOGIN GOOGLE COM DEBUG E ABERTURA DE JANELA CORRIGIDA
  const handleLoginWithGoogle = async () => {
    console.log("🟢 CLICK LOGIN");

    try {
      if (Platform.OS === "web") {
        // Fluxo para a Web (Vercel / Chrome do Celular)
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: "https://vortex-primus-app.vercel.app/login",
            queryParams: {
              prompt: "select_account",
            },
          },
        });
        if (error) console.log("❌ ERROR WEB:", error);
      } else {
        // Fluxo para o aplicativo (Expo Go)
        const redirectTo = Linking.createURL("/");
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: {
              prompt: "select_account",
            },
          },
        });

        console.log("📦 RESPONSE NATIVO:", data);
        if (error) console.log("❌ ERROR NATIVO:", error);

        if (data?.url) {
          console.log("🌍 ABRINDO NAVEGADOR COM URL:", data.url);
          await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        }
      }
    } catch (err) {
      console.log("🔥 EXCEPTION:", err);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VORTEX Login Debug</Text>

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
