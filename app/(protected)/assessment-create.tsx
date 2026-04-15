import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTrainer } from "../../hooks/useTrainer";
import { supabase } from "../../lib/supabase";
import { T } from "../../utils/theme";

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nova Avaliação</Text>
      <Text style={styles.subtitle}>Selecione o aluno para iniciar a avaliação</Text>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleCreateAssessment(item.id)}
            style={styles.card}
            activeOpacity={0.75}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name ? item.name.substring(0, 2).toUpperCase() : "?"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{item.name}</Text>
              <Text style={styles.clientEmail}>{item.email || "Sem e-mail"}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum aluno ativo encontrado.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },

  title: { fontSize: 26, fontWeight: "800", color: T.t1, marginBottom: 4 },
  subtitle: { fontSize: 13, color: T.t3, marginBottom: 20 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: T.card,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: T.blue },
  clientName: { fontWeight: "800", color: T.t1, fontSize: 15 },
  clientEmail: { color: T.t3, fontSize: 12, marginTop: 2 },
  arrow: { fontSize: 24, color: T.t3, fontWeight: "300" },

  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: T.t3, fontSize: 14 },
});
