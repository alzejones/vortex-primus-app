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
    View
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function TrainerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  // Estados do formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [planName, setPlanName] = useState("Carregando...");

  // Feedback visual
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca dados básicos do treinador
      const { data: trainer, error: trainerError } = await supabase
        .from("trainers")
        .select("id, name, email")
        .eq("user_id", user.id)
        .single();

      if (trainerError) throw trainerError;

      setTrainerId(trainer.id);
      setName(trainer.name || "");
      setEmail(trainer.email || "");

      // 2. Busca assinatura ativa + plano via trainer_subscriptions
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
      
      // Oculta a mensagem de sucesso após 3 segundos
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
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
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
              onChangeText={(t) => { setName(t); setStatusMsg({text: "", type: ""}); }}
              placeholder="Seu nome"
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
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 24, paddingBottom: 60, paddingTop: Platform.OS === "ios" ? 60 : 40 },
  
  header: { marginBottom: 24 },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: "#4f46e5", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 32, fontWeight: "900", color: "#0f172a", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#64748b", lineHeight: 22 },

  statusBox: { padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  statusError: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  statusSuccess: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  statusText: { fontWeight: "bold", fontSize: 14 },
  statusTextError: { color: "#dc2626" },
  statusTextSuccess: { color: "#059669" },

  formCard: { backgroundColor: "#fff", padding: 24, borderRadius: 24, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#64748b", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, marginBottom: 24 },
  
  avatarContainer: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#e0e7ff", justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#4f46e5", letterSpacing: 1 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "800", color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 16, fontSize: 16, color: "#0f172a" },
  inputDisabled: { backgroundColor: "#f1f5f9", color: "#94a3b8" },
  helperText: { fontSize: 12, color: "#94a3b8", marginTop: 6 },

  planBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", padding: 16, borderRadius: 12 },
  planBoxText: { fontSize: 16, fontWeight: "700", color: "#b45309" },
  planBoxLink: { fontSize: 14, fontWeight: "800", color: "#d97706" },

  saveButton: { backgroundColor: "#0f172a", padding: 18, borderRadius: 16, alignItems: "center", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  saveButtonText: { color: "#ffffff", fontWeight: "bold", fontSize: 16, letterSpacing: 0.5 },
});

