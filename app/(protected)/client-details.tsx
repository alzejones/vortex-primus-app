import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

export default function ClientDetails() {
  const { id } = useLocalSearchParams();
  const { session } = useAuth();
  const clientId = id as string;

  const [client, setClient] = useState<any>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    async function loadTrainer() {
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (data) setTrainerId(data.id);
    }

    loadTrainer();
  }, [session]);

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();

    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const loadClient = useCallback(async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (data) setClient(data);
  }, [clientId]);

  const loadAssessments = useCallback(async () => {
  const { data } = await supabase
    .from("physical_assessments")
    .select(`
      id,
      date,
      anthropometry (
        weight,
        body_fat,
        muscle_mass_percentage
      )
    `)
    .eq("client_id", clientId)
    .order("date", { ascending: false })
    .order("id", { ascending: false });

  if (data) setAssessments(data);
}, [clientId]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await loadClient();
    await loadAssessments();
    setLoading(false);
  }, [loadClient, loadAssessments]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function calc(current: any, compare: any, field: string) {
    if (!current || !compare) return null;

    const currentValue = Number(current[field] ?? 0);
    const compareValue = Number(compare[field] ?? 0);

    return currentValue - compareValue;
  }

  function getColor(value: number | null, type: "peso" | "gordura" | "musculo") {
    if (value === null) return "#444";

    if (type === "gordura") {
      return value < 0 ? "green" : "red";
    }

    if (type === "musculo") {
      return value > 0 ? "green" : "red";
    }

    if (type === "peso") {
      return value < 0 ? "green" : "red";
    }

    return "#444";
  }

  function getEvolution() {
  if (assessments.length < 2) return null;

  const latestAssessment = assessments[0];
  const previousAssessment = assessments[1];
  const firstAssessment = assessments[assessments.length - 1];

  const latest = latestAssessment?.anthropometry?.[0];
  const previous = previousAssessment?.anthropometry?.[0];
  const first = firstAssessment?.anthropometry?.[0];

  if (!latest || !previous || !first) return null;

  const diffRecentWeight = calc(latest, previous, "weight");
  const diffRecentFat = calc(latest, previous, "body_fat");
  const diffRecentMuscle = calc(latest, previous, "muscle_mass_percentage");

  const diffTotalWeight = calc(latest, first, "weight");
  const diffTotalFat = calc(latest, first, "body_fat");
  const diffTotalMuscle = calc(latest, first, "muscle_mass_percentage");

  return {
    diffRecentWeight,
    diffRecentFat,
    diffRecentMuscle,
    diffTotalWeight,
    diffTotalFat,
    diffTotalMuscle,
  };
}
  async function handleSaveAssessment() {
    if (!trainerId) {
      Alert.alert("Erro", "Treinador não identificado.");
      return;
    }

    setSaving(true);

    const { data: assessment, error: assessmentError } = await supabase
      .from("physical_assessments")
      .insert([
        {
          client_id: clientId,
          trainer_id: trainerId,
          date: new Date().toISOString(),
          assessor_name: session?.user?.email || "Treinador",
        },
      ])
      .select()
      .single();

    if (assessmentError || !assessment) {
      setSaving(false);
      Alert.alert("Erro ao criar avaliação", assessmentError?.message);
      return;
    }

    const payload = {
      assessment_id: assessment.id,
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

    const { error: anthropometryError } = await supabase
      .from("anthropometry")
      .insert(payload);

    setSaving(false);

    if (anthropometryError) {
      Alert.alert("Erro ao salvar dados", anthropometryError.message);
      return;
    }

    Alert.alert("Sucesso", "Avaliação salva.");

    setForm({
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

    await loadAssessments();
  }

  function renderInput(label: string, key: keyof typeof form) {
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={{ marginBottom: 4 }}>{label}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={form[key]}
          onChangeText={(text) => setForm({ ...form, [key]: text })}
        />
      </View>
    );
  }

  const evolution = getEvolution();

  if (loading || !client) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Carregando...</Text>
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
          <View style={styles.card}>
            <Text style={styles.name}>{client.name}</Text>
            <Text>Idade: {calculateAge(client.birth_date)} anos</Text>
            <Text>Altura: {client.height_cm} cm</Text>
          </View>

          {evolution && (
            <View style={styles.evolutionCard}>
              <Text style={styles.sectionTitle}>Evolução</Text>

              <View style={styles.evolutionRow}>
                <View style={styles.evolutionCol}>
                  <Text style={styles.evolutionTitle}>
                    Última vs Anterior
                  </Text>

                  <Text
                    style={{
                      color: getColor(evolution.diffRecentWeight, "peso"),
                    }}
                  >
                    Δ Peso: {evolution.diffRecentWeight?.toFixed(1)} kg
                  </Text>

                  <Text
                    style={{
                      color: getColor(evolution.diffRecentFat, "gordura"),
                    }}
                  >
                    Δ % Gordura: {evolution.diffRecentFat?.toFixed(1)}
                  </Text>

                  <Text
                    style={{
                      color: getColor(evolution.diffRecentMuscle, "musculo"),
                    }}
                  >
                    Δ % Massa Muscular:{" "}
                    {evolution.diffRecentMuscle?.toFixed(1)}
                  </Text>
                </View>

                <View style={styles.evolutionCol}>
                  <Text style={styles.evolutionTitle}>
                    Acumulado no período
                  </Text>

                  <Text
                    style={{
                      color: getColor(evolution.diffTotalWeight, "peso"),
                    }}
                  >
                    Δ Peso: {evolution.diffTotalWeight?.toFixed(1)} kg
                  </Text>

                  <Text
                    style={{
                      color: getColor(evolution.diffTotalFat, "gordura"),
                    }}
                  >
                    Δ % Gordura: {evolution.diffTotalFat?.toFixed(1)}
                  </Text>

                  <Text
                    style={{
                      color: getColor(evolution.diffTotalMuscle, "musculo"),
                    }}
                  >
                    Δ % Massa Muscular:{" "}
                    {evolution.diffTotalMuscle?.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Nova Avaliação</Text>

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
            onPress={handleSaveAssessment}
            disabled={saving}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              {saving ? "Salvando..." : "Salvar Avaliação"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Histórico de Avaliações</Text>

          {assessments.length === 0 && (
            <Text style={{ color: "#999" }}>
              Nenhuma avaliação registrada.
            </Text>
          )}

          {assessments.map((assessment) => {
            const anthro = assessment.anthropometry?.[0];

            return (
              <View key={assessment.id} style={styles.historyCard}>
                <Text style={{ fontWeight: "bold", marginBottom: 6 }}>
                  {assessment.date
                    ? new Date(assessment.date).toLocaleDateString("pt-BR")
                    : "-"}
                </Text>

                {anthro ? (
                  <>
                    <Text>Peso: {anthro.weight ?? "-"} kg</Text>
                    <Text>% Gordura: {anthro.body_fat ?? "-"}</Text>
                    <Text>
                      % Massa Muscular:{" "}
                      {anthro.muscle_mass_percentage ?? "-"}
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: "#999" }}>
                    Sem dados antropométricos
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 20,
  },
  evolutionCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: "#f7f7f7",
  },
  evolutionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  evolutionCol: {
    flex: 1,
  },
  evolutionTitle: {
    fontWeight: "bold",
    marginBottom: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
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
  },
  historyCard: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
});