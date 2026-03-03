import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity } from "react-native";
import { supabase } from "../../lib/supabase";

export default function AnthropometryForm() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams();

  const safeAssessmentId = Array.isArray(assessmentId)
    ? assessmentId[0]
    : assessmentId;

  const [form, setForm] = useState({
    weight: "",
    body_fat: "",
    muscle_mass_percentage: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!safeAssessmentId) return;

    const { error } = await supabase.from("anthropometry").insert([
      {
        assessment_id: safeAssessmentId,
        weight: Number(form.weight),
        body_fat: Number(form.body_fat),
        muscle_mass_percentage: Number(form.muscle_mass_percentage),
      },
    ]);

    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }

    // Buscar client_id
    const { data } = await supabase
      .from("physical_assessments")
      .select("client_id")
      .eq("id", safeAssessmentId)
      .single();

    const clientId = data?.client_id;

    Alert.alert("Sucesso", "Avaliação salva com sucesso.", [
      {
        text: "OK",
        onPress: () =>
          router.replace(`/(protected)/client-details?id=${clientId}`),
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
        Antropometria
      </Text>

      <TextInput
        placeholder="Peso (kg)"
        keyboardType="numeric"
        value={form.weight}
        onChangeText={(v) => handleChange("weight", v)}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="% Gordura"
        keyboardType="numeric"
        value={form.body_fat}
        onChangeText={(v) => handleChange("body_fat", v)}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="% Músculo"
        keyboardType="numeric"
        value={form.muscle_mass_percentage}
        onChangeText={(v) => handleChange("muscle_mass_percentage", v)}
        style={{ borderWidth: 1, padding: 12, marginBottom: 12 }}
      />

      <TouchableOpacity
        onPress={handleSave}
        style={{ backgroundColor: "#000", padding: 14, borderRadius: 8 }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Salvar Avaliação
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
