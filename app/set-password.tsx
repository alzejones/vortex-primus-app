import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { GradientPrimary } from "../utils/gradients";
import { T } from "../utils/theme";

export default function SetPassword() {
  // ─── Responsividade ───────────────────────────────
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
  // ────────────────────────────────────────────

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [message, setMessage]         = useState("");
  const [isSuccess, setIsSuccess]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [ready, setReady]             = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  const confirmRef = useRef<TextInput>(null);

  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();

  useEffect(() => {
    async function setup() {
      // Tenta query params primeiro (fluxo normal)
      let tokenHash = Array.isArray(params.token_hash) ? params.token_hash[0] : (params.token_hash ?? null);
      let tokenType = Array.isArray(params.type) ? params.type[0] : (params.type ?? null);

      // Fallback: extrai do hash da URL (comportamento padrão do Supabase na web)
      if ((!tokenHash || !tokenType) && typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        if (!tokenHash) tokenHash = hashParams.get('token_hash');
        if (!tokenType) tokenType = hashParams.get('type');
      }

      if (!tokenHash || tokenType !== 'invite') {
        setInvalidLink(true);
        return;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'invite',
      });

      if (error || !data.session?.user) {
        setInvalidLink(true);
        return;
      }

      // Persiste a sessão explicitamente (necessário no Vercel/web)
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      const user = data.session.user;
      const clientId = user.user_metadata?.client_id as string | undefined;
      if (clientId && user.user_metadata?.role === 'client') {
        await supabase
          .from('clients')
          .update({ user_id: user.id })
          .eq('id', clientId)
          .is('user_id', null);
      }

      setEmail(user.email ?? '');
      setReady(true);
    }

    setup();
  }, []);

  async function handleSetPassword() {
    setMessage("");
    setIsSuccess(false);

    if (password.length < 6) {
      setMessage("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setMessage("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage("Erro ao salvar a senha. Tente novamente.");
      return;
    }

    setIsSuccess(true);
    setMessage("Senha definida com sucesso! Entrando...");

    setTimeout(() => {
      router.replace("/(client)/diet" as any);
    }, 1200);
  }

  if (invalidLink) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: isDesktop ? 'center' : undefined }}>
        {message ? (
          <View style={[styles.toast, isSuccess ? styles.toastSuccess : styles.toastError, { left: toastSide, right: toastSide }]}>
            <Text style={[styles.toastText, isSuccess ? styles.toastTextSuccess : styles.toastTextError]}>
              {message}
            </Text>
          </View>
        ) : null}
        
        <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? CARD_MAX_WIDTH : undefined }}>
          <KeyboardAvoidingView style={styles.root}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Branding />
              <View style={styles.card}>
                <Text style={styles.title}>Link inválido</Text>
                <Text style={styles.subtitle}>
                  Este link de convite é inválido ou expirou.{"\n"}
                  Solicite um novo convite ao seu treinador.
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace("/login")}>
                  <LinearGradient {...GradientPrimary} style={styles.primaryButtonGradient}>
                    <Text style={styles.primaryButtonText}>Ir para o Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: isDesktop ? 'center' : undefined }}>
        <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? CARD_MAX_WIDTH : undefined }}>
          <KeyboardAvoidingView style={styles.root}>
            <ScrollView 
              contentContainerStyle={[styles.scrollContent, { justifyContent: "center" }]}
              showsVerticalScrollIndicator={true}
            >
              <Branding />
              <Text style={{ textAlign: "center", color: T.t3, fontSize: 14 }}>
                Validando convite...
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg, alignItems: isDesktop ? 'center' : undefined }}>
      {message ? (
        <View style={[styles.toast, isSuccess ? styles.toastSuccess : styles.toastError, { left: toastSide, right: toastSide }]}>
          <Text style={[styles.toastText, isSuccess ? styles.toastTextSuccess : styles.toastTextError]}>
            {message}
          </Text>
        </View>
      ) : null}
      
      <View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? CARD_MAX_WIDTH : undefined }}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <Branding />

            <View style={styles.card}>
              <Text style={styles.title}>Bem-vindo!</Text>
              <Text style={styles.subtitle}>
                Defina sua senha para acessar o seu plano alimentar.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={[styles.input, styles.inputReadOnly]}
                  value={email}
                  editable={false}
                  selectTextOnFocus={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nova Senha</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={T.t3}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setMessage(""); }}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar Senha</Text>
                <TextInput
                  ref={confirmRef}
                  style={styles.input}
                  placeholder="Repita a senha"
                  placeholderTextColor={T.t3}
                  value={confirm}
                  onChangeText={(t) => { setConfirm(t); setMessage(""); }}
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSetPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.6 }]}
                onPress={handleSetPassword}
                disabled={loading}
              >
                <LinearGradient {...GradientPrimary} style={styles.primaryButtonGradient}>
                  <Text style={styles.primaryButtonText}>
                    {loading ? "Salvando..." : "Definir Senha e Entrar"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

function Branding() {
  return (
    <View style={styles.brandingContainer}>
      <LinearGradient {...GradientPrimary} style={styles.logoBox}>
        <Text style={styles.logoLetter}>V</Text>
      </LinearGradient>
      <Text style={styles.appName}>
        Vortex <Text style={styles.appTitleBlue}>Primus</Text>
      </Text>
      <Text style={styles.appSubtitle}>Performance & Gestão</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  toast: {
    position: "absolute",
    top: 50,
    padding: 16,
    borderRadius: 12,
    zIndex: 10,
    elevation: 6,
  },
  toastError:       { backgroundColor: "rgba(239,68,68,0.1)", borderLeftWidth: 4, borderLeftColor: T.red },
  toastSuccess:     { backgroundColor: "rgba(16,185,129,0.1)", borderLeftWidth: 4, borderLeftColor: T.green },
  toastText:        { fontSize: 14, fontWeight: "700", textAlign: "center" },
  toastTextError:   { color: T.red },
  toastTextSuccess: { color: T.green },

  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60, paddingBottom: 80 },

  brandingContainer: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoLetter:   { fontSize: 32, fontWeight: "900", color: T.white },
  appName:      { fontSize: 30, fontWeight: "900", color: T.t1 },
  appTitleBlue: { color: T.blue },
  appSubtitle:  { fontSize: 12, color: T.t3, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },

  card: {
    backgroundColor: T.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: T.border,
  },
  title:    { fontSize: 20, fontWeight: "800", color: T.t1, marginBottom: 6, textAlign: "center" },
  subtitle: { fontSize: 14, color: T.t3, textAlign: "center", marginBottom: 24, lineHeight: 20 },

  inputGroup: { marginBottom: 16 },
  label:      { fontSize: 13, fontWeight: "700", color: T.t2, marginBottom: 8 },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    color: T.t1,
  },
  inputReadOnly: { color: T.t3 },

  primaryButton:         { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  primaryButtonGradient: { height: 54, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  primaryButtonText:     { color: T.white, fontWeight: "700", fontSize: 16 },
});
