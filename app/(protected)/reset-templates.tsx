import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { T } from "../../utils/theme";

type Template = {
  day_number: number;
  send_time: string;
  message_text: string;
};

export default function ResetTemplatesScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [usingPlatformDefaults, setUsingPlatformDefaults] = useState(false);

  const [editingGlobal, setEditingGlobal] = useState(false);

  const [confirmRestore, setConfirmRestore] = useState(false);

  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    loadTemplates();
  }, [editingGlobal]);

  async function loadTemplates() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer, error: trainerError } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (trainerError) throw trainerError;
      setTrainerId(trainer.id);

      if (editingGlobal && isAdmin) {
        const { data, error } = await supabase
          .from("reset_protocol_templates")
          .select("day_number, send_time, message_text")
          .is("trainer_id", null)
          .order("day_number");

        if (error) throw error;

        const templatesMap = new Map<number, Template>();
        (data || []).forEach((t) => templatesMap.set(t.day_number, { ...t, send_time: t.send_time.substring(0, 5) }));

        const full: Template[] = [];
        for (let d = 1; d <= 5; d++) {
          full.push(templatesMap.get(d) || { day_number: d, send_time: "08:00", message_text: "" });
        }
        setTemplates(full);
        setUsingPlatformDefaults(false);
      } else {
        const { data, error } = await supabase
          .from("reset_protocol_templates")
          .select("day_number, send_time, message_text")
          .eq("trainer_id", trainer.id)
          .order("day_number");

        if (error) throw error;

        if (!data || data.length === 0) {
          const { data: globalData, error: globalError } = await supabase
            .from("reset_protocol_templates")
            .select("day_number, send_time, message_text")
            .is("trainer_id", null)
            .order("day_number");

          if (globalError) throw globalError;

          const globalMap = new Map<number, Template>();
          (globalData || []).forEach((t) => globalMap.set(t.day_number, { ...t, send_time: t.send_time.substring(0, 5) }));

          const full: Template[] = [];
          for (let d = 1; d <= 5; d++) {
            full.push(globalMap.get(d) || { day_number: d, send_time: "08:00", message_text: "" });
          }
          setTemplates(full);
          setUsingPlatformDefaults(true);
        } else {
          const templatesMap = new Map<number, Template>();
          data.forEach((t) => templatesMap.set(t.day_number, { ...t, send_time: t.send_time.substring(0, 5) }));

          const full: Template[] = [];
          for (let d = 1; d <= 5; d++) {
            full.push(templatesMap.get(d) || { day_number: d, send_time: "08:00", message_text: "" });
          }
          setTemplates(full);
          setUsingPlatformDefaults(false);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      setStatusMsg({ text: "Não foi possível carregar os templates.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function updateTemplate(dayNumber: number, field: "send_time" | "message_text", value: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.day_number === dayNumber ? { ...t, [field]: value } : t))
    );
    setStatusMsg({ text: "", type: "" });
  }

  async function handleSave() {
    if (!trainerId && !editingGlobal) {
      setStatusMsg({ text: "Dados do perfil não foram carregados. Recarregue a tela.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      const target = editingGlobal ? null : trainerId;

      for (const t of templates) {
        const { error } = await supabase
          .from("reset_protocol_templates")
          .upsert(
            {
              trainer_id: target,
              day_number: t.day_number,
              send_time: t.send_time,
              message_text: t.message_text,
              active: true,
            },
            { onConflict: "trainer_id,day_number" }
          );

        if (error) throw error;
      }

      setStatusMsg({ text: "Mensagens salvas com sucesso!", type: "success" });
      setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
      loadTemplates();
    } catch (error: any) {
      setStatusMsg({ text: error.message || "Erro ao salvar mensagens.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore() {
    if (!trainerId) return;
    setConfirmRestore(false);

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      const { error } = await supabase
        .from("reset_protocol_templates")
        .delete()
        .eq("trainer_id", trainerId);

      if (error) throw error;

      setStatusMsg({ text: "Mensagens restauradas para o padrão da plataforma.", type: "success" });
      setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
      loadTemplates();
    } catch (error: any) {
      setStatusMsg({ text: error.message || "Erro ao restaurar mensagens.", type: "error" });
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={Platform.OS === "web"}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnTxt}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mensagens do Reset</Text>
          <Text style={styles.subtitle}>
            Edite as mensagens enviadas automaticamente durante o protocolo de 5 dias.
          </Text>
        </View>

        {statusMsg.text !== "" && (
          <View style={[styles.statusBox, statusMsg.type === "error" ? styles.statusError : styles.statusSuccess]}>
            <Text style={[styles.statusText, statusMsg.type === "error" ? styles.statusTextError : styles.statusTextSuccess]}>
              {statusMsg.type === "error" ? "⚠️ " : "✅ "}
              {statusMsg.text}
            </Text>
          </View>
        )}

        {isAdmin && (
          <View style={styles.formCard}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.switchLabel}>🔑 Editar mensagens padrão da plataforma</Text>
                <Text style={styles.helperText}>
                  Quando ativado, você edita os templates globais usados por todos os treinadores que não personalizaram.
                </Text>
              </View>
              <Switch
                value={editingGlobal}
                onValueChange={(val) => {
                  setEditingGlobal(val);
                  setStatusMsg({ text: "", type: "" });
                }}
                trackColor={{ false: T.border, true: T.green }}
                thumbColor={editingGlobal ? T.white : T.t3}
              />
            </View>
          </View>
        )}

        {usingPlatformDefaults && !editingGlobal && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ Estas são as mensagens padrão da plataforma. Edite e salve para personalizar.
            </Text>
          </View>
        )}

        {templates.map((t) => (
          <View key={t.day_number} style={styles.formCard}>
            <Text style={styles.dayLabel}>Dia {t.day_number}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Horário de envio</Text>
              <TextInput
                style={styles.input}
                value={t.send_time}
                onChangeText={(text) => updateTemplate(t.day_number, "send_time", text)}
                placeholder="HH:MM"
                placeholderTextColor={T.t3}
                maxLength={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mensagem</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={t.message_text}
                onChangeText={(text) => updateTemplate(t.day_number, "message_text", text)}
                placeholder="Digite a mensagem..."
                placeholderTextColor={T.t3}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <View style={styles.saveButtonInner}>
            {saving ? <ActivityIndicator color={T.white} /> : <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>}
          </View>
        </TouchableOpacity>

        {!usingPlatformDefaults && !editingGlobal && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => setConfirmRestore(true)}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={styles.restoreButtonText}>Restaurar mensagens padrão da plataforma</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmRestore}
        title="Restaurar mensagens padrão?"
        message="Suas mensagens personalizadas serão excluídas e você voltará a usar os templates da plataforma."
        confirmLabel="Restaurar"
        cancelLabel="Cancelar"
        onConfirm={handleRestore}
        onCancel={() => setConfirmRestore(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },
  scrollContent: { padding: 24, paddingBottom: 60, paddingTop: Platform.OS === "ios" ? 60 : 40 },

  header: { marginBottom: 24 },
  backBtn: { marginBottom: 16 },
  backBtnTxt: { fontSize: 15, color: T.blue, fontWeight: "600" },
  title: { fontSize: 32, fontWeight: "900", color: T.t1, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: T.t3, lineHeight: 22 },

  statusBox: { padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  statusError: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: T.red },
  statusSuccess: { backgroundColor: "rgba(16,185,129,0.08)", borderColor: T.green },
  statusText: { fontWeight: "bold", fontSize: 14 },
  statusTextError: { color: T.red },
  statusTextSuccess: { color: T.green },

  infoBox: { padding: 16, borderRadius: 12, marginBottom: 20, backgroundColor: T.surfaceAlt, borderWidth: 1, borderColor: T.border },
  infoText: { fontSize: 14, color: T.t2, lineHeight: 20 },

  formCard: { backgroundColor: T.card, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: T.border, marginBottom: 24 },

  dayLabel: { fontSize: 20, fontWeight: "800", color: T.t1, marginBottom: 16, letterSpacing: -0.5 },

  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "800", color: T.t2, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, padding: 16, fontSize: 16, color: T.t1 },
  inputMultiline: { minHeight: 120, textAlignVertical: "top" },
  helperText: { fontSize: 12, color: T.t3, marginTop: 6 },

  saveButton: { borderRadius: 16, overflow: "hidden", marginBottom: 12, backgroundColor: T.blue },
  saveButtonInner: { height: 56, alignItems: "center", justifyContent: "center", borderRadius: 16 },
  saveButtonText: { color: T.white, fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  restoreButton: { alignItems: "center", paddingVertical: 12, marginBottom: 24 },
  restoreButtonText: { color: T.t3, fontSize: 13, fontWeight: "600" },

  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  switchLabel: { fontSize: 15, fontWeight: "700", color: T.t1, flex: 1, marginRight: 12 },
});
