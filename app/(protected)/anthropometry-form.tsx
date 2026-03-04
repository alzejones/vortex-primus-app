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
          muscle_mass_percentage:
            data.muscle_mass_percentage?.toString() || "",
          basal_metabolic_rate:
            data.basal_metabolic_rate?.toString() || "",
          body_fat_index: data.body_fat_index?.toString() || "",
          metabolic_age: data.metabolic_age?.toString() || "",
        });
      }
    }

    loadData();
  }, [assessmentId]);

  async function handleSave() {
    if (!assessmentId) {
      Alert.alert("Erro", "Assessment ID não encontrado.");
      return;
    }

    setLoading(true);

    const payload = {
      assessment_id: assessmentId,
      weight: form.weight ? Number(form.weight) : null,
      height: form.height ? Number(form.height) : null,
      body_fat: form.body_fat ? Number(form.body_fat) : null,
      waist: form.waist ? Number(form.waist) : null,
      hip: form.hip ? Number(form.hip) : null,
      chest: form.chest ? Number(form.chest) : null,
      abdomen: form.abdomen ? Number(form.abdomen) : null,
      arm_right: form.arm_right ? Number(form.arm_right) : null,
      arm_left: form.arm_left ? Number(form.arm_left) : null,
      thigh_right: form.thigh_right ? Number(form.thigh_right) : null,
      thigh_left: form.thigh_left ? Number(form.thigh_left) : null,
      calf_right: form.calf_right ? Number(form.calf_right) : null,
      calf_left: form.calf_left ? Number(form.calf_left) : null,
      muscle_mass_percentage: form.muscle_mass_percentage
        ? Number(form.muscle_mass_percentage)
        : null,
      basal_metabolic_rate: form.basal_metabolic_rate
        ? Number(form.basal_metabolic_rate)
        : null,
      body_fat_index: form.body_fat_index
        ? Number(form.body_fat_index)
        : null,
      metabolic_age: form.metabolic_age
        ? Number(form.metabolic_age)
        : null,
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
        <Text style={{ marginBottom: 4 }}>{label}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form[key]}
          onChangeText={(text) =>
            setForm({ ...form, [key]: text })
          }
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
            Avaliação Corporal
          </Text>

          {renderInput("Peso (kg)", "weight")}
          {renderInput("Altura (cm)", "height")}
          {renderInput("% Gordura", "body_fat")}
          {renderInput("Cintura", "waist")}
          {renderInput("Quadril", "hip")}
          {renderInput("Peitoral", "chest")}
          {renderInput("Abdômen", "abdomen")}
          {renderInput("Braço Direito", "arm_right")}
          {renderInput("Braço Esquerdo", "arm_left")}
          {renderInput("Coxa Direita", "thigh_right")}
          {renderInput("Coxa Esquerda", "thigh_left")}
          {renderInput("Panturrilha Direita", "calf_right")}
          {renderInput("Panturrilha Esquerda", "calf_left")}
          {renderInput("% Massa Muscular", "muscle_mass_percentage")}
          {renderInput("Taxa Metabólica Basal", "basal_metabolic_rate")}
          {renderInput("Índice Gordura Corporal", "body_fat_index")}
          {renderInput("Idade Metabólica", "metabolic_age")}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              {loading ? "Salvando..." : "Salvar Avaliação"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
  },
  button: {
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
  },
});
