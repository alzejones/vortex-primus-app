import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

export default function TrainerProfile() {
  const router = useRouter();
  const { signOut, signingOut, debugMessages } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [planName, setPlanName] = useState("Carregando...");

  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer, error: trainerError } = await supabase
        .from("trainers")
        .select("id, name, email")
        .eq("user_id", user.id)
        .single();

      if (trainerError) throw trainerError;

      setTrainerId(trainer.id);
      setName(trainer.name || "");
      setEmail(trainer.email || "");

      const { data: sub } = await supabase
        .from("trainer_subscriptions")
        .select("is_active, plans ( name )")
        .eq("trainer_id", trainer.id)
        .eq("is_active", true)
        .single();

      const planData = sub?.plans as any;
      setPlanName(planData?.name ? `${planData.name} (Ativo)` : "Sem Plano Ativo");

    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setStatusMsg({ text: "Não foi possível carregar os seus dados.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    if (!trainerId) {
      setStatusMsg({ text: "Dados do perfil não foram carregados. Recarregue a tela.", type: "error" });
      return;
    }

    if (!name.trim()) {
      setStatusMsg({ text: "O nome não pode estar vazio.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      const { error } = await supabase
        .from("trainers")
        .update({ name: name.trim() })
        .eq("id", trainerId);

      if (error) throw error;

      setStatusMsg({ text: "Perfil atualizado com sucesso!", type: "success" });
      setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);

    } catch (error: any) {
      setStatusMsg({ text: error.message || "Erro ao salvar alterações.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Meu Perfil</Text>
          <Text style={styles.subtitle}>Gerencie as suas informações pessoais e conta.</Text>
        </View>

        {statusMsg.text !== "" && (
          <View style={[styles.statusBox, statusMsg.type === "error" ? styles.statusError : styles.statusSuccess]}>
            <Text style={[styles.statusText, statusMsg.type === "error" ? styles.statusTextError : styles.statusTextSuccess]}>
              {statusMsg.type === "error" ? "⚠️ " : "✅ "}
              {statusMsg.text}
            </Text>
          </View>
        )}

        <View style={styles.formCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name ? name.substring(0, 2).toUpperCase() : "TR"}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(t) => { setName(t); setStatusMsg({ text: "", type: "" }); }}
              placeholder="Seu nome"
              placeholderTextColor={T.t3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail (Login) 🔒</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              selectTextOnFocus={false}
            />
            <Text style={styles.helperText}>O e-mail é a sua chave de acesso e não pode ser alterado por aqui.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Plano Atual</Text>
            <View style={styles.planBox}>
              <Text style={styles.planBoxText}>👑 {planName}</Text>
              <TouchableOpacity onPress={() => router.push("/(protected)/upgrade" as any)}>
                <Text style={styles.planBoxLink}>Mudar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdateProfile}
          disabled={saving || !trainerId}
          activeOpacity={0.85}
        >
          <LinearGradient {...GradientPrimary} style={styles.saveButtonGradient}>
            {saving ? <ActivityIndicator color={T.white} /> : <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>}
          </LinearGradient>
        </TouchableOpacity>


        <TouchableOpacity 
          style={[styles.signOutBtn, signingOut && { opacity: 0.5 }]} 
          onPress={() => signOut()} 
          disabled={signingOut}
        >
          <Text style={styles.signOutText}>
            {signingOut ? "Saindo..." : "Sair da conta"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },
  scrollContent: { padding: 24, paddingBottom: 60, paddingTop: Platform.OS === "ios" ? 60 : 40 },

  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: "900", color: T.t1, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: T.t3, lineHeight: 22 },

  statusBox: { padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  statusError: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: T.red },
  statusSuccess: { backgroundColor: "rgba(16,185,129,0.08)", borderColor: T.green },
  statusText: { fontWeight: "bold", fontSize: 14 },
  statusTextError: { color: T.red },
  statusTextSuccess: { color: T.green },

  formCard: { backgroundColor: T.card, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: T.border, marginBottom: 24 },

  avatarContainer: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: T.surfaceAlt, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: T.borderActive },
  avatarText: { fontSize: 28, fontWeight: "900", color: T.blue, letterSpacing: 1 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "800", color: T.t2, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, padding: 16, fontSize: 16, color: T.t1 },
  inputDisabled: { backgroundColor: T.bg, color: T.t3 },
  helperText: { fontSize: 12, color: T.t3, marginTop: 6 },

  planBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.25)", padding: 16, borderRadius: 12 },
  planBoxText: { fontSize: 15, fontWeight: "700", color: T.orange },
  planBoxLink: { fontSize: 14, fontWeight: "800", color: T.orange },

  saveButton: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  saveButtonGradient: { height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  saveButtonText: { color: T.white, fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  signOutBtn: { alignItems: "center", paddingVertical: 12 },
  signOutText: { color: T.t4, fontSize: 13, fontWeight: "500" },

  debugContainer: { backgroundColor: T.surfaceAlt, padding: 12, borderRadius: 8, marginBottom: 16, maxHeight: 200 },
  debugTitle: { color: T.orange, fontSize: 12, fontWeight: "800", marginBottom: 8 },
  debugScroll: { maxHeight: 160 },
  debugText: { color: T.orange, fontSize: 10, fontWeight: "500", marginBottom: 2, fontFamily: 'monospace' },
});
