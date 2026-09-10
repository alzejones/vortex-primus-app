import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import StrengthDotMatrixChart from "../../../components/StrengthDotMatrixChart";
import EnduranceDotMatrixChart from "../../../components/EnduranceDotMatrixChart";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../contexts/ThemeContext";

export default function PublicConditioningView() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const clientId = Array.isArray(id) ? id[0] : id as string;

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
      setHistory(filteredData);
      if (filteredData.length === 0) setErrorMsg("Nenhum teste de condicionamento encontrado.");
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
    const s = styles(theme);

    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!history || history.length === 0) {
    return (
      <View style={s.loadingContainer}>
        <Text style={{ fontSize: 40 }}>😕</Text>
        <Text style={{ fontWeight: 'bold', marginTop: 10, color: theme.colors.textPrimary }}>
          {errorMsg || "Avaliação indisponível"}
        </Text>
      </View>
    );
  }

  const s = styles(theme);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          Platform.OS === 'web' && s.scrollContentWeb
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.brandHeader}>
          <Text style={s.brandTitle}>VORTEX PRIMUS</Text>
          <Text style={s.brandSubtitle}>Condicionamento Físico</Text>
        </View>

        <View style={s.clientCard}>
          <Text style={s.clientName}>{clientName}</Text>
          <Text style={s.clientInfo}>
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

        <View style={{ marginTop: 24, paddingVertical: 14, backgroundColor: theme.colors.background, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ color: '#fbbf24', textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>
            FOCO NO PROCESSO. OS RESULTADOS VIRÃO! 🔥
          </Text>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Gerado por Vortex Primus App</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (theme: import("@/contexts/ThemeContext").AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  scrollContentWeb: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  brandHeader: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  brandTitle: { fontSize: 24, fontWeight: '900', color: theme.colors.textPrimary, letterSpacing: 2 },
  brandSubtitle: { fontSize: 12, color: theme.colors.primary, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  clientCard: { backgroundColor: theme.colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 24, alignItems: 'center' },
  clientName: { fontSize: 18, fontWeight: '900', color: theme.colors.textPrimary },
  clientInfo: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '600' },
});
