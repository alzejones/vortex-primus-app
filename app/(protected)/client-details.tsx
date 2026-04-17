import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import {
  ACTIVITY_LABELS,
  ActivityLevel,
  OBJECTIVE_LABELS,
  Objective,
} from "../../utils/dietCalculations";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

// --- FUNÇÕES DE UTILIDADE ---
const formatDateInput = (text: string) => {
  const cleaned = text.replace(/\D/g, "");
  let formatted = cleaned;
  if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  return formatted.slice(0, 10);
};

const dateToSql = (dateStr: string) => {
  if (!dateStr || dateStr.length < 10) return null;
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
};

const sqlToDate = (sqlStr: string) => {
  if (!sqlStr) return "";
  const [year, month, day] = sqlStr.split("-");
  return `${day}/${month}/${year}`;
};

export default function ClientDetails() {
  const { id } = useLocalSearchParams();
  const clientId = id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [observation, setObservation] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [objective, setObjective] = useState<Objective | "">("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [foodRestrictions, setFoodRestrictions] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmailSent, setInviteEmailSent] = useState(false);
  const inviteCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (clientId) loadClient();
  }, [clientId]);

  useEffect(() => {
    return () => {
      if (inviteCooldownRef.current) clearTimeout(inviteCooldownRef.current);
    };
  }, []);

  async function loadClient() {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setBirthDate(sqlToDate(data.birth_date));
        setGender(data.gender || "");
        setHeightCm(data.height_cm ? data.height_cm.toString() : "");
        setObservation(data.observation || "");
        setIsActive(data.is_active ?? true);
        setObjective((data.objective as Objective) || "");
        setActivityLevel((data.activity_level as ActivityLevel) || "");
        setFoodRestrictions(data.food_restrictions || "");
        setUserId(data.user_id ?? null);
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
      setStatusMsg({ text: "Não foi possível carregar os dados do aluno.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!name.trim()) {
      setStatusMsg({ text: "O nome é obrigatório.", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      const { error } = await supabase
        .from("clients")
        .update({
          name,
          email: email || null,
          phone: phone || null,
          birth_date: dateToSql(birthDate),
          gender: gender || null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          observation: observation || null,
          is_active: isActive,
          objective: objective || null,
          activity_level: activityLevel || null,
          food_restrictions: foodRestrictions.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId);

      if (error) throw error;

      setStatusMsg({ text: "Perfil atualizado com sucesso!", type: "success" });
    } catch (error: any) {
      setStatusMsg({ text: error.message || "Falha ao salvar alterações.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function callInviteFunction(channel: "email" | "whatsapp") {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    const { data, error: invokeError } = await supabase.functions.invoke("invite-client", {
      body: { client_id: clientId, channel },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (invokeError) {
      const ctx = (invokeError as any).context;
      const bodyText = ctx ? await ctx.text().catch(() => "") : "";
      let friendlyMsg = "Erro ao enviar convite.";
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed?.error) friendlyMsg = parsed.error;
      } catch {}
      throw new Error(friendlyMsg);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  }

  async function handleInviteByEmail() {
    if (!email.trim()) {
      setStatusMsg({ text: "Cadastre um e-mail para o aluno antes de enviar o convite.", type: "error" });
      return;
    }
    try {
      setInviting(true);
      setStatusMsg({ text: "", type: "" });
      await callInviteFunction("email");
      setStatusMsg({ text: "Convite enviado por e-mail para " + email, type: "success" });
      setInviteEmailSent(true);
      inviteCooldownRef.current = setTimeout(() => setInviteEmailSent(false), 60_000);
    } catch (err: any) {
      setStatusMsg({ text: err.message || "Falha ao enviar convite.", type: "error" });
    } finally {
      setInviting(false);
    }
  }

  async function handleInviteByWhatsApp() {
    if (!email.trim()) {
      setStatusMsg({ text: "Cadastre um e-mail para o aluno antes de enviar o convite.", type: "error" });
      return;
    }
    if (!phone.trim()) {
      setStatusMsg({ text: "Cadastre um telefone para o aluno antes de enviar o convite por WhatsApp.", type: "error" });
      return;
    }
    try {
      setInviting(true);
      setStatusMsg({ text: "", type: "" });
      const data = await callInviteFunction("whatsapp");
      const inviteLink: string = data?.invite_link ?? "";
      if (!inviteLink) throw new Error("Link de convite não retornado. Tente novamente.");
      const digits = phone.replace(/\D/g, "");
      const waPhone = "55" + digits;
      const msg = `Olá! Você foi convidado a acessar o Vortex Primus. Clique no link para criar seu acesso: ${inviteLink}`;
      await Linking.openURL(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`);
      setStatusMsg({ text: "WhatsApp aberto com o link de convite.", type: "success" });
    } catch (err: any) {
      setStatusMsg({ text: err.message || "Falha ao enviar convite por WhatsApp.", type: "error" });
    } finally {
      setInviting(false);
    }
  }

  async function callDeleteFunction() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    const { data, error: invokeError } = await supabase.functions.invoke("delete-client", {
      body: { client_id: clientId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (invokeError) {
      const ctx = (invokeError as any).context;
      const bodyText = ctx ? await ctx.text().catch(() => "") : "";
      let friendlyMsg = "Erro ao excluir o aluno.";
      try {
        const parsed = JSON.parse(bodyText);
        if (parsed?.error) friendlyMsg = parsed.error;
      } catch {}
      throw new Error(friendlyMsg);
    }
    if (data?.error) throw new Error(data.error);
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });

      await callDeleteFunction();

      setStatusMsg({ text: "Aluno excluído com sucesso!", type: "success" });
      setTimeout(() => router.back(), 1500);

    } catch (error: any) {
      setStatusMsg({ text: error.message || "Erro ao excluir o aluno.", type: "error" });
      setConfirmDelete(false);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Perfil do Aluno</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{isActive ? "Ativo" : "Inativo"}</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: T.t4, true: T.green }}
              thumbColor={T.white}
            />
          </View>
        </View>

        {statusMsg.text !== "" && (
          <View style={[
            styles.statusBox,
            statusMsg.type === "error" ? styles.statusError : styles.statusSuccess
          ]}>
            <Text style={[
              styles.statusText,
              statusMsg.type === "error" ? styles.statusTextError : styles.statusTextSuccess
            ]}>
              {statusMsg.type === "error" ? "⚠️ " : "✅ "}
              {statusMsg.text}
            </Text>
          </View>
        )}

        {/* BOTÕES DE AÇÃO */}
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <TouchableOpacity
            style={[styles.actionBtn, { flex: 1, marginRight: 6 }]}
            onPress={() => router.push(`/(protected)/client-assessments?id=${clientId}`)}
          >
            <Text style={styles.actionBtnText}>📈 HISTÓRICO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { flex: 1, marginLeft: 6 }]}
            onPress={() => router.push(`/(protected)/client-assessments?id=${clientId}&openForm=true`)}
          >
            <Text style={styles.actionBtnText}>➕ Nova Avaliação</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <TouchableOpacity
            style={[styles.actionBtn, { flex: 1, marginRight: 6, borderColor: T.green }]}
            onPress={() => router.push(`/(protected)/client-diet?id=${clientId}` as any)}
          >
            <Text style={[styles.actionBtnText, { color: T.green }]}>🥗 DIETA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { flex: 1, marginLeft: 6, borderColor: T.purple, opacity: inviting ? 0.7 : 1 }]}
            onPress={() => setShowInviteModal(true)}
            disabled={inviting}
          >
            {inviting
              ? <ActivityIndicator color={T.purple} />
              : <Text style={[styles.actionBtnText, { color: T.purple }]}>✉️ CONVITE</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome do aluno"
            placeholderTextColor={T.t3}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.label}>Nascimento</Text>
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={(t) => setBirthDate(formatDateInput(t))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={T.t3}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <View style={{ width: 110 }}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="Ex: 175"
                placeholderTextColor={T.t3}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Gênero</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === "M" && styles.genderBtnActive]}
              onPress={() => setGender("M")}
            >
              <Text style={[styles.genderBtnText, gender === "M" && styles.genderBtnTextActive]}>Masculino</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === "F" && styles.genderBtnActive]}
              onPress={() => setGender("F")}
            >
              <Text style={[styles.genderBtnText, gender === "F" && styles.genderBtnTextActive]}>Feminino</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>WhatsApp / Telefone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="(16) 99999-9999"
            placeholderTextColor={T.t3}
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="email@exemplo.com"
            placeholderTextColor={T.t3}
          />

          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={observation}
            onChangeText={setObservation}
            multiline
            numberOfLines={4}
            placeholder="Anotações, histórico de lesões, objetivos..."
            placeholderTextColor={T.t3}
          />

          <Text style={styles.label}>Objetivo</Text>
          {(Object.keys(OBJECTIVE_LABELS) as Objective[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.optionBtn, objective === key && styles.optionBtnActive]}
              onPress={() => setObjective(key)}
            >
              <Text style={[styles.optionBtnText, objective === key && styles.optionBtnTextActive]}>
                {OBJECTIVE_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.label, { marginTop: 8 }]}>Nível de Atividade</Text>
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.optionBtn, activityLevel === key && styles.optionBtnActive]}
              onPress={() => setActivityLevel(key)}
            >
              <Text style={[styles.optionBtnText, activityLevel === key && styles.optionBtnTextActive]}>
                {ACTIVITY_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.label, { marginTop: 8 }]}>Restrições Alimentares</Text>
          <TextInput
            style={[styles.input, styles.textArea, { marginBottom: 0 }]}
            value={foodRestrictions}
            onChangeText={setFoodRestrictions}
            multiline
            numberOfLines={3}
            placeholder="Ex: intolerância à lactose, alergia a amendoim..."
            placeholderTextColor={T.t3}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={saving} activeOpacity={0.85}>
          <LinearGradient {...GradientPrimary} style={styles.saveButtonGradient}>
            {saving ? <ActivityIndicator color={T.white} /> : <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, confirmDelete && styles.deleteButtonConfirm]}
          onPress={handleDelete}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={confirmDelete ? T.white : T.red} /> : (
            <Text style={[styles.deleteButtonText, confirmDelete && { color: T.white }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {confirmDelete ? "⚠️ TEM CERTEZA? CLIQUE PARA EXCLUIR" : "EXCLUIR ALUNO"}
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* MODAL: seleção de canal do convite */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowInviteModal(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Enviar Convite</Text>

            <TouchableOpacity
              style={[styles.modalOption, inviteEmailSent && { opacity: 0.5 }]}
              onPress={() => {
                if (inviteEmailSent) return;
                setShowInviteModal(false);
                handleInviteByEmail();
              }}
            >
              <Text style={styles.modalOptionIcon}>✉️</Text>
              <View>
                <Text style={styles.modalOptionLabel}>Por E-mail</Text>
                <Text style={styles.modalOptionSub}>
                  {inviteEmailSent
                    ? "Convite enviado — aguarde 60s para reenviar"
                    : "Supabase envia o link automaticamente"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => { setShowInviteModal(false); handleInviteByWhatsApp(); }}
            >
              <Text style={styles.modalOptionIcon}>💬</Text>
              <View>
                <Text style={styles.modalOptionLabel}>Por WhatsApp</Text>
                <Text style={styles.modalOptionSub}>Abre o WhatsApp com o link de acesso</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },
  scrollContent: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: T.t1 },
  statusRow: { flexDirection: "row", alignItems: "center", backgroundColor: T.surface, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  statusLabel: { marginRight: 8, fontWeight: "700", color: T.t2, fontSize: 12, textTransform: "uppercase" },

  statusBox: { padding: 14, borderRadius: 10, marginBottom: 20, borderWidth: 1 },
  statusError: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: T.red },
  statusSuccess: { backgroundColor: "rgba(16,185,129,0.08)", borderColor: T.green },
  statusText: { fontWeight: "bold", fontSize: 14, lineHeight: 20 },
  statusTextError: { color: T.red },
  statusTextSuccess: { color: T.green },

  actionBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  actionBtnText: { color: T.t1, fontSize: 13, fontWeight: "800" },

  formCard: { backgroundColor: T.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: T.border, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "800", color: T.t2, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 10, padding: 14, fontSize: 16, color: T.t1, marginBottom: 16 },
  row: { flexDirection: "row" },
  textArea: { height: 100, textAlignVertical: "top" },

  genderRow: { flexDirection: "row", marginBottom: 16 },
  genderBtn: { flex: 1, padding: 14, borderWidth: 1, borderColor: T.border, alignItems: "center", borderRadius: 10, marginRight: 5, backgroundColor: T.surface },
  genderBtnActive: { backgroundColor: T.blue, borderColor: T.blue },
  genderBtnText: { color: T.t2, fontWeight: "700" },
  genderBtnTextActive: { color: T.white },

  optionBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface, marginBottom: 8 },
  optionBtnActive: { backgroundColor: T.blue, borderColor: T.blue },
  optionBtnText: { color: T.t2, fontWeight: "600", fontSize: 14 },
  optionBtnTextActive: { color: T.white },

  saveButton: { borderRadius: 14, overflow: "hidden", marginBottom: 16 },
  saveButtonGradient: { height: 54, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  saveButtonText: { color: T.white, fontSize: 16, fontWeight: "800" },

  deleteButton: { padding: 16, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: T.red, backgroundColor: "transparent", width: "100%" },
  deleteButtonConfirm: { backgroundColor: T.red, borderColor: T.red },
  deleteButtonText: { color: T.red, fontSize: 14, fontWeight: "700" },

  // Modal de seleção de canal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, borderTopWidth: 1, borderColor: T.border },
  modalTitle: { fontSize: 18, fontWeight: "800", color: T.t1, marginBottom: 20, textAlign: "center" },
  modalOption: { flexDirection: "row", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  modalOptionIcon: { fontSize: 26, marginRight: 16 },
  modalOptionLabel: { fontSize: 16, fontWeight: "700", color: T.t1 },
  modalOptionSub: { fontSize: 13, color: T.t3, marginTop: 2 },
  modalCancel: { marginTop: 16, alignItems: "center", padding: 14, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: T.t2 },
});
