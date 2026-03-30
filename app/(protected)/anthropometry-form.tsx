import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AnthropometryForm() {
  const { assessment_id, client_id } = useLocalSearchParams();
  const router = useRouter();

  const assessmentId = assessment_id as string;
  const clientId = client_id as string;

  const [loading, setLoading] = useState(false);
  
  // Dados do aluno necessários para os cálculos da IA
  const [clientData, setClientData] = useState<{gender: string, birth_date: string} | null>(null);

  const [form, setForm] = useState({
    weight: "",
    height: "",
    body_fat: "",
    waist: "",
    hip: "",
    chest: "",
    abdomen: "",
    arm_right: "",
    arm_left: "",
    thigh_right: "",
    thigh_left: "",
    calf_right: "",
    calf_left: "",
    muscle_mass_percentage: "",
    basal_metabolic_rate: "",
    body_fat_index: "",
    metabolic_age: "",
  });

  useEffect(() => {
    // Busca dados do aluno para cálculos de idade e género
    async function loadClient() {
      if (clientId) {
        const { data } = await supabase.from("clients").select("gender, birth_date").eq("id", clientId).single();
        if (data) setClientData(data);
      }
    }
    loadClient();

    if (!assessmentId) return;

    async function loadData() {
      const { data } = await supabase
        .from("anthropometry")
        .select("*")
        .eq("assessment_id", assessmentId)
        .single();

      if (data) {
        setForm({
          weight: data.weight?.toString() || "",
          height: data.height?.toString() || "",
          body_fat: data.body_fat?.toString() || "",
          waist: data.waist?.toString() || "",
          hip: data.hip?.toString() || "",
          chest: data.chest?.toString() || "",
          abdomen: data.abdomen?.toString() || "",
          arm_right: data.arm_right?.toString() || "",
          arm_left: data.arm_left?.toString() || "",
          thigh_right: data.thigh_right?.toString() || "",
          thigh_left: data.thigh_left?.toString() || "",
          calf_right: data.calf_right?.toString() || "",
          calf_left: data.calf_left?.toString() || "",
          muscle_mass_percentage: data.muscle_mass_percentage?.toString() || "",
          basal_metabolic_rate: data.basal_metabolic_rate?.toString() || "",
          body_fat_index: data.body_fat_index?.toString() || "",
          metabolic_age: data.metabolic_age?.toString() || "",
        });
      }
    }

    loadData();
  }, [assessmentId, clientId]);

  // Função para calcular a idade exata
  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return 30; // Idade média padrão caso falhe
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // 🪄 IA ANTROPOMÉTRICA - AVALIAÇÃO À DISTÂNCIA
  function calculateRemoteAssessment() {
    if (!form.weight || !form.height || !form.waist) {
      Alert.alert("Atenção", "Para a IA calcular, preencha primeiro o Peso, Altura e Cintura.");
      return;
    }

    const weight = parseFloat(form.weight.replace(',', '.'));
    const height = parseFloat(form.height.replace(',', '.'));
    const waist = parseFloat(form.waist.replace(',', '.'));
    
    if (isNaN(weight) || isNaN(height) || isNaN(waist)) {
      Alert.alert("Erro", "Certifique-se de que os valores de Peso, Altura e Cintura contêm apenas números.");
      return;
    }

    const gender = clientData?.gender || 'M';
    const age = calculateAge(clientData?.birth_date || new Date().toISOString());

    // 1. % Gordura (RFM - Relative Fat Mass Cedars-Sinai)
    let bodyFat = (gender === 'M' || gender === 'Masculino') 
      ? 64 - (20 * (height / waist)) 
      : 76 - (20 * (height / waist));
    bodyFat = Math.max(5, Math.min(bodyFat, 60)); 

    // 2. Metabolismo Basal (Mifflin-St Jeor)
    let bmr = (gender === 'M' || gender === 'Masculino') 
      ? (10 * weight) + (6.25 * height) - (5 * age) + 5 
      : (10 * weight) + (6.25 * height) - (5 * age) - 161;

    // 3. Massa Muscular %
    const leanMass = weight * (1 - (bodyFat / 100));
    const skeletalMuscleMass = leanMass * 0.55;
    const musclePercentage = (skeletalMuscleMass / weight) * 100;

    // 4. Gordura Visceral (Estimativa Omron)
    let visceral = (gender === 'M' || gender === 'Masculino') ? (waist / 10) - 2 : (waist / 10) - 3;
    visceral = Math.max(1, Math.round(visceral));

    // 5. Idade Metabólica
    const idealFat = (gender === 'M' || gender === 'Masculino') ? 15 : 25;
    let metabolicAge = age + Math.round((bodyFat - idealFat) / 1.5);
    metabolicAge = Math.max(18, metabolicAge); 

    setForm({
      ...form,
      body_fat: bodyFat.toFixed(1),
      muscle_mass_percentage: musclePercentage.toFixed(1),
      basal_metabolic_rate: Math.round(bmr).toString(),
      body_fat_index: visceral.toString(),
      metabolic_age: metabolicAge.toString()
    });
    
    Alert.alert("Cálculo Clínico Concluído! 🪄", "Os parâmetros foram preenchidos usando as equações avançadas de RFM e Mifflin-St Jeor.");
  }

  async function handleSave() {
    if (!assessmentId) {
      Alert.alert("Erro", "Assessment ID não encontrado.");
      return;
    }

    setLoading(true);

    const payload = {
      assessment_id: assessmentId,
      weight: form.weight ? Number(form.weight.replace(',','.')) : null,
      height: form.height ? Number(form.height.replace(',','.')) : null,
      body_fat: form.body_fat ? Number(form.body_fat.replace(',','.')) : null,
      waist: form.waist ? Number(form.waist.replace(',','.')) : null,
      hip: form.hip ? Number(form.hip.replace(',','.')) : null,
      chest: form.chest ? Number(form.chest.replace(',','.')) : null,
      abdomen: form.abdomen ? Number(form.abdomen.replace(',','.')) : null,
      arm_right: form.arm_right ? Number(form.arm_right.replace(',','.')) : null,
      arm_left: form.arm_left ? Number(form.arm_left.replace(',','.')) : null,
      thigh_right: form.thigh_right ? Number(form.thigh_right.replace(',','.')) : null,
      thigh_left: form.thigh_left ? Number(form.thigh_left.replace(',','.')) : null,
      calf_right: form.calf_right ? Number(form.calf_right.replace(',','.')) : null,
      calf_left: form.calf_left ? Number(form.calf_left.replace(',','.')) : null,
      muscle_mass_percentage: form.muscle_mass_percentage ? Number(form.muscle_mass_percentage.replace(',','.')) : null,
      basal_metabolic_rate: form.basal_metabolic_rate ? Number(form.basal_metabolic_rate.replace(',','.')) : null,
      body_fat_index: form.body_fat_index ? Number(form.body_fat_index.replace(',','.')) : null,
      metabolic_age: form.metabolic_age ? Number(form.metabolic_age.replace(',','.')) : null,
    };

    const { data: existing } = await supabase
      .from("anthropometry")
      .select("id")
      .eq("assessment_id", assessmentId)
      .single();

    let error;

    if (existing) {
      ({ error } = await supabase
        .from("anthropometry")
        .update(payload)
        .eq("assessment_id", assessmentId));
    } else {
      ({ error } = await supabase
        .from("anthropometry")
        .insert(payload));
    }

    setLoading(false);

    if (error) {
      Alert.alert("Erro ao salvar", error.message);
      return;
    }

    Alert.alert("Sucesso", "Avaliação salva com sucesso.");

    router.replace(`/(protected)/client-details?id=${clientId}`);
  }

  function renderInput(label: string, key: keyof typeof form) {
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={{ marginBottom: 4, fontWeight: "600", color: "#334155" }}>{label}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form[key]}
          onChangeText={(text) => setForm({ ...form, [key]: text })}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          
          <View style={{ marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#0f172a" }}>Avaliação Corporal</Text>
            <Text style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>Preencha os dados da bioimpedância ou fita métrica.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Medidas Básicas</Text>
            {renderInput("Peso (kg)", "weight")}
            {renderInput("Altura (cm)", "height")}
            {renderInput("Cintura (cm)", "waist")}
          </View>

          {/* 🔴 O BOTÃO MÁGICO DE AVALIAÇÃO À DISTÂNCIA */}
          <TouchableOpacity 
            style={{ backgroundColor: '#eff6ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f6', marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: "#3b82f6", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 }}
            onPress={calculateRemoteAssessment}
          >
            <Text style={{ fontSize: 20, marginRight: 8 }}>🪄</Text>
            <View>
              <Text style={{ color: '#1d4ed8', fontWeight: '900', fontSize: 15 }}>Auto-Preencher via IA</Text>
              <Text style={{ color: '#2563eb', fontSize: 11 }}>Calcula Gordura, Músculo e Metabolismo à distância</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bioimpedância / Resultados IA</Text>
            {renderInput("% Gordura Corporal", "body_fat")}
            {renderInput("% Massa Muscular", "muscle_mass_percentage")}
            {renderInput("Índice de Gordura Visceral", "body_fat_index")}
            {renderInput("Idade Metabólica", "metabolic_age")}
            {renderInput("Taxa Metabólica Basal (kcal)", "basal_metabolic_rate")}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Circunferências Complementares (Tronco)</Text>
            {renderInput("Quadril (cm)", "hip")}
            {renderInput("Peitoral (cm)", "chest")}
            {renderInput("Abdômen (cm)", "abdomen")}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Membros (Direito / Esquerdo)</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>{renderInput("Braço Dir.", "arm_right")}</View>
              <View style={{ flex: 1, marginLeft: 8 }}>{renderInput("Braço Esq.", "arm_left")}</View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>{renderInput("Coxa Dir.", "thigh_right")}</View>
              <View style={{ flex: 1, marginLeft: 8 }}>{renderInput("Coxa Esq.", "thigh_left")}</View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>{renderInput("Pantur. Dir.", "calf_right")}</View>
              <View style={{ flex: 1, marginLeft: 8 }}>{renderInput("Pantur. Esq.", "calf_left")}</View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? "Salvando..." : "SALVAR AVALIAÇÃO"}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#0f172a",
  },
  saveBtn: {
    backgroundColor: "#0f172a",
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  saveBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 1,
  },
});