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
  const [clientName, setClientName] = useState("");
  
  // Controle de qual avaliação estamos visualizando no topo
  const [selectedIndex, setSelectedIndex] = useState(0); 

  useEffect(() => {
    async function fetchEvolution() {
      if (!client_id) return;
      try {
        setLoading(true);

        const { data: clientData } = await supabase.from("clients").select("name").eq("id", client_id).single();
        if (clientData) setClientName(clientData.name);

        const { data, error } = await supabase
          .from("physical_assessments")
          .select(`
            id, date,
            conditioning:conditioning_tests (
              id,
              strength:strength_tests(exercise_name, load_kg, repetitions),
              endurance:endurance_tests(test_type, distance_m, time_seconds, repetitions),
              mobility:mobility_tests(test_name, notes)
            )
          `)
          .eq("client_id", client_id)
          .order("date", { ascending: false }); 

        if (error) throw error;
        
        // Filtra apenas avaliações que têm testes físicos gravados
        const filteredData = (data || []).filter(a => a.conditioning && a.conditioning.length > 0);
        setHistory(filteredData);
      } catch (err) {
        console.log("Erro ao buscar evolução:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvolution();
  }, [client_id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const calcDays = (d1: string, d2: string) => {
    const diffTime = Math.abs(new Date(d1).getTime() - new Date(d2).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDiff = (curr: any, prev: any) => {
    if (curr === null || curr === undefined) return "-";
    if (prev === null || prev === undefined) return curr; // Se não tinha antes, a "evolução" é o valor atual
    const diff = Number(curr) - Number(prev);
    return diff > 0 ? `+${diff}` : diff;
  };

  // ==========================================================
  // COMPONENTE DE TABELA COMPARATIVA
  // ==========================================================
  const renderComparisonCard = (currentAss: any, previousAss: any, title: string, subtitle: string) => {
    if (!currentAss) return null;

    const condCurr = currentAss.conditioning[0];
    const condPrev = previousAss ? previousAss.conditioning[0] : null;

    const dateCurr = formatDate(currentAss.date);
    const datePrev = previousAss ? formatDate(previousAss.date) : "--/--/--";
    const daysDiff = previousAss ? calcDays(currentAss.date, previousAss.date) : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>

        {/* --- 1. TABELA DE FORÇA --- */}
        {condCurr.strength && condCurr.strength.length > 0 && (
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>💪 Força</Text>
            
            {/* Cabeçalho da Tabela */}
            <View style={styles.tableRowHeader}>
              <View style={[styles.colName, { borderRightWidth: 1, borderColor: '#e2e8f0' }]}><Text style={styles.colHeaderText}>Exercício</Text></View>
              <View style={styles.colData}>
                <Text style={styles.colDateText}>Atual</Text>
                <Text style={styles.colDateSub}>{dateCurr}</Text>
                <View style={styles.metricsHeader}><Text style={styles.metricsTitle}>Carga</Text><Text style={styles.metricsTitle}>Reps</Text></View>
              </View>
              <View style={styles.colData}>
                <Text style={styles.colDateText}>Anterior</Text>
                <Text style={styles.colDateSub}>{datePrev}</Text>
                <View style={styles.metricsHeader}><Text style={styles.metricsTitle}>Carga</Text><Text style={styles.metricsTitle}>Reps</Text></View>
              </View>
              <View style={styles.colData}>
                <Text style={[styles.colDateText, { color: '#16a34a' }]}>Evolução</Text>
                <Text style={styles.colDateSub}>{daysDiff} dias</Text>
                <View style={styles.metricsHeader}><Text style={styles.metricsTitle}>Carga</Text><Text style={styles.metricsTitle}>Reps</Text></View>
              </View>
            </View>

            {/* Linhas da Tabela */}
            {condCurr.strength.map((item: any, i: number) => {
              const prevItem = condPrev?.strength?.find((p: any) => p.exercise_name === item.exercise_name);
              return (
                <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.rowEven]}>
                  <View style={[styles.colName, { borderRightWidth: 1, borderColor: '#e2e8f0' }]}><Text style={styles.exerciseName}>{item.exercise_name}</Text></View>
                  <View style={styles.colData}><View style={styles.metricsHeader}><Text style={styles.valueText}>{item.load_kg || '-'}</Text><Text style={styles.valueText}>{item.repetitions || '-'}</Text></View></View>
                  <View style={styles.colData}><View style={styles.metricsHeader}><Text style={styles.valueText}>{prevItem?.load_kg || '-'}</Text><Text style={styles.valueText}>{prevItem?.repetitions || '-'}</Text></View></View>
                  <View style={styles.colData}><View style={styles.metricsHeader}><Text style={styles.diffText}>{getDiff(item.load_kg, prevItem?.load_kg)}</Text><Text style={styles.diffText}>{getDiff(item.repetitions, prevItem?.repetitions)}</Text></View></View>
                </View>
              );
            })}
          </View>
        )}

        {/* --- 2. TABELA DE RESISTÊNCIA --- */}
        {condCurr.endurance && condCurr.endurance.length > 0 && (
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>🏃 Resistência Cárdio</Text>
            <View style={styles.tableRowHeader}>
              <View style={[styles.colName, { borderRightWidth: 1, borderColor: '#e2e8f0' }]}><Text style={styles.colHeaderText}>Exercício</Text></View>
              <View style={styles.colData}><Text style={styles.colDateText}>Atual</Text><Text style={styles.colDateSub}>{dateCurr}</Text><View style={styles.metricsHeader}><Text style={styles.metricsTitle}>Dist/Reps</Text><Text style={styles.metricsTitle}>Tempo</Text></View></View>
              <View style={styles.colData}><Text style={styles.colDateText}>Anterior</Text><Text style={styles.colDateSub}>{datePrev}</Text><View style={styles.metricsHeader}><Text style={styles.metricsTitle}>Dist/Reps</Text><Text style={styles.metricsTitle}>Tempo</Text></View></View>
              <View style={styles.colData}><Text style={[styles.colDateText, { color: '#16a34a' }]}>Evolução</Text><Text style={styles.colDateSub}>{daysDiff} dias</Text><View style={styles.metricsHeader}><Text style={styles.metricsTitle}>Dist/Reps</Text><Text style={styles.metricsTitle}>Tempo</Text></View></View>
            </View>

            {condCurr.endurance.map((item: any, i: number) => {
              const prevItem = condPrev?.endurance?.find((p: any) => p.test_type === item.test_type);
              const isRun = item.test_type === "Corrida";
              
              const currVal1 = isRun ? item.distance_m : item.repetitions;
              const prevVal1 = isRun ? prevItem?.distance_m : prevItem?.repetitions;
              const currVal2 = isRun ? item.time_seconds : "-";
              const prevVal2 = isRun ? prevItem?.time_seconds : "-";

              return (
                <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.rowEven]}>
                  <View style={[styles.colName, { borderRightWidth: 1, borderColor: '#e2e8f0' }]}><Text style={styles.exerciseName}>{item.test_type}</Text></View>
                  <View style={styles.colData}><View style={styles.metricsHeader}><Text style={styles.valueText}>{currVal1 || '-'}</Text><Text style={styles.valueText}>{currVal2 || '-'}</Text></View></View>
                  <View style={styles.colData}><View style={styles.metricsHeader}><Text style={styles.valueText}>{prevVal1 || '-'}</Text><Text style={styles.valueText}>{prevVal2 || '-'}</Text></View></View>
                  <View style={styles.colData}><View style={styles.metricsHeader}><Text style={styles.diffText}>{getDiff(currVal1, prevVal1)}</Text><Text style={styles.diffText}>{getDiff(currVal2, prevVal2)}</Text></View></View>
                </View>
              );
            })}
          </View>
        )}

        {/* --- 3. TABELA DE MOBILIDADE --- */}
        {condCurr.mobility && condCurr.mobility.length > 0 && (
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>🧘 Mobilidade</Text>
            <View style={styles.tableRowHeader}>
              <View style={[styles.colName, { flex: 1.5, borderRightWidth: 1, borderColor: '#e2e8f0' }]}><Text style={styles.colHeaderText}>Exercício</Text></View>
              <View style={[styles.colData, { flex: 1.2 }]}><Text style={styles.colDateText}>Atual</Text></View>
              <View style={[styles.colData, { flex: 1.2 }]}><Text style={styles.colDateText}>Anterior</Text></View>
            </View>

            {condCurr.mobility.map((item: any, i: number) => {
              const prevItem = condPrev?.mobility?.find((p: any) => p.test_name === item.test_name);
              return (
                <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.rowEven]}>
                  <View style={[styles.colName, { flex: 1.5, borderRightWidth: 1, borderColor: '#e2e8f0' }]}><Text style={styles.exerciseName}>{item.test_name}</Text></View>
                  <View style={[styles.colData, { flex: 1.2 }]}><Text style={styles.valueText}>{item.notes || '-'}</Text></View>
                  <View style={[styles.colData, { flex: 1.2 }]}><Text style={styles.valueText}>{prevItem?.notes || '-'}</Text></View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };


  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /><Text style={{ marginTop: 12 }}>Analisando performance...</Text></View>;
  }

  if (history.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>🏋️‍♂️</Text>
        <Text style={styles.emptyTitle}>Sem histórico físico</Text>
        <Text style={{ color: "#64748b", marginTop: 8, marginBottom: 24 }}>Este aluno ainda não possui testes físicos.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={{ color: "#fff", fontWeight: "bold" }}>Voltar ao Dashboard</Text></TouchableOpacity>
      </View>
    );
  }

  // Define os alvos de comparação baseados na data selecionada
  const currentAss = history[selectedIndex];
  const previousAss = history.length > selectedIndex + 1 ? history[selectedIndex + 1] : null;
  const initialAss = history.length > 1 ? history[history.length - 1] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f1f5f9", paddingTop: Platform.OS === "android" ? 40 : 0 }}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>← Voltar para {clientName}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Evolução de Performance</Text>
        <Text style={styles.subtitle}>Detalhes e Comparativos da Avaliação Selecionada.</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        
        {/* CARD 1: Atual vs Anterior */}
        {renderComparisonCard(currentAss, previousAss, "Evolução Recente", "Atual vs Anterior")}

        {/* CARD 2: Atual vs Inicial (Só mostra se houver mais de 2 avaliações no total) */}
        {initialAss && previousAss && currentAss.id !== initialAss.id && (
          <View style={{ marginTop: 16 }}>
             {renderComparisonCard(currentAss, initialAss, "Evolução Histórica", "Atual vs Primeira Avaliação")}
          </View>
        )}

        {/* LISTA DE DATAS (HISTÓRICO) */}
        <Text style={styles.listTitle}>📅 Histórico de Avaliações</Text>
        
        {history.map((assessment, index) => (
          <View key={assessment.id} style={[styles.historyItem, selectedIndex === index && styles.historyItemActive]}>
            <View>
              <Text style={[styles.historyDate, selectedIndex === index && { color: '#1e40af' }]}>{formatDate(assessment.date)}</Text>
              {index === 0 && <Text style={styles.historyTag}>Mais Recente</Text>}
              {index === history.length - 1 && history.length > 1 && <Text style={styles.historyTag}>Primeiro Teste</Text>}
            </View>
            <TouchableOpacity 
              style={[styles.detailsBtn, selectedIndex === index && styles.detailsBtnActive]} 
              onPress={() => setSelectedIndex(index)}
            >
              <Text style={[styles.detailsBtnText, selectedIndex === index && { color: '#fff' }]}>
                {selectedIndex === index ? "Em Exibição" : "Ver Detalhes"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc", padding: 20 },
  backBtn: { backgroundColor: "#2563eb", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  title: { fontSize: 26, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: "#64748b", marginTop: 4 },

  card: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 16, overflow: "hidden", borderWidth: 1, borderColor: "#cbd5e1", elevation: 3 },
  cardHeader: { backgroundColor: "#1e293b", padding: 16 },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  cardSubtitle: { color: "#94a3b8", fontSize: 12, marginTop: 2 },

  tableSection: { marginTop: 16, paddingBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#334155", marginLeft: 12, marginBottom: 12 },

  tableRowHeader: { flexDirection: "row", backgroundColor: "#f8fafc", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#e2e8f0", paddingVertical: 8 },
  tableRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowEven: { backgroundColor: "#fafafa" },

  colName: { flex: 1.1, paddingHorizontal: 8, justifyContent: "center" },
  colData: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  
  colHeaderText: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase" },
  colDateText: { fontSize: 11, fontWeight: "800", color: "#0f172a" },
  colDateSub: { fontSize: 10, color: "#94a3b8", marginBottom: 6 },
  
  metricsHeader: { flexDirection: "row", width: "100%", justifyContent: "space-between", paddingHorizontal: 4 },
  metricsTitle: { fontSize: 9, color: "#94a3b8", fontWeight: "700", width: "45%", textAlign: "center" },

  exerciseName: { fontSize: 12, fontWeight: "700", color: "#1e293b" },
  valueText: { fontSize: 13, fontWeight: "600", color: "#334155", width: "45%", textAlign: "center" },
  diffText: { fontSize: 13, fontWeight: "800", color: "#16a34a", width: "45%", textAlign: "center" },

  listTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginTop: 24, marginBottom: 12, marginLeft: 4 },
  historyItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  historyItemActive: { borderColor: "#3b82f6", backgroundColor: "#eff6ff" },
  historyDate: { fontSize: 16, fontWeight: "800", color: "#334155" },
  historyTag: { fontSize: 10, color: "#64748b", fontWeight: "600", marginTop: 2 },
  
  detailsBtn: { backgroundColor: "#f1f5f9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  detailsBtnActive: { backgroundColor: "#2563eb" },
  detailsBtnText: { fontSize: 12, fontWeight: "700", color: "#475569" },
});

