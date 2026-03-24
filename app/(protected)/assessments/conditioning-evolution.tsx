import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { supabase } from "../../../lib/supabase";

export default function ConditioningEvolution() {
  const { client_id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"strength" | "endurance" | "mobility">("strength");

  useEffect(() => {
    async function fetchEvolution() {
      if (!client_id) return;
      try {
        setLoading(true);
        // Busca as avaliações com os testes aninhados (em ordem cronológica para ver a evolução)
        const { data, error } = await supabase
          .from("physical_assessments")
          .select(`
            id, date,
            conditioning:conditioning_tests (
              id,
              strength:strength_tests(exercise_name, load_kg, repetitions, rm_estimated),
              endurance:endurance_tests(test_type, distance_m, time_seconds, repetitions, vo2_estimated),
              mobility:mobility_tests(test_name, score, notes)
            )
          `)
          .eq("client_id", client_id)
          .order("date", { ascending: false }); // Do mais recente para o mais antigo

        if (error) throw error;
        
        // Filtra apenas as avaliações que realmente têm testes de condicionamento
        const filteredData = (data || []).filter(a => a.conditioning && a.conditioning.length > 0);
        setHistory(filteredData);
      } catch (err) {
        console.error("Erro ao buscar evolução:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvolution();
  }, [client_id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: "#64748b" }}>Analisando histórico de performance...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40 }}>🏋️‍♂️</Text>
        <Text style={styles.emptyTitle}>Sem histórico ainda</Text>
        <Text style={styles.emptySubtitle}>Este aluno ainda não possui testes de condicionamento registrados.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc", paddingTop: Platform.OS === "android" ? 40 : 0 }}>
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Evolução Física</Text>
        <Text style={styles.subtitle}>Acompanhe os resultados e quebras de PRs.</Text>
      </View>

      {/* ABAS DE NAVEGAÇÃO */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === "strength" && styles.activeTab]} onPress={() => setActiveTab("strength")}>
          <Text style={[styles.tabText, activeTab === "strength" && styles.activeTabText]}>💪 Força</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "endurance" && styles.activeTab]} onPress={() => setActiveTab("endurance")}>
          <Text style={[styles.tabText, activeTab === "endurance" && styles.activeTabText]}>🏃 Cárdio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "mobility" && styles.activeTab]} onPress={() => setActiveTab("mobility")}>
          <Text style={[styles.tabText, activeTab === "mobility" && styles.activeTabText]}>🧘 Mobilidade</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* RENDERIZAÇÃO DA ABA SELECIONADA */}
        {history.map((assessment, index) => {
          const cond = assessment.conditioning[0]; // Pega o teste vinculado a esta avaliação
          if (!cond) return null;

          const hasData = 
            (activeTab === "strength" && cond.strength?.length > 0) ||
            (activeTab === "endurance" && cond.endurance?.length > 0) ||
            (activeTab === "mobility" && cond.mobility?.length > 0);

          if (!hasData) return null;

          return (
            <View key={assessment.id} style={styles.timelineCard}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{formatDate(assessment.date)}</Text>
                {index === 0 && <View style={styles.recentTag}><Text style={styles.recentTagText}>Mais recente</Text></View>}
              </View>

              {/* FORÇA */}
              {activeTab === "strength" && cond.strength?.map((item: any, i: number) => (
                <View key={i} style={styles.resultItem}>
                  <Text style={styles.exerciseName}>{item.exercise_name}</Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricValue}>{item.load_kg || '-'}<Text style={styles.metricUnit}> kg</Text></Text>
                      <Text style={styles.metricLabel}>Carga</Text>
                    </View>
                    <View style={styles.metricBox}>
                      <Text style={styles.metricValue}>{item.repetitions || '-'}<Text style={styles.metricUnit}> reps</Text></Text>
                      <Text style={styles.metricLabel}>Repetições</Text>
                    </View>
                    <View style={[styles.metricBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1 }]}>
                      <Text style={[styles.metricValue, { color: '#1d4ed8' }]}>{item.rm_estimated || '-'}<Text style={styles.metricUnit}> kg</Text></Text>
                      <Text style={[styles.metricLabel, { color: '#2563eb', fontWeight: 'bold' }]}>1RM Est.</Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* RESISTÊNCIA */}
              {activeTab === "endurance" && cond.endurance?.map((item: any, i: number) => (
                <View key={i} style={styles.resultItem}>
                  <Text style={styles.exerciseName}>{item.test_type}</Text>
                  <View style={styles.metricsRow}>
                    {item.test_type === "Corrida" ? (
                      <>
                        <View style={styles.metricBox}>
                          <Text style={styles.metricValue}>{item.distance_m || '-'}<Text style={styles.metricUnit}> m</Text></Text>
                          <Text style={styles.metricLabel}>Distância</Text>
                        </View>
                        <View style={styles.metricBox}>
                          <Text style={styles.metricValue}>{item.time_seconds || '-'}<Text style={styles.metricUnit}> seg</Text></Text>
                          <Text style={styles.metricLabel}>Tempo</Text>
                        </View>
                      </>
                    ) : (
                      <View style={styles.metricBox}>
                        <Text style={styles.metricValue}>{item.repetitions || '-'}<Text style={styles.metricUnit}> reps</Text></Text>
                        <Text style={styles.metricLabel}>Quantidade em 1 min</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {/* MOBILIDADE */}
              {activeTab === "mobility" && cond.mobility?.map((item: any, i: number) => (
                <View key={i} style={styles.resultItem}>
                  <Text style={styles.exerciseName}>{item.test_name}</Text>
                  <View style={styles.mobilityResultBox}>
                    <Text style={styles.mobilityResultText}>{item.notes || 'Não avaliado'}</Text>
                  </View>
                </View>
              ))}

            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 8, marginBottom: 24 },
  backButton: { backgroundColor: "#f1f5f9", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  backButtonText: { color: "#475569", fontWeight: "700" },

  header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },

  tabsContainer: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "#2563eb" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  activeTabText: { color: "#2563eb", fontWeight: "800" },

  scrollContent: { padding: 16, paddingBottom: 40 },
  
  timelineCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#f1f5f9", elevation: 2 },
  dateBadge: { flexDirection: "row", alignItems: "center", marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingBottom: 12 },
  dateText: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  recentTag: { marginLeft: 12, backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  recentTagText: { color: "#16a34a", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },

  resultItem: { marginBottom: 16, backgroundColor: "#f8fafc", padding: 12, borderRadius: 12 },
  exerciseName: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 10 },
  
  metricsRow: { flexDirection: "row", gap: 8 },
  metricBox: { flex: 1, backgroundColor: "#fff", padding: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  metricValue: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  metricUnit: { fontSize: 10, fontWeight: "600", color: "#94a3b8" },
  metricLabel: { fontSize: 10, color: "#64748b", marginTop: 4, textTransform: "uppercase", fontWeight: "600" },

  mobilityResultBox: { backgroundColor: "#fff", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  mobilityResultText: { color: "#0f172a", fontWeight: "600", fontSize: 14 },
});

