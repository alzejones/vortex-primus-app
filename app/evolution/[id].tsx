import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EvolutionPanel from "../../components/EvolutionPanel";
import MeasurementsEvolutionPanel from "../../components/MeasurementsEvolutionPanel";
import { supabase } from "../../lib/supabase";

const formatValue = (val: any) => {
  if (val === null || val === undefined) return "-";
  const num = Number(val);
  return isNaN(num) ? "-" : num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

export default function PublicAssessmentView() {
  const { id } = useLocalSearchParams(); 
  const clientId = id as string;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      loadPublicData();
    }
  }, [clientId]);

  async function loadPublicData() {
    try {
      // 1. Busca os dados do aluno
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("name, gender, birth_date")
        .eq("id", clientId)
        .single();
      
      if (clientError) throw new Error("Erro ao buscar Cliente: " + clientError.message);
      if (!clientData) throw new Error("Aluno não encontrado na base de dados.");
      
      setClient(clientData);

      // 🔴 CORREÇÃO: Instrução exata de qual chave estrangeira usar para evitar a confusão do banco
      const { data: historyData, error: historyError } = await supabase
        .from("physical_assessments")
        .select(`
          id, date,
          anthropometry!anthropometry_assessment_id_fkey (*)
        `)
        .eq("client_id", clientId)
        .order("date", { ascending: false });

      if (historyError) throw new Error("Erro ao buscar Avaliações: " + historyError.message);
      if (!historyData || historyData.length === 0) {
        throw new Error("Nenhuma avaliação encontrada para este aluno.");
      }

      setAssessments(historyData);
      setCurrentAssessment(historyData[0]);

    } catch (error: any) {
      console.error("Erro ao carregar link público:", error);
      setErrorMsg(error.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: '#64748b', fontWeight: '600' }}>A carregar a sua evolução...</Text>
      </View>
    );
  }

  if (!currentAssessment) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>😕</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>Avaliação indisponível</Text>
        <Text style={{ color: '#64748b', marginTop: 8 }}>Este link pode ter expirado ou estar incorreto.</Text>
        
        {errorMsg && (
          <View style={{ marginTop: 24, padding: 16, backgroundColor: '#fee2e2', borderRadius: 8, marginHorizontal: 20 }}>
            <Text style={{ color: '#b91c1c', fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>DETALHE TÉCNICO PARA DEBUG:</Text>
            <Text style={{ color: '#b91c1c', fontSize: 13 }}>{errorMsg}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>VORTEX PRIMUS</Text>
          <Text style={styles.brandSubtitle}>Relatório Oficial de Evolução</Text>
        </View>

        <View style={styles.clientCard}>
          <Text style={styles.clientName}>{client?.name}</Text>
          <Text style={styles.clientInfo}>
            Última Avaliação: {new Date(currentAssessment.date).toLocaleDateString("pt-BR")}
          </Text>
        </View>

        {assessments.length > 1 ? (
          <View>
            <EvolutionPanel 
              evolutionData={{}} 
              currentAssessment={assessments[0]}
              prevAssessment={assessments[1]}
              firstAssessment={assessments[assessments.length - 1]}
              formatValue={formatValue}
            />
            <MeasurementsEvolutionPanel 
              currentAssessment={assessments[0]}
              prevAssessment={assessments[1]}
              firstAssessment={assessments[assessments.length - 1]}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🌱</Text>
            <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 16 }}>Ponto de Partida Registado!</Text>
            <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 8 }}>
              Esta é a sua primeira avaliação. O seu progresso começará a aparecer aqui na próxima reavaliação. Foco no processo!
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Gerado por Vortex Primus App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  brandTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: 2 },
  brandSubtitle: { fontSize: 12, color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  clientCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  clientName: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  clientInfo: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  emptyState: { backgroundColor: '#fff', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', marginTop: 20 },
  footer: { marginTop: 40, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 },
  footerText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' }
});

