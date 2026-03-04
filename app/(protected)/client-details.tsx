import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

type Client = {
  id: string;
  name: string;
  birth_date: string;
  height_cm: number;
};

type Assessment = {
  id: string;
  created_at: string;
  anthropometry: {
    weight: number | null;
    body_fat: number | null;
    muscle_mass_percentage: number | null;
  }[] | null;
};

export default function ClientDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const clientId = id as string;

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
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (!error && data) {
      setClient(data);
    }
  }, [clientId]);

  const loadAssessments = useCallback(async () => {
    const { data, error } = await supabase
      .from("physical_assessments")
      .select(`
        id,
        created_at,
        anthropometry (
          weight,
          body_fat,
          muscle_mass_percentage
        )
      `)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAssessments(data as Assessment[]);
    }
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

  const handleNewAssessment = async () => {
    const { data, error } = await supabase
      .from("physical_assessments")
      .insert([
        {
          client_id: clientId,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      Alert.alert("Erro ao criar avaliação");
      return;
    }

    router.push(
      `/(protected)/anthropometry-form?assessment_id=${data.id}`
    );
  };

  if (loading || !client) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      {/* CARD CLIENTE */}
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

      {/* BOTÃO NOVA AVALIAÇÃO */}
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
          Nova Avaliação
        </Text>
      </TouchableOpacity>

      {/* HISTÓRICO */}
      <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
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
              {new Date(assessment.created_at).toLocaleDateString("pt-BR")}
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
