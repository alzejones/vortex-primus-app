import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useTrainer } from "../../hooks/useTrainer";
import { supabase } from "../../lib/supabase";

export default function AssessmentCreate() {
  const { trainerId, loadingTrainer } = useTrainer();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      if (!trainerId) return;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("trainer_id", trainerId)
        .eq("is_active", true);

      if (!error) setClients(data || []);
      setLoading(false);
    }

    fetchClients();
  }, [trainerId]);

  async function handleCreateAssessment(clientId: string) {
    const { data, error } = await supabase
      .from("physical_assessments")
      .insert([
        {
          client_id: clientId,
          trainer_id: trainerId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    router.push({
      pathname: "/(protected)/anthropometry-form",
      params: { assessmentId: data.id },
    });
  }

  if (loadingTrainer || loading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex:1, padding:20 }}>
      <Text style={{ fontSize:22, fontWeight:"bold", marginBottom:20 }}>
        Nova Avaliação
      </Text>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleCreateAssessment(item.id)}
            style={{
              padding:15,
              borderWidth:1,
              borderColor:"#ddd",
              borderRadius:8,
              marginBottom:10
            }}
          >
            <Text style={{ fontWeight:"bold" }}>{item.name}</Text>
            <Text>{item.email || "Sem email"}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}