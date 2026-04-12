import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
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

function isInviteUrl(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return true;
  const params = new URLSearchParams(window.location.hash.replace("#", ""));
  return params.get("type") === "invite";
}

export default function SetPassword() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [message, setMessage]       = useState("");
  const [isSuccess, setIsSuccess]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [ready, setReady]           = useState(false); // sessão disponível
  const [invalidLink, setInvalidLink] = useState(false);

  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    // Supabase processa o hash automaticamente (detectSessionInUrl + implicit flow).
    // Escutamos onAuthStateChange para capturar a sessão do convite,
    // e getSession() para cobrir o caso em que já foi processada.

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setEmail(session.user.email ?? "");
          setReady(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email ?? "");
        setReady(true);
        return;
      }
      // Sem sessão após o primeiro getSession — aguarda até 6 s pelo onAuthStateChange.
      // Se nada chegar, considera o link inválido/expirado.
      const timer = setTimeout(() => {
        setInvalidLink(true);
      }, 6000);

      // Cancela o timer se onAuthStateChange entregar a sessão antes.
      supabase.auth.onAuthStateChange((_e, s) => {
        if (s?.user) clearTimeout(timer);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redireciona se cair nesta tela com uma sessão ativa mas sem ser convite.
  useEffect(() => {
    if (!ready) return;
    if (!isInviteUrl()) {
      // Sessão existente + não é convite: manda para a raiz (index decide a rota).
      router.replace("/");
    }
  }, [ready]);

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

  // ── Link inválido / expirado ────────────────────────────────────────────────
  if (invalidLink) {
    return (
      <KeyboardAvoidingView style={styles.root}>
        <View style={styles.scrollContent}>
          <View style={styles.brandingContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>V</Text>
            </View>
            <Text style={styles.appName}>
              Vortex <Text style={styles.appTitleBlue}>Primus</Text>
            </Text>
            <Text style={styles.appSubtitle}>Performance & Gestão</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Link inválido</Text>
            <Text style={styles.subtitle}>
              Este link de convite é inválido ou expirou.{"\n"}
              Solicite um novo convite ao seu treinador.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.primaryButtonText}>Ir para o Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Carregando sessão ───────────────────────────────────────────────────────
  if (!ready) {
    return (
      <KeyboardAvoidingView style={styles.root}>
        <View style={[styles.scrollContent, { justifyContent: "center" }]}>
          <View style={styles.brandingContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>V</Text>
            </View>
            <Text style={styles.appName}>
              Vortex <Text style={styles.appTitleBlue}>Primus</Text>
            </Text>
          </View>
          <Text style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>
            Validando convite...
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Formulário principal ────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {message ? (
        <View style={[styles.toast, isSuccess ? styles.toastSuccess : styles.toastError]}>
          <Text style={[styles.toastText, isSuccess ? styles.toastTextSuccess : styles.toastTextError]}>
            {message}
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandingContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={styles.appName}>
            Vortex <Text style={styles.appTitleBlue}>Primus</Text>
          </Text>
          <Text style={styles.appSubtitle}>Performance & Gestão</Text>
        </View>

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
              value={confirm}
              onChangeText={(t) => { setConfirm(t); setMessage(""); }}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSetPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleSetPassword}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Salvando..." : "Definir Senha e Entrar"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },

  toast: {
    position: "absolute",
    top: 50,
    left: 24,
    right: 24,
    padding: 16,
    borderRadius: 12,
    zIndex: 10,
    elevation: 6,
  },
  toastError:        { backgroundColor: "#fef2f2", borderLeftWidth: 4, borderLeftColor: "#ef4444" },
  toastSuccess:      { backgroundColor: "#ecfdf5", borderLeftWidth: 4, borderLeftColor: "#10b981" },
  toastText:         { fontSize: 14, fontWeight: "700", textAlign: "center" },
  toastTextError:    { color: "#dc2626" },
  toastTextSuccess:  { color: "#059669" },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 80,
  },

  brandingContainer: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 4,
  },
  logoLetter:   { fontSize: 32, fontWeight: "900", color: "#fff" },
  appName:      { fontSize: 30, fontWeight: "900", color: "#1e3a8a" },
  appTitleBlue: { color: "#3b82f6" },
  appSubtitle:  { fontSize: 12, color: "#64748b", fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },

  card:     { backgroundColor: "#fff", borderRadius: 24, padding: 24, elevation: 4 },
  title:    { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 6, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24, lineHeight: 20 },

  inputGroup: { marginBottom: 16 },
  label:      { fontSize: 13, fontWeight: "700", color: "#475569", marginBottom: 8 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
  },
  inputReadOnly: { color: "#94a3b8" },

  primaryButton: {
    backgroundColor: "#2563eb",
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonDisabled: { backgroundColor: "#93c5fd" },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
