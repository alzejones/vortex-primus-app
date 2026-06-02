import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
  Dimensions,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { T, Typography } from "../utils/theme";
import { GradientPrimary } from "../utils/gradients";

import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

// A proteção que salvou a Web
if (Platform.OS !== "web") {
  WebBrowser.maybeCompleteAuthSession();
}

export default function Login() {
  console.log('[DEBUG 4] login.tsx renderizando');
  const { session, role } = useAuth();

  // ─── Responsividade ───────────────────────────────────────────────
  const [screenWidth, setScreenWidth] = useState(
    () => Dimensions.get('window').width || 375
  );
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub.remove();
  }, []);
  const isDesktop = screenWidth >= 768;
  const CARD_MAX_WIDTH = 480;
  const toastSide = isDesktop
    ? Math.max(24, (screenWidth - CARD_MAX_WIDTH) / 2)
    : 24;
  // ──────────────────────────────────────────────────────────────────

  // Redireciona após login baseado no role — aguarda detectRole() resolver
  useEffect(() => {
    if (!session || role === null) return;
    if (role === "trainer") router.replace("/(protected)" as any);
    if (role === "client")  router.replace("/(client)/diet" as any);
  }, [session, role]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleTyping = (
    text: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(text);
    if (message) setMessage("");
  };

  async function handleGoogleLogin() {
    setMessage("");
    try {
      if (Platform.OS === "web") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: "https://vortex-primus.vercel.app/login",
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) throw error;
      } else {
        const redirectTo = Linking.createURL("/");
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: { prompt: "select_account" },
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
      setMessage(
        error.message.toLowerCase().includes("invalid login")
          ? "E-mail ou senha incorretos."
          : error.message
      );
      return;
    }
  }

  async function handleSignup() {
    console.log("handleSignup started - email:", email, "password length:", password.length);
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || password.length < 6) {
      console.log("Setting validation error message");
      setMessage("E-mail válido e senha com mínimo 6 caracteres são necessários.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    console.log("Supabase signUp result - data:", data, "error:", error);

    if (error) {
      console.log("Signup error:", error.message, error.status);
      const msg = error.message.toLowerCase();
      const friendlyMessage =
        msg.includes("already registered") || msg.includes("already been registered")
          ? "E-mail já cadastrado. Tente fazer login."
          : msg.includes("rate limit") || error.status === 429
          ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
          : error.message;
      setMessage(friendlyMessage);
      return;
    }

    // Confirmação de e-mail ATIVA → session é null, usuário precisa confirmar
    if (!data.session) {
      console.log("Setting email confirmation message");
      setMessage("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
      return;
    }

    // Confirmação de e-mail DESATIVA → session já existe, onAuthStateChange
    // vai disparar automaticamente e redirecionar via detectRole()
    console.log("handleSignup finished");
  }

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

  const isSuccess =
    message.includes("sucesso") || message.includes("enviado");

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Glow radial simulado */}
      <View
        style={[
          styles.glowCenter,
          isDesktop && styles.glowCenterDesktop,
        ]}
        pointerEvents="none"
      />


      {/* Toast — alinhado com o card em qualquer resolução */}
      {message ? (
        <View
          style={[
            styles.toast,
            isSuccess ? styles.toastSuccess : styles.toastError,
            { left: toastSide, right: toastSide },
          ]}
        >
          <Text
            style={[
              styles.toastText,
              isSuccess ? styles.toastTextSuccess : styles.toastTextError,
            ]}
          >
            {message}
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Branding */}
        <View style={styles.brandingContainer}>
          <LinearGradient
            {...GradientPrimary}
            style={[styles.logoBox, isDesktop && styles.logoBoxDesktop]}
          >
            <Text
              style={[
                styles.logoLetter,
                isDesktop && styles.logoLetterDesktop,
              ]}
            >
              V
            </Text>
          </LinearGradient>
          <Text
            style={[styles.appName, isDesktop && styles.appNameDesktop]}
          >
            Vortex <Text style={styles.appNameBlue}>Primus</Text>
          </Text>
          <Text style={styles.appSubtitle}>Performance & Gestão</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, isDesktop && styles.cardDesktop]}>
          {!isResetting ? (
            <>
              {/* Google */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
              >
                <Image
                  source={{
                    uri: "https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png",
                  }}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>
                  Continuar com o Google
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* E-mail */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={T.t3}
                  value={email}
                  onChangeText={(t) => handleTyping(t, setEmail)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Senha */}
              <View style={styles.inputGroup}>
                <View style={styles.row}>
                  <Text style={styles.label}>Senha</Text>
                  <TouchableOpacity onPress={handleRequestPasswordReset}>
                    <Text style={styles.forgot}>Esqueceu?</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={T.t3}
                  value={password}
                  onChangeText={(t) => handleTyping(t, setPassword)}
                  secureTextEntry
                  onSubmitEditing={handleLogin}
                />
              </View>

              {/* Botão Entrar */}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <LinearGradient
                  {...GradientPrimary}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryBtnText}>Entrar</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Cadastro */}
              <TouchableOpacity
                style={styles.signupBtn}
                onPress={handleSignup}
              >
                <Text style={styles.signupText}>
                  Ainda não tem conta?{" "}
                  <Text style={styles.signupLink}>Crie agora</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.resetTitle}>Redefinir Senha</Text>
              <Text style={styles.resetSubtitle}>
                Enviámos um código de 6 dígitos para o seu e-mail.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Código de Verificação</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 123456"
                  placeholderTextColor={T.t3}
                  value={resetCode}
                  onChangeText={(t) => handleTyping(t, setResetCode)}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={T.t3}
                  value={newPassword}
                  onChangeText={(t) => handleTyping(t, setNewPassword)}
                  secureTextEntry
                  onSubmitEditing={handleVerifyAndResetPassword}
                />
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleVerifyAndResetPassword}
                activeOpacity={0.85}
              >
                <LinearGradient
                  {...GradientPrimary}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.primaryBtnText}>
                    Salvar nova senha
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsResetting(false)}
                style={styles.backBtn}
              >
                <Text style={styles.backBtnText}>← Voltar para o Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  // ─── Glow ───────────────────────────────────────────────────────
  glowCenter: {
    position: "absolute",
    top: -120,
    alignSelf: "center",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: T.blueGlow,
  },
  // Desktop: glow maior para cobrir telas wide
  glowCenterDesktop: {
    width: 700,
    height: 700,
    borderRadius: 350,
    top: -200,
  },

  // ─── ScrollView ─────────────────────────────────────────────────
  // Mobile: padding padrão (comportamento atual preservado)
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    paddingBottom: 60,
  },
  // Desktop: centraliza o conteúdo verticalmente e horizontalmente
  scrollContentDesktop: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 24,
  },

  // ─── Toast ──────────────────────────────────────────────────────
  // left/right são sobrescritos inline com toastSide (calculado por width)
  toast: {
    position: "absolute",
    top: 50,
    padding: 16,
    borderRadius: 12,
    zIndex: 10,
    elevation: 6,
    backgroundColor: T.surfaceAlt,
    borderLeftWidth: 4,
  },
  toastError:       { borderLeftColor: T.red },
  toastSuccess:     { borderLeftColor: T.green },
  toastText:        { fontSize: 14, ...Typography.subtitle, textAlign: "center" },
  toastTextError:   { color: T.red },
  toastTextSuccess: { color: T.green },

  // ─── Branding ───────────────────────────────────────────────────
  brandingContainer: { alignItems: "center", marginBottom: 36 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 8,
    shadowColor: T.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  logoBoxDesktop: {
    width: 88,
    height: 88,
    borderRadius: 24,
  },
  logoLetter: { fontSize: 36, fontWeight: "900", color: T.white },
  logoLetterDesktop: { fontSize: 44 },
  appName: {
    fontSize: 32,
    fontWeight: "900",
    color: T.white,
    letterSpacing: -0.5,
  },
  appNameDesktop: { fontSize: 40 },
  appNameBlue: { color: T.blue },
  appSubtitle: {
    fontSize: 11,
    color: T.t3,
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginTop: 4,
  },

  // ─── Card ───────────────────────────────────────────────────────
  // Mobile: ocupa 100% da largura (comportamento atual preservado)
  card: {
    backgroundColor: T.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: T.border,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  // Desktop: largura fixa 480px, centralizado pelo alignItems do scroll
  cardDesktop: {
    width: 480,
    padding: 32,
  },

  // ─── Google ─────────────────────────────────────────────────────
  googleButton: {
    flexDirection: "row",
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  googleIcon:       { width: 20, height: 20, marginRight: 12 },
  googleButtonText: { color: T.t1, fontWeight: "600", fontSize: 15 },

  // ─── Divider ────────────────────────────────────────────────────
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: {
    marginHorizontal: 12,
    color: T.t3,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // ─── Inputs ─────────────────────────────────────────────────────
  inputGroup: { marginBottom: 16 },
  row:        { flexDirection: "row", justifyContent: "space-between" },
  label:      { fontSize: 13, color: T.t2, marginBottom: 8, ...Typography.subtitle },
  forgot:     { fontSize: 13, color: T.blue, fontWeight: "600" },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    color: T.white,
  },

  // ─── Botão primário ─────────────────────────────────────────────
  primaryBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  primaryBtnGradient: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  primaryBtnText: { color: T.white, fontWeight: "700", fontSize: 16 },

  // ─── Cadastro ───────────────────────────────────────────────────
  signupBtn:  { marginTop: 24, alignItems: "center" },
  signupText: { color: T.t2, fontSize: 14 },
  signupLink: { color: T.blue, fontWeight: "700" },

  // ─── Reset ──────────────────────────────────────────────────────
  resetTitle: {
    fontSize: 20,
    color: T.white,
    marginBottom: 8,
    textAlign: "center",
    ...Typography.title,
  },
  resetSubtitle: {
    fontSize: 14,
    color: T.t2,
    textAlign: "center",
    marginBottom: 24,
  },
  backBtn:     { marginTop: 24, alignItems: "center" },
  backBtnText: { color: T.t2, fontSize: 14, fontWeight: "600" },
});
