import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function AnthropometryForm() {
  const { assessmentId } = useLocalSearchParams();
  const router = useRouter();

  const safeAssessmentId = Array.isArray(assessmentId)
    ? assessmentId[0]
    : assessmentId;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  const [form, setForm] = useState<any>({
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
    async function loadData() {
      if (!safeAssessmentId) return;

      // Buscar assessment
      const { data: assessment } = await supabase
        .from("physical_assessments")
        .select("client_id")
        .eq("id", safeAssessmentId)
        .single();

      if (!assessment) {
        setLoading(false);
        return;
      }

      // Buscar cliente
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", assessment.client_id)
        .single();

      setClient(clientData);

      // Buscar anthropometry (preload)
      const { data: anthropometry } = await supabase
        .from("anthropometry")
        .select("*")
        .eq("assessment_id", safeAssessmentId)
        .maybeSingle();

      if (anthropometry) {
        setForm({
          weight: anthropometry.weight?.toString() ?? "",
          height: anthropometry.height?.toString() ?? "",
          body_fat: anthropometry.body_fat?.toString() ?? "",
          waist: anthropometry.waist?.toString() ?? "",
          hip: anthropometry.hip?.toString() ?? "",
          chest: anthropometry.chest?.toString() ?? "",
          abdomen: anthropometry.abdomen?.toString() ?? "",
          arm_right: anthropometry.arm_right?.toString() ?? "",
          arm_left: anthropometry.arm_left?.toString() ?? "",
          thigh_right: anthropometry.thigh_right?.toString() ?? "",
          thigh_left: anthropometry.thigh_left?.toString() ?? "",
          calf_right: anthropometry.calf_right?.toString() ?? "",
          calf_left: anthropometry.calf_left?.toString() ?? "",
          muscle_mass_percentage:
            anthropometry.muscle_mass_percentage?.toString() ?? "",
          basal_metabolic_rate:
            anthropometry.basal_metabolic_rate?.toString() ?? "",
          body_fat_index:
            anthropometry.body_fat_index?.toString() ?? "",
          metabolic_age:
            anthropometry.metabolic_age?.toString() ?? "",
        });
      }

      setLoading(false);
    }

    loadData();
  }, [safeAssessmentId]);

  function handleChange(field: string, value: string) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!safeAssessmentId) return;

    const payload = {
      assessment_id: safeAssessmentId,
      ...Object.fromEntries(
        Object.entries(form).map(([k, v]) => [
          k,
          v === "" ? null : Number(v),
        ])
      ),
    };

    const { data: existing } = await supabase
      .from("anthropometry")
      .select("id")
      .eq("assessment_id", safeAssessmentId)
      .maybeSingle();

    let error;

    if (existing) {
      const response = await supabase
        .from("anthropometry")
        .update(payload)
        .eq("assessment_id", safeAssessmentId);

      error = response.error;
    } else {
      const response = await supabase
        .from("anthropometry")
        .insert([payload]);

      error = response.error;
    }

    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }

    Alert.alert("Sucesso", "Avaliação salva.");
    router.back();
  }

  function calculateAge(birthDate: string) {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  if (loading) {
    return (
      <View style={{ marginTop: 50 }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      {/* CARD DO CLIENTE */}
      {client && (
        <View
          style={{
            backgroundColor: "#000",
            padding: 16,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
            {client.name}
          </Text>
          {client.birth_date && (
            <Text style={{ color: "#fff" }}>
              Idade: {calculateAge(client.birth_date)} anos
            </Text>
          )}
          {client.height_cm && (
            <Text style={{ color: "#fff" }}>
              Altura: {client.height_cm} cm
            </Text>
          )}
        </View>
      )}

      {/* CAMPOS */}
      {Object.keys(form).map((field) => (
        <View key={field} style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 4 }}>{field}</Text>
          <TextInput
            keyboardType="numeric"
            value={form[field]}
            onChangeText={(v) => handleChange(field, v)}
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
              padding: 10,
              backgroundColor: "#fff",
            }}
          />
        </View>
      ))}

      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: "#000",
          padding: 14,
          borderRadius: 8,
          marginTop: 20,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Salvar Avaliação
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
