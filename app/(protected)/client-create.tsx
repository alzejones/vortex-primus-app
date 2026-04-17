import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import {
  ACTIVITY_LABELS,
  ActivityLevel,
  OBJECTIVE_LABELS,
  Objective,
} from "../../utils/dietCalculations";
import { GradientPrimary } from "../../utils/gradients";
import { T } from "../../utils/theme";

export default function ClientCreate() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    height_cm: "",
    notes: "",
    objective: "" as Objective | "",
    activity_level: "" as ActivityLevel | "",
    food_restrictions: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatusMsg({ text: "", type: "" });
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
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
      return age >= 0 && age < 150 ? `${age} anos` : "";
    }
    return "";
  }, [form.birth_date]);

  function parseDateToDB(dateStr: string) {
    if (!dateStr || dateStr.length !== 10) return null;
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m}-${d}`;
  }

  const handleSave = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();

    setStatusMsg({ text: "", type: "" });

    const safeName = form.name || "";
    if (safeName.trim() === "") {
      setStatusMsg({ text: "O nome do cliente é obrigatório.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setStatusMsg({ text: "Sessão expirada. Faça login novamente.", type: "error" });
        setLoading(false);
        return;
      }

      const { data: trainer, error: trainerError } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (trainerError || !trainer) {
        setStatusMsg({ text: "Perfil de treinador não encontrado.", type: "error" });
        setLoading(false);
        return;
      }

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
        objective: form.objective || null,
        activity_level: form.activity_level || null,
        food_restrictions: (form.food_restrictions || "").trim() || null,
      };

      const { data: newClient, error } = await supabase.from("clients").insert([payload]).select("id").single();

      if (error) throw error;

      setStatusMsg({ text: "Cliente guardado com sucesso!", type: "success" });

      if (from === "schedule" && newClient?.id) {
        setTimeout(() => {
          router.replace({ pathname: "/(protected)/schedule/new" as any, params: { client_id: newClient.id } });
        }, 1000);
      } else {
        setTimeout(() => {
          router.back();
        }, 1500);
      }

    } catch (error: any) {
      console.log("Erro no catch:", error);
      const errorMsg = error.message || "";

      if (errorMsg.includes("Limite de clientes") || errorMsg.includes("P0001")) {
        setStatusMsg({
          text: "Você atingiu o limite de alunos do seu plano atual. Faça um upgrade para continuar crescendo!",
          type: "limit"
        });
      } else {
        setStatusMsg({ text: errorMsg || "Erro inesperado ao guardar.", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>Novo Cliente</Text>

        {statusMsg.text !== "" && (
          <View style={[
            styles.statusBox,
            statusMsg.type === "error" ? styles.statusError :
            statusMsg.type === "limit" ? styles.statusLimit : styles.statusSuccess
          ]}>
            <Text style={[
              styles.statusText,
              statusMsg.type === "error" ? styles.statusTextError :
              statusMsg.type === "limit" ? styles.statusTextLimit : styles.statusTextSuccess
            ]}>
              {statusMsg.type === "success" ? "✅ " :
               statusMsg.type === "limit" ? "👑 " : "⚠️ "}
              {statusMsg.text}
            </Text>

            {statusMsg.type === "limit" && (
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => router.push("/(protected)/upgrade" as any)}
              >
                <Text style={styles.upgradeBtnText}>⭐ Conhecer Planos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            placeholder="Ex: João da Silva"
            placeholderTextColor={T.t3}
            value={form.name}
            onChangeText={(v) => handleChange("name", v)}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            placeholder="Ex: joao@email.com"
            placeholderTextColor={T.t3}
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(v) => handleChange("email", v)}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            placeholder="(00) 00000-0000"
            placeholderTextColor={T.t3}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={handlePhoneChange}
            maxLength={15}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>
              Data Nasc. {calculatedAge ? <Text style={styles.ageText}>({calculatedAge})</Text> : null}
            </Text>
            <TextInput
              placeholder="DD/MM/AAAA"
              placeholderTextColor={T.t3}
              keyboardType="numeric"
              value={form.birth_date}
              onChangeText={handleDateChange}
              style={styles.input}
              maxLength={10}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Sexo</Text>
            <TextInput
              placeholder="Ex: M ou F"
              placeholderTextColor={T.t3}
              value={form.gender}
              onChangeText={(v) => handleChange("gender", v)}
              style={styles.input}
              maxLength={1}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Altura (cm)</Text>
          <TextInput
            placeholder="Ex: 175"
            placeholderTextColor={T.t3}
            keyboardType="numeric"
            value={form.height_cm}
            onChangeText={(v) => handleChange("height_cm", v)}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            placeholder="Condições médicas, objetivos, etc..."
            placeholderTextColor={T.t3}
            value={form.notes}
            onChangeText={(v) => handleChange("notes", v)}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Objetivo</Text>
          {(Object.keys(OBJECTIVE_LABELS) as Objective[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.optionBtn, form.objective === key && styles.optionBtnActive]}
              onPress={() => handleChange("objective", key)}
            >
              <Text style={[styles.optionBtnText, form.objective === key && styles.optionBtnTextActive]}>
                {OBJECTIVE_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nível de Atividade</Text>
          {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.optionBtn, form.activity_level === key && styles.optionBtnActive]}
              onPress={() => handleChange("activity_level", key)}
            >
              <Text style={[styles.optionBtnText, form.activity_level === key && styles.optionBtnTextActive]}>
                {ACTIVITY_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Restrições Alimentares</Text>
          <TextInput
            placeholder="Ex: intolerância à lactose, alergia a amendoim..."
            placeholderTextColor={T.t3}
            value={form.food_restrictions}
            onChangeText={(v) => handleChange("food_restrictions", v)}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity onPress={handleSave} style={styles.button} disabled={loading} activeOpacity={0.85}>
          <LinearGradient {...GradientPrimary} style={styles.buttonGradient}>
            {loading
              ? <ActivityIndicator color={T.white} />
              : <Text style={styles.buttonText}>Salvar Cliente</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pageTitle: { fontSize: 26, fontWeight: "800", color: T.t1, marginBottom: 20, marginTop: 10 },

  statusBox: { padding: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1 },
  statusError: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: T.red },
  statusSuccess: { backgroundColor: "rgba(16,185,129,0.08)", borderColor: T.green },
  statusLimit: { backgroundColor: "rgba(245,158,11,0.08)", borderColor: T.orange },

  statusText: { fontWeight: "bold", fontSize: 15, lineHeight: 22 },
  statusTextError: { color: T.red },
  statusTextSuccess: { color: T.green },
  statusTextLimit: { color: T.orange },

  upgradeBtn: { marginTop: 12, backgroundColor: T.orange, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  upgradeBtnText: { color: T.white, fontWeight: "bold", fontSize: 14 },

  inputGroup: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 13, fontWeight: "700", color: T.t2, marginBottom: 6 },
  ageText: { color: T.blue, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: T.border, borderRadius: 10, padding: 12, backgroundColor: T.surface, fontSize: 15, color: T.t1 },
  textArea: { minHeight: 100 },

  button: { borderRadius: 14, overflow: "hidden", marginTop: 10 },
  buttonGradient: { height: 54, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  buttonText: { color: T.white, fontWeight: "800", fontSize: 16 },

  optionBtn: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: T.border, backgroundColor: T.card, marginBottom: 8 },
  optionBtnActive: { backgroundColor: T.blue, borderColor: T.blue },
  optionBtnText: { color: T.t2, fontWeight: "600", fontSize: 14 },
  optionBtnTextActive: { color: T.white },
});
