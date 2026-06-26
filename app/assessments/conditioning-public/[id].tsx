import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StrengthDotMatrixChart from "../../../components/StrengthDotMatrixChart";
import EnduranceDotMatrixChart from "../../../components/EnduranceDotMatrixChart";
import { supabase } from "../../../lib/supabase";
import { T } from "../../../utils/theme";

export default function PublicConditioningView() {
  const { id } = useLocalSearchParams();
  const clientId = id as string;

  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const body = document.body as HTMLElement;
      const html = document.documentElement as HTMLElement;
      const root = document.getElementById('root') as HTMLElement | null;
      body.style.overflow = 'auto';
      html.style.overflow = 'auto';
      html.style.height = 'auto';
      if (root) { root.style.overflow = 'auto'; root.style.height = 'auto'; }
      return () => {
        body.style.overflow = '';
        html.style.overflow = '';
        html.style.height = '';
        if (root) { root.style.overflow = ''; root.style.height = ''; }
      };
    }
  }, []);

  useEffect(() => {
    if (clientId) loadPublicData();
  }, [clientId]);

  async function loadPublicData() {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();
      
      if (clientError || !clientData) throw new Error("Acesso indisponível.");
      setClientName(clientData.name);

      const { data, error } = await supabase
        .from("physical_assessments")
        .select(`
          id, date,
          conditioning:conditioning_tests (
            id,
            strength:strength_tests (exercise_name, load_kg, repetitions),
            endurance:endurance_tests (test_type, distance_m, time_seconds, repetitions),
            mobility:mobility_tests (test_name, notes)
          )
        `)
        .eq("client_id", clientId)
        .order("date", { ascending: false });

      if (error) throw error;

      const filteredData = (data as any[] || []).filter(a => a.conditioning && a.conditioning.length > 0);
      if (filteredData.length === 0) throw new Error("Nenhum teste de condicionamento encontrado.");
      
      setHistory(filteredData);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  }

  const calcDays = (d1: string, d2: string) => {
    const [y1, m1, d1s] = d1.split('-');
    const [y2, m2, d2s] = d2.split('-');
    const date1 = new Date(Number(y1), Number(m1) - 1, Number(d1s));
    const date2 = new Date(Number(y2), Number(m2) - 1, Number(d2s));
    return Math.ceil(Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={T.blue} />
      </View>
    );
  }

  if (!history || history.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 40 }}>😕</Text>
        <Text style={{ fontWeight: 'bold', marginTop: 10, color: T.t1 }}>
          {errorMsg || "Avaliação indisponível"}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === 'web' && styles.scrollContentWeb
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandHeader}>
          <Text style={styles.brandTitle}>VORTEX PRIMUS</Text>
          <Text style={styles.brandSubtitle}>Condicionamento Físico</Text>
        </View>

        <View style={styles.clientCard}>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.clientInfo}>
            Histórico de Condicionamento Físico
          </Text>
        </View>

        <StrengthDotMatrixChart
          assessments={history}
          periodDays={history.length > 1 ? calcDays(history[0].date, history[1].date) : 0}
        />

        <EnduranceDotMatrixChart
          assessments={history}
          periodDays={history.length > 1 ? calcDays(history[0].date, history[1].date) : 0}
        />

        <View style={{ marginTop: 24, paddingVertical: 14, backgroundColor: T.bgAlt, borderRadius: 12, borderWidth: 1, borderColor: T.border }}>
          <Text style={{ color: '#fbbf24', textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>
            FOCO NO PROCESSO. OS RESULTADOS VIRÃO! 🔥
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Gerado por Vortex Primus App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  scrollContentWeb: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  brandHeader: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  brandTitle: { fontSize: 24, fontWeight: '900', color: T.t1, letterSpacing: 2 },
  brandSubtitle: { fontSize: 12, color: T.blue, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  clientCard: { backgroundColor: T.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: T.border, marginBottom: 24, alignItems: 'center' },
  clientName: { fontSize: 18, fontWeight: '900', color: T.t1 },
  clientInfo: { fontSize: 13, color: T.t3, marginTop: 4 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: T.t3, fontSize: 12, fontWeight: '600' },
});
