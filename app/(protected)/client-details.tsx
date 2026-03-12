import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  // Estados
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [observation, setObservation] = useState(""); // Novo campo
  const [isActive, setIsActive] = useState(true);

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
        setObservation(data.observation || ""); // Carrega a observação
        setIsActive(data.is_active ?? true);
      }
    } catch (error) {
      console.error("Erro ao carregar:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do aluno.");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!name.trim()) {
      Alert.alert("Aviso", "O nome é obrigatório.");
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from("clients")
        .update({
          name,
          email: email || null,
          phone: phone || null,
          birth_date: dateToSql(birthDate),
          gender: gender || null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          observation: observation || null, // Salva a observação
          is_active: isActive,
          updated_at: new Date().toISOString(), // Agora a coluna existe no banco!
        })
        .eq("id", clientId);

      if (error) throw error;
      Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (error: any) {
      Alert.alert("Erro Técnico", error.message || "Falha ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert(
      "Excluir Aluno",
      "Isso apagará permanentemente o aluno e todo o seu histórico. Confirmar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              const { error } = await supabase.from("clients").delete().eq("id", clientId);
              if (error) throw error;
              router.replace("/(protected)/dashboard");
            } catch (error: any) {
              Alert.alert("Erro Técnico", error.message || "Não foi possível excluir.");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
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

        <TouchableOpacity 
          style={styles.assessmentsButton}
          onPress={() => router.push(`/(protected)/client-assessments?id=${clientId}`)}
        >
          <Text style={styles.assessmentsButtonText}>📋 ACESSAR AVALIAÇÕES</Text>
        </TouchableOpacity>

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

          {/* NOVO CAMPO DE OBSERVAÇÃO */}
          <Text style={styles.label}>Observações</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={observation} 
            onChangeText={setObservation} 
            multiline 
            numberOfLines={4} 
            placeholder="Anotações, histórico de lesões, objetivos..." 
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>SALVAR ALTERAÇÕES</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={saving}>
          <Text style={styles.deleteButtonText}>EXCLUIR ALUNO</Text>
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
  textArea: { height: 100, textAlignVertical: "top" }, // Estilo específico para o campo multilinhas
  
  genderRow: { flexDirection: 'row', marginBottom: 16 },
  genderBtn: { flex: 1, padding: 14, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', borderRadius: 10, marginRight: 5, backgroundColor: '#fff' },
  genderBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  genderBtnText: { color: '#4b5563', fontWeight: '700' },
  genderBtnTextActive: { color: '#fff' },

  saveButton: { backgroundColor: "#10b981", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  
  deleteButton: { padding: 16, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  deleteButtonText: { color: "#dc2626", fontSize: 14, fontWeight: "bold" },
});

