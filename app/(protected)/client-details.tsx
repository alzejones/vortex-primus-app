import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

  // 🔴 NOVO: Estado para substituir os Alerts falhos e botão de confirmação dupla
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Estados
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
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (clientId) loadClient();
  }, [clientId]);

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

  async function handleInvite() {
    if (!email.trim()) {
      setStatusMsg({ text: "Cadastre um e-mail para o aluno antes de enviar o convite.", type: "error" });
      return;
    }
    try {
      setInviting(true);
      setStatusMsg({ text: "", type: "" });

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://qgeezszpcuypqujplkde.supabase.co/functions/v1/invite-client`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZWV6c3pwY3V5cHF1anBsa2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MjU5OTYsImV4cCI6MjA4NDUwMTk5Nn0.OLdh9gNyaz8x2c9-QXpqE5FH2r0-8r54vyvhWjowwJo",
          },
          body: JSON.stringify({ client_id: clientId }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao enviar convite");

      setStatusMsg({ text: "Convite enviado para " + email, type: "success" });
    } catch (err: any) {
      setStatusMsg({ text: err.message || "Falha ao enviar convite.", type: "error" });
    } finally {
      setInviting(false);
    }
  }

  async function handleDelete() {
    // 🔴 NOVO: Sistema de confirmação de 2 cliques (Ignora o bug do Alert)
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Se ele não clicar em 4 segundos, o botão volta ao normal
      setTimeout(() => setConfirmDelete(false), 4000); 
      return;
    }

    try {
      setSaving(true);
      setStatusMsg({ text: "", type: "" });
      
      const { data, error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        setStatusMsg({ text: "Bloqueio de Segurança: O registo não pôde ser excluído.", type: "error" });
        setConfirmDelete(false);
        return;
      }

      setStatusMsg({ text: "Aluno excluído com sucesso!", type: "success" });
      
      setTimeout(() => {
        router.back(); // Retorno 100% seguro para o dashboard
      }, 1500);

    } catch (error: any) {
      // 🔴 Captura o erro do banco de dados (ex: se o aluno estiver na agenda)
      setStatusMsg({ 
        text: "Erro ao excluir: O aluno possui agendamentos ou avaliações cadastradas. Apague o histórico dele primeiro.", 
        type: "error" 
      });
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
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
                    trackColor={{ false: "#d1d5db", true: "#10b981" }}
                    thumbColor="#fff"
                />
            </View>
        </View>

        {/* 🔴 CAIXA DE MENSAGENS VISUAIS (SUBSTITUI OS ALERTS) */}
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
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <TouchableOpacity
            style={[styles.assessmentsButton, { flex: 1, marginRight: 6, marginBottom: 0 }]}
            onPress={() => router.push(`/(protected)/client-assessments?id=${clientId}`)}
          >
            <Text style={[styles.assessmentsButtonText, { fontSize: 13 }]}>📈 HISTÓRICO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.assessmentsButton, { flex: 1, marginLeft: 6, marginBottom: 0, backgroundColor: '#0f172a', shadowColor: '#0f172a' }]}
            onPress={() => router.push(`/(protected)/client-assessments?id=${clientId}&openForm=true`)}
          >
            <Text style={[styles.assessmentsButtonText, { fontSize: 13 }]}>➕ AVALIAÇÃO</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <TouchableOpacity
            style={[styles.assessmentsButton, { flex: 1, marginRight: 6, marginBottom: 0, backgroundColor: '#059669', shadowColor: '#059669' }]}
            onPress={() => router.push(`/(protected)/client-diet?id=${clientId}` as any)}
          >
            <Text style={[styles.assessmentsButtonText, { fontSize: 13 }]}>🥗 DIETA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.assessmentsButton, { flex: 1, marginLeft: 6, marginBottom: 0, backgroundColor: '#7c3aed', shadowColor: '#7c3aed', opacity: inviting ? 0.7 : 1 }]}
            onPress={handleInvite}
            disabled={inviting}
          >
            {inviting
              ? <ActivityIndicator color="#fff" />
              : <Text style={[styles.assessmentsButtonText, { fontSize: 13 }]}>✉️ CONVITE</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome do aluno" />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Nascimento</Text>
                <TextInput 
                    style={styles.input} 
                    value={birthDate} 
                    onChangeText={(t) => setBirthDate(formatDateInput(t))} 
                    placeholder="DD/MM/AAAA"
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
                    keyboardType="numeric"
                />
            </View>
          </View>

          <Text style={styles.label}>Gênero</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity 
                style={[styles.genderBtn, gender === 'M' && styles.genderBtnActive]} 
                onPress={() => setGender('M')}
            >
                <Text style={[styles.genderBtnText, gender === 'M' && styles.genderBtnTextActive]}>Masculino</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.genderBtn, gender === 'F' && styles.genderBtnActive]} 
                onPress={() => setGender('F')}
            >
                <Text style={[styles.genderBtnText, gender === 'F' && styles.genderBtnTextActive]}>Feminino</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>WhatsApp / Telefone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="(16) 99999-9999" />

          <Text style={styles.label}>E-mail</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="email@exemplo.com" />

          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={observation}
            onChangeText={setObservation}
            multiline
            numberOfLines={4}
            placeholder="Anotações, histórico de lesões, objetivos..."
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
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>}
        </TouchableOpacity>

        {/* 🔴 BOTÃO DE EXCLUIR INTELIGENTE */}
        <TouchableOpacity 
          style={[styles.deleteButton, confirmDelete && { backgroundColor: "#ef4444", borderColor: "#dc2626" }]} 
          onPress={handleDelete} 
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={confirmDelete ? "#fff" : "#dc2626"} /> : (
            <Text style={[styles.deleteButtonText, confirmDelete && { color: "#fff" }]}>
              {confirmDelete ? "⚠️ TEM CERTEZA? CLIQUE PARA EXCLUIR" : "EXCLUIR ALUNO"}
            </Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#111827" },
  statusRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  statusLabel: { marginRight: 8, fontWeight: '700', color: '#374151', fontSize: 12, textTransform: 'uppercase' },
  
  statusBox: { padding: 14, borderRadius: 10, marginBottom: 20, borderWidth: 1 },
  statusError: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  statusSuccess: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  statusText: { fontWeight: "bold", fontSize: 14, lineHeight: 20 },
  statusTextError: { color: "#dc2626" },
  statusTextSuccess: { color: "#16a34a" },

  assessmentsButton: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  assessmentsButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  
  formCard: { backgroundColor: "#fff", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "800", color: "#6b7280", marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 14, fontSize: 16, color: "#111827", marginBottom: 16 },
  row: { flexDirection: 'row' },
  textArea: { height: 100, textAlignVertical: "top" }, 
  
  genderRow: { flexDirection: 'row', marginBottom: 16 },
  genderBtn: { flex: 1, padding: 14, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', borderRadius: 10, marginRight: 5, backgroundColor: '#fff' },
  genderBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  genderBtnText: { color: '#4b5563', fontWeight: '700' },
  genderBtnTextActive: { color: '#fff' },

  saveButton: { backgroundColor: "#10b981", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  
  deleteButton: { padding: 16, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  deleteButtonText: { color: "#dc2626", fontSize: 14, fontWeight: "bold" },
  optionBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#d1d5db", backgroundColor: "#f9fafb", marginBottom: 8 },
  optionBtnActive: { backgroundColor: "#111827", borderColor: "#111827" },
  optionBtnText: { color: "#374151", fontWeight: "600", fontSize: 14 },
  optionBtnTextActive: { color: "#fff" },
});
