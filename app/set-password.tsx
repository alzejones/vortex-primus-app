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

// Lê os tokens do hash da URL de forma síncrona.
// Deve ser chamada o mais cedo possível — antes do Supabase limpar o hash.
// O hash só é limpo pelo Supabase quando NÃO há sessão existente no storage.
// Quando há sessão existente, o Supabase ignora o hash e ele permanece intacto.
function parseInviteHash(): { accessToken: string; refreshToken: string } | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.hash.replace("#", ""));
  if (params.get("type") !== "invite") return null;
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token") ?? "";
  if (!accessToken) return null;
  return { accessToken, refreshToken };
}

export default function SetPassword() {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [message, setMessage]         = useState("");
  const [isSuccess, setIsSuccess]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [ready, setReady]             = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  const confirmRef = useRef<TextInput>(null);

  // Captura os tokens do hash na primeira renderização (fase síncrona),
  // antes que qualquer efeito assíncrono do Supabase possa limpar o hash.
  const inviteTokens = useRef(parseInviteHash());

  useEffect(() => {
    async function setup() {
      const tokens = inviteTokens.current;

      if (tokens) {
        // ── Caso A: sessão existente no storage ─────────────────────────────
        // O Supabase ignorou o hash do convite e preservou a sessão anterior.
        // O hash ainda está na URL com os tokens do aluno.
        // Solução: limpar a sessão local e estabelecer a sessão do aluno.

        // scope:'local' encerra apenas este browser sem invalidar tokens de outros dispositivos
        await supabase.auth.signOut({ scope: "local" });

        const { data, error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });

        if (error || !data.session?.user) {
          setInvalidLink(true);
          return;
        }

        setEmail(data.session.user.email ?? "");
        setReady(true);
      } else {
        // ── Caso B: sem sessão prévia no storage ─────────────────────────────
        // O Supabase processou o hash automaticamente via detectSessionInUrl,
        // limpou o hash e estabeleceu a sessão do aluno por conta própria.
        // getSession() aguarda o initializePromise internamente, então a sessão
        // já está disponível quando a promise resolve.

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          // Nenhum token no hash e nenhuma sessão: link inválido ou acesso direto.
          setInvalidLink(true);
          return;
        }

        setEmail(session.user.email ?? "");
        setReady(true);
      }
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

  // ── Link inválido / expirado ────────────────────────────────────────────────
  if (invalidLink) {
    return (
      <KeyboardAvoidingView style={styles.root}>
        <View style={styles.scrollContent}>
          <Branding />
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

  // ── Carregando / processando tokens ────────────────────────────────────────
  if (!ready) {
    return (
      <KeyboardAvoidingView style={styles.root}>
        <View style={[styles.scrollContent, { justifyContent: "center" }]}>
          <Branding />
          <Text style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>
            Validando convite...
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Formulário ──────────────────────────────────────────────────────────────
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

function Branding() {
  return (
    <View style={styles.brandingContainer}>
      <View style={styles.logoBox}>
        <Text style={styles.logoLetter}>V</Text>
      </View>
      <Text style={styles.appName}>
        Vortex <Text style={styles.appTitleBlue}>Primus</Text>
      </Text>
      <Text style={styles.appSubtitle}>Performance & Gestão</Text>
    </View>
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
  toastError:       { backgroundColor: "#fef2f2", borderLeftWidth: 4, borderLeftColor: "#ef4444" },
  toastSuccess:     { backgroundColor: "#ecfdf5", borderLeftWidth: 4, borderLeftColor: "#10b981" },
  toastText:        { fontSize: 14, fontWeight: "700", textAlign: "center" },
  toastTextError:   { color: "#dc2626" },
  toastTextSuccess: { color: "#059669" },

  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60, paddingBottom: 80 },

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

  primaryButton:         { backgroundColor: "#2563eb", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  primaryButtonDisabled: { backgroundColor: "#93c5fd" },
  primaryButtonText:     { color: "#fff", fontWeight: "700", fontSize: 16 },
});
