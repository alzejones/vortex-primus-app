import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ClientDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();

  const clientId = id as string;

  const [client, setClient] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      .order("date", { ascending: false });

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

  async function handleNewAssessment() {
    if (!trainerId) {
      Alert.alert("Erro", "Treinador não identificado.");
      return;
    }

    const { data, error } = await supabase
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

    if (error || !data) {
      Alert.alert("Erro ao criar avaliação", error?.message);
      return;
    }

    router.push(
      `/(protected)/anthropometry-form?assessment_id=${data.id}&client_id=${clientId}`
    );
  }

  if (loading || !client) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          padding: 16,
          borderWidth: 1,
          borderColor: "#ddd",
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>
          {client.name}
        </Text>
        <Text>Idade: {calculateAge(client.birth_date)} anos</Text>
        <Text>Altura: {client.height_cm} cm</Text>
      </View>

      <TouchableOpacity
        onPress={handleNewAssessment}
        style={{
          backgroundColor: "#000",
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Incluir Avaliação
        </Text>
      </TouchableOpacity>

      <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
        Histórico de Avaliações
      </Text>

      {assessments.length === 0 && (
        <Text style={{ color: "#999" }}>
          Nenhuma avaliação registrada.
        </Text>
      )}

      {assessments.map((assessment) => {
        const anthro = assessment.anthropometry?.[0];

        return (
          <View
            key={assessment.id}
            style={{
              marginBottom: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 8,
            }}
          >
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
                  % Massa Muscular: {anthro.muscle_mass_percentage ?? "-"}
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
  );
}
