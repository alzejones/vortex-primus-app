import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function AnthropometryForm() {
  const router = useRouter();
  const { assessmentId } = useLocalSearchParams();

  const safeAssessmentId = Array.isArray(assessmentId)
    ? assessmentId[0]
    : assessmentId;

  const [client, setClient] = useState<any>(null);

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
    async function loadClient() {
      if (!safeAssessmentId) return;

      // Buscar assessment
      const { data: assessment } = await supabase
        .from("physical_assessments")
        .select("client_id")
        .eq("id", safeAssessmentId)
        .single();

      if (!assessment) return;

      // Buscar cliente
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", assessment.client_id)
        .single();

      setClient(clientData);
    }

    loadClient();
  }, [safeAssessmentId]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    const { error } = await supabase.from("anthropometry").insert([
      {
        assessment_id: safeAssessmentId,
        ...Object.fromEntries(
          Object.entries(form).map(([k, v]) => [
            k,
            v === "" ? null : Number(v),
          ])
        ),
      },
    ]);

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
            value={(form as any)[field]}
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