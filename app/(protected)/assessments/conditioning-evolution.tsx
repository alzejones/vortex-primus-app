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
              strength:strength_tests (exercise_name, load_kg, repetitions)
            )
          `)
          .eq("client_id", client_id)
          .order("date", { ascending: false });

        if (error) throw error;

        // Filtra apenas avaliações que tenham o bloco de condicionamento
        const filteredData = (data as any[] || []).filter(a => a.conditioning && a.conditioning.length > 0);
        setHistory(filteredData);
      } catch (err: any) {
        console.log("Erro:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvolution();
  }, [client_id]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const calcDays = (d1: string, d2: string) => Math.ceil(Math.abs(new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 60 * 60 * 24));
  
  const getDiff = (curr: any, prev: any) => {
    if (curr === null || curr === undefined || curr === "") return "-";
    if (prev === null || prev === undefined || prev === "") return curr;
    const diff = Number(curr) - Number(prev);
    if (isNaN(diff)) return "-"; // Caso seja texto, como "Max" ou "Falha"
    return diff > 0 ? `+${diff}` : diff;
  };

  const getDiffColor = (val: string | number) => {
    if (val === "-") return "#94a3b8";
    if (String(val).startsWith("+")) return "#16a34a"; // Verde para ganho
    if (String(val).startsWith("-")) return "#dc2626"; // Vermelho para perda
    return "#334155";
  };

  // ==========================================================
  // RENDERIZAÇÃO DA TABELA DE FORÇA (EXATAMENTE COMO SOLICITADO)
  // ==========================================================
  const renderStrengthCard = () => {
    if (history.length === 0) return null;

    const currentAss = history[selectedIndex];
    const previousAss = history.length > selectedIndex + 1 ? history[selectedIndex + 1] : null;
    const initialAss = history.length > 1 ? history[history.length - 1] : null;

    if (!currentAss || !currentAss.conditioning || currentAss.conditioning.length === 0) return null;

    const condCurr = currentAss.conditioning[0];
    const condPrev = previousAss ? previousAss.conditioning[0] : null;
    const condInit = initialAss ? initialAss.conditioning[0] : null;

    const dateCurr = formatDate(currentAss.date);
    const datePrev = previousAss ? formatDate(previousAss.date) : "--/--/--";
    
    const daysPrev = previousAss ? calcDays(currentAss.date, previousAss.date) : 0;
    const daysInit = initialAss ? calcDays(currentAss.date, initialAss.date) : 0;

    if (!condCurr.strength || condCurr.strength.length === 0) {
      return <Text style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Nenhum teste de força registrado nesta data.</Text>;
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Teste de Força</Text>
        </View>

        {/* Scroll Horizontal para não espremer os dados no celular */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            
            {/* LINHA DE CABEÇALHOS (AS 3 COLUNAS PRINCIPAIS) */}
            <View style={styles.headerRow}>
              {/* COLUNA 1: ATUAL */}
              <View style={[styles.headerCell, { width: 180 }]}>
                <Text style={styles.headerLabel}>Data da Última</Text>
                <Text style={styles.headerDate}>{dateCurr}</Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1.5, textAlign: 'left' }]}>Exercício</Text>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Carga</Text>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Reps</Text>
                </View>
              </View>

              {/* COLUNA 2: ANTERIOR */}
              <View style={[styles.headerCell, { width: 100, backgroundColor: '#f8fafc' }]}>
                <Text style={styles.headerLabel}>Avaliação Anterior</Text>
                <Text style={styles.headerDate}>{datePrev}</Text>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Carga</Text>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Reps</Text>
                </View>
              </View>

              {/* COLUNA 3: EVOLUÇÃO (DIVIDIDA EM 2) */}
              <View style={[styles.headerCell, { width: 180 }]}>
                <Text style={styles.headerLabel}>Evolução no Período</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={styles.headerDate}>{daysPrev} Dias</Text>
                  <Text style={styles.headerDate}>{daysInit} Dias</Text>
                </View>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1, color: '#2563eb' }]}>x Anterior</Text>
                  <Text style={[styles.subHeaderText, { flex: 1, color: '#2563eb' }]}>x Total</Text>
                </View>
                <View style={styles.subHeaderArea}>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Cg | Rp</Text>
                  <Text style={[styles.subHeaderText, { flex: 1 }]}>Cg | Rp</Text>
                </View>
              </View>
            </View>

            {/* LINHAS DE DADOS (OS EXERCÍCIOS) */}
            {condCurr.strength.map((item: any, i: number) => {
              // Busca os dados deste mesmo exercício nas avaliações antigas
              const prevItem = condPrev?.strength?.find((p: any) => p.exercise_name === item.exercise_name);
              const initItem = condInit?.strength?.find((p: any) => p.exercise_name === item.exercise_name);

              // Cálculos vs Anterior
              const diffLoadPrev = getDiff(item.load_kg, prevItem?.load_kg);
              const diffRepsPrev = getDiff(item.repetitions, prevItem?.repetitions);

              // Cálculos vs Inicial (Total)
              const diffLoadInit = getDiff(item.load_kg, initItem?.load_kg);
              const diffRepsInit = getDiff(item.repetitions, initItem?.repetitions);

              return (
                <View key={i} style={[styles.dataRow, i % 2 === 0 && styles.rowEven]}>
                  
                  {/* DADOS COLUNA 1 */}
                  <View style={[styles.dataCell, { width: 180, flexDirection: 'row' }]}>
                    <Text style={[styles.exerciseText, { flex: 1.5 }]} numberOfLines={1}>{item.exercise_name}</Text>
                    <Text style={[styles.valueText, { flex: 1 }]}>{item.load_kg || '-'}</Text>
                    <Text style={[styles.valueText, { flex: 1 }]}>{item.repetitions || '-'}</Text>
                  </View>

                  {/* DADOS COLUNA 2 */}
                  <View style={[styles.dataCell, { width: 100, flexDirection: 'row', backgroundColor: '#f8fafc' }]}>
                    <Text style={[styles.valueText, { flex: 1, color: '#64748b' }]}>{prevItem?.load_kg || '-'}</Text>
                    <Text style={[styles.valueText, { flex: 1, color: '#64748b' }]}>{prevItem?.repetitions || '-'}</Text>
                  </View>

                  {/* DADOS COLUNA 3 */}
                  <View style={[styles.dataCell, { width: 180, flexDirection: 'row' }]}>
                    {/* Diff vs Anterior */}
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                      <Text style={[styles.diffText, { color: getDiffColor(diffLoadPrev) }]}>{diffLoadPrev}</Text>
                      <Text style={styles.divider}>|</Text>
                      <Text style={[styles.diffText, { color: getDiffColor(diffRepsPrev) }]}>{diffRepsPrev}</Text>
                    </View>
                    {/* Diff vs Total */}
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                      <Text style={[styles.diffText, { color: getDiffColor(diffLoadInit) }]}>{diffLoadInit}</Text>
                      <Text style={styles.divider}>|</Text>
                      <Text style={[styles.diffText, { color: getDiffColor(diffRepsInit) }]}>{diffRepsInit}</Text>
                    </View>
                  </View>

                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  if (history.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Nenhum teste encontrado</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={{ color: "#fff" }}>Voltar</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f1f5f9", paddingTop: Platform.OS === "android" ? 40 : 0 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>← Voltar para {clientName}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Condicionamento Físico</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        
        {/* A TABELA DE FORÇA SOLICITADA */}
        {renderStrengthCard()}

        {/* LISTA DE DATAS (HISTÓRICO) PARA TROCAR A "ATUAL" */}
        <Text style={styles.listTitle}>📅 Histórico de Avaliações</Text>
        
        {history.map((assessment, index) => (
          <View key={assessment.id} style={[styles.historyItem, selectedIndex === index && styles.historyItemActive]}>
            <View>
              <Text style={[styles.historyDate, selectedIndex === index && { color: '#1e40af' }]}>{formatDate(assessment.date)}</Text>
              {index === 0 && <Text style={styles.historyTag}>Mais Recente</Text>}
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
  backBtn: { backgroundColor: "#2563eb", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  header: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  title: { fontSize: 24, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  
  card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: "#cbd5e1", overflow: "hidden" },
  cardHeader: { backgroundColor: "#1e293b", padding: 12 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800", textTransform: "uppercase" },
  
  tableContainer: {
    flexDirection: 'column',
    minWidth: 460, // Força a largura mínima para habilitar o scroll horizontal e não espremer
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  headerCell: {
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  headerLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 4 },
  headerDate: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  
  subHeaderArea: { flexDirection: 'row', marginTop: 8, justifyContent: 'space-between' },
  subHeaderText: { fontSize: 10, fontWeight: "700", color: "#475569", textAlign: 'center' },
  
  dataRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowEven: { backgroundColor: '#fafafa' },
  
  dataCell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    alignItems: 'center',
  },
  
  exerciseText: { fontSize: 13, fontWeight: "700", color: "#1e293b", textAlign: 'left' },
  valueText: { fontSize: 13, fontWeight: "600", color: "#334155", textAlign: 'center' },
  diffText: { fontSize: 12, fontWeight: "800", textAlign: 'center' },
  divider: { fontSize: 12, color: '#cbd5e1', marginHorizontal: 4 },

  listTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginTop: 10, marginBottom: 12, marginLeft: 4 },
  historyItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: "#e2e8f0" },
  historyItemActive: { borderColor: "#3b82f6", backgroundColor: "#eff6ff" },
  historyDate: { fontSize: 16, fontWeight: "800", color: "#334155" },
  historyTag: { fontSize: 10, color: "#64748b", fontWeight: "600", marginTop: 2 },
  detailsBtn: { backgroundColor: "#f1f5f9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  detailsBtnActive: { backgroundColor: "#2563eb" },
  detailsBtnText: { fontSize: 12, fontWeight: "700", color: "#475569" },
});

