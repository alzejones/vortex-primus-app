import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function ClientDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const clientId = Array.isArray(id) ? id[0] : id;

  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => {
    if (!clientId) return;

    async function load() {
      const { data } = await supabase
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

      setAssessments(data ?? []);
      setLoading(false);
    }

    load();
  }, [clientId]);

  async function handleNewAssessment() {
    const { data } = await supabase
      .from("physical_assessments")
      .insert([{ client_id: clientId }])
      .select()
      .single();

    router.push({
      pathname: "/(protected)/anthropometry-form",
      params: { assessmentId: data.id },
    });
  }

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity
        onPress={handleNewAssessment}
        style={{ backgroundColor: "#000", padding: 14, borderRadius: 8 }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Nova Avaliação
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 30 }}>
        Histórico
      </Text>

      {assessments.map((item) => {
        const data = item.anthropometry?.[0];

        return (
          <View
            key={item.id}
            style={{
              backgroundColor: "#fff",
              padding: 12,
              marginTop: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {new Date(item.created_at).toLocaleDateString("pt-BR")}
            </Text>

            {data?.weight && <Text>Peso: {data.weight} kg</Text>}
            {data?.body_fat && <Text>Gordura: {data.body_fat}%</Text>}
            {data?.muscle_mass_percentage && (
              <Text>Músculo: {data.muscle_mass_percentage}%</Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}
