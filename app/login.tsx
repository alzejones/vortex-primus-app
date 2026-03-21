import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

// Importações necessárias para o login com o Google
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

// Esta chamada deve estar sempre no nível principal (top level), antes da exportação
WebBrowser.maybeCompleteAuthSession();

  export default function Login() {
  const { session } = useAuth(); // Puxa a sessão do contexto

  // Fica de olho: se a sessão for confirmada, joga direto pro Dashboard
  useEffect(() => {
    if (session) {
      router.replace("/(protected)" as any);
    }
  }, [session]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleTyping = (text: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(text);
    if (message) setMessage("");
  };

  async function handleGoogleLogin() {
    setMessage("");
    try {
      if (Platform.OS === "web") {
        // 🌐 COMPORTAMENTO PARA A VERCEL (WEB)
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: "https://vortex-primus-app.vercel.app/",
            // Na web, NÃO usamos "skipBrowserRedirect". 
            // O próprio Supabase vai navegar e voltar sozinho com a sessão na URL.
          },
        });
        if (error) throw error;
      } else {
        // 📱 COMPORTAMENTO PARA O APP NATIVO (TELEMÓVEL/EXPO)
        const redirectTo = Linking.createURL("/");
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        if (data?.url) {
          await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        }
      }
    } catch (error: any) {
      setMessage(error.message);
    }
  }

  async function handleLogin() {
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setMessage("Preencha e-mail e senha.");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    if (error) {
      setMessage(error.message.toLowerCase().includes("invalid login") ? "E-mail ou senha incorretos." : error.message);
      return;
    }
    router.replace("/(protected)" as any);
  }

  async function handleSignup() {
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || password.length < 6) {
      setMessage("E-mail válido e senha de 6 dígitos são necessários.");
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
    if (error) {
      setMessage(error.message.toLowerCase().includes("already registered") ? "E-mail já cadastrado." : error.message);
      return;
    }
    if (data.user) {
      await supabase.from("trainers").insert([{ user_id: data.user.id, email: data.user.email, status: "active" }]);
      router.replace("/(protected)");
    }
  }

  // --- FUNÇÕES DE RECUPERAÇÃO DE SENHA ---
  async function handleRequestPasswordReset() {
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail) {
      setMessage("Por favor, preencha o seu e-mail no campo abaixo primeiro.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Código enviado! Verifique o seu e-mail.");
    setIsResetting(true);
  }

  async function handleVerifyAndResetPassword() {
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    
    if (!resetCode || !newPassword) {
      setMessage("Preencha o código e a nova senha.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: resetCode,
      type: "recovery",
    });

    if (error) {
      setMessage("Código inválido ou expirado.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setMessage(updateError.message);
      return;
    }

    setMessage("Senha atualizada com sucesso! Você já pode fazer login.");
    setIsResetting(false);
    setPassword(""); 
    setResetCode("");
  }
  // ---------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {message ? (
        <View style={[styles.toast, message.includes("sucesso") || message.includes("enviado") ? styles.toastSuccess : styles.toastError]}>
          <Text style={[styles.toastText, message.includes("sucesso") || message.includes("enviado") ? styles.toastTextSuccess : styles.toastTextError]}>{message}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.brandingContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={styles.appName}>Vortex <Text style={styles.appTitleBlue}>Primus</Text></Text>
          <Text style={styles.appSubtitle}>Performance & Gestão</Text>
        </View>

        <View style={styles.card}>
          {!isResetting ? (
            <>
              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                <Image 
                  source={{ uri: "https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" }} 
                  style={styles.googleIcon} 
                />
                <Text style={styles.googleButtonText}>Continuar com o Google</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} /><Text style={styles.dividerText}>ou</Text><View style={styles.line} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput style={styles.input} placeholder="seu@email.com" value={email} onChangeText={(t) => handleTyping(t, setEmail)} autoCapitalize="none" keyboardType="email-address" />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.row}>
                  <Text style={styles.label}>Senha</Text>
                  <TouchableOpacity onPress={handleRequestPasswordReset}>
                    <Text style={styles.forgot}>Esqueceu?</Text>
                  </TouchableOpacity>
                </View>
                <TextInput style={styles.input} placeholder="••••••••" value={password} onChangeText={(t) => handleTyping(t, setPassword)} secureTextEntry onSubmitEditing={handleLogin} />
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>Entrar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}>
                <Text style={styles.signupText}>Ainda não tem conta? <Text style={styles.signupLink}>Crie agora</Text></Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 8, textAlign: "center" }}>Redefinir Senha</Text>
              <Text style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 }}>Enviámos um código de 6 dígitos para o seu e-mail.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Código de Verificação</Text>
                <TextInput style={styles.input} placeholder="Ex: 123456" value={resetCode} onChangeText={(t) => handleTyping(t, setResetCode)} keyboardType="number-pad" maxLength={6} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nova Senha</Text>
                <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" value={newPassword} onChangeText={(t) => handleTyping(t, setNewPassword)} secureTextEntry onSubmitEditing={handleVerifyAndResetPassword} />
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyAndResetPassword}>
                <Text style={styles.primaryButtonText}>Salvar nova senha</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsResetting(false)} style={{ marginTop: 24, alignItems: "center" }}>
                <Text style={{ color: "#64748b", fontSize: 14, fontWeight: "600" }}>← Voltar para o Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60, paddingBottom: 250 },
  toast: { position: 'absolute', top: 50, left: 24, right: 24, padding: 16, borderRadius: 12, zIndex: 10, elevation: 6 },
  toastError: { backgroundColor: "#fef2f2", borderLeftWidth: 4, borderLeftColor: "#ef4444" },
  toastSuccess: { backgroundColor: "#ecfdf5", borderLeftWidth: 4, borderLeftColor: "#10b981" },
  toastText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  toastTextError: { color: "#dc2626" },
  toastTextSuccess: { color: "#059669" },

  brandingContainer: { alignItems: "center", marginBottom: 32 },
  logoBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", marginBottom: 12, elevation: 4 },
  logoLetter: { fontSize: 32, fontWeight: "900", color: "#fff" },
  appName: { fontSize: 30, fontWeight: "900", color: "#1e3a8a" },
  appTitleBlue: { color: "#3b82f6" },
  appSubtitle: { fontSize: 12, color: "#64748b", fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },

  card: { backgroundColor: "#fff", borderRadius: 24, padding: 24, elevation: 4 },
  googleButton: { flexDirection: "row", height: 54, borderRadius: 12, borderWidth: 1, borderColor: "#dadce0", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  googleButtonText: { color: "#3c4043", fontWeight: "600", fontSize: 15 },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dividerText: { marginHorizontal: 12, color: "#94a3b8", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },

  inputGroup: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8 },
  forgot: { fontSize: 13, fontWeight: "600", color: "#2563eb" },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16 },

  primaryButton: { backgroundColor: "#2563eb", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  signupBtn: { marginTop: 24, alignItems: "center" },
  signupText: { color: "#64748b", fontSize: 14 },
  signupLink: { color: "#2563eb", fontWeight: "700" }
});

