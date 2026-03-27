import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { supabase } from "../../lib/supabase";

export default function ClientCreate() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [debugLog, setDebugLog] = useState("A aguardar clique...");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    height_cm: "",
    notes: "", 
  });

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLog((prev) => prev + "\n" + msg);
  };

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePhoneChange(text: string) {
    if (!text) { handleChange("phone", ""); return; }
    let v = text.replace(/\D/g, ""); 
    v = v.substring(0, 11); 
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    if (v.length > 7) v = v.replace(/(\d{5})(\d)/, "$1-$2");
    handleChange("phone", v);
  }

  function handleDateChange(text: string) {
    if (!text) { handleChange("birth_date", ""); return; }
    let v = text.replace(/\D/g, ""); 
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    if (v.length > 5) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
    handleChange("birth_date", v.substring(0, 10)); 
  }

  const calculatedAge = useMemo(() => {
    if (form.birth_date && form.birth_date.length === 10) {
      const [d, m, y] = form.birth_date.split("/");
      const birth = new Date(Number(y), Number(m) - 1, Number(d));
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const mDiff = today.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) { age--; }
      return age >= 0 && age < 150 ? `${age} anos` : "";
    }
    return "";
  }, [form.birth_date]);

  function parseDateToDB(dateStr: string) {
    if (!dateStr || dateStr.length !== 10) return null;
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }

  const handleSave = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    
    setDebugLog("--- INÍCIO DO TESTE ---");
    
    const safeName = form.name || "";
    if (safeName.trim() === "") {
      addLog("❌ Cancelado: Nome estava vazio.");
      return;
    }

    setLoading(true);
    addLog("⏳ 1. Estado de loading ativado.");

    try {
      addLog("🔍 2. A procurar sessão do utilizador...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addLog("❌ ERRO AUTH: " + authError.message);
        setLoading(false);
        return;
      }
      if (!user) {
        addLog("❌ ERRO: Utilizador não encontrado (Sessão vazia).");
        setLoading(false);
        return;
      }
      addLog("✅ Sessão encontrada (ID: " + user.id.substring(0,6) + "...)");

      addLog("🔍 3. A procurar perfil do Treinador...");
      const { data: trainer, error: trainerError } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (trainerError) {
        addLog("❌ ERRO TREINADOR: " + JSON.stringify(trainerError));
        setLoading(false);
        return;
      }
      if (!trainer) {
        addLog("❌ ERRO: Treinador não existe na base de dados.");
        setLoading(false);
        return;
      }
      addLog("✅ Treinador encontrado!");

      addLog("⏳ 4. A preparar dados para envio...");
      const formattedDate = parseDateToDB(form.birth_date);
      const safeGenderVal = form.gender || "";
      let safeGenderDB = safeGenderVal.trim().toUpperCase();
      safeGenderDB = safeGenderDB.length > 0 ? safeGenderDB.charAt(0) : null as any;

      const payload = {
        trainer_id: trainer.id,
        name: safeName.trim(),
        email: (form.email || "").trim() || null,
        phone: (form.phone || "").trim() || null,
        birth_date: formattedDate,
        gender: safeGenderDB,
        height_cm: form.height_cm ? parseInt(form.height_cm, 10) : null,
        observation: (form.notes || "").trim() || null,
      };

      addLog("📤 5. A enviar para o Supabase...");
      const { error } = await supabase.from("clients").insert([payload]);

      if (error) {
        addLog("❌ ERRO DO SUPABASE: " + JSON.stringify(error));
        throw error;
      }

      addLog("✅ 6. SUCESSO! Guardado com sucesso.");
      
    } catch (error: any) {
      addLog("💥 CRASH/CATCH: " + (error.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
      addLog("🛑 FIM: Loading desligado.");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f9fafb" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Novo Cliente</Text>
        
        {/* CAIXA DE DIAGNÓSTICO (DEBUG) */}
        <View style={{ backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <Text style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: 8 }}>MONITOR DE SISTEMA (DEBUG):</Text>
          <Text style={{ color: '#f8fafc', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
            {debugLog}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput placeholder="Ex: João Teste" value={form.name} onChangeText={(v) => handleChange("name", v)} style={styles.input} />
        </View>

        {/* Simplifiquei o resto do formulário visualmente para este teste */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput placeholder="Ex: joao@email.com" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => handleChange("email", v)} style={styles.input} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observações</Text>
          <TextInput placeholder="Condições médicas, etc..." value={form.notes} onChangeText={(v) => handleChange("notes", v)} style={[styles.input, styles.textArea]} multiline numberOfLines={4} textAlignVertical="top" />
        </View>

        <TouchableOpacity onPress={handleSave} style={styles.button} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar Cliente</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pageTitle: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 20, marginTop: 10 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, padding: 12, backgroundColor: "#fff", fontSize: 15, color: "#111827" },
  textArea: { minHeight: 100 },
  button: { backgroundColor: "#000", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

