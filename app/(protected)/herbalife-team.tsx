import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../lib/supabase";

interface DownlineStats {
  downline_trainer_id: string;
  downline_name: string;
  downline_email: string;
  agendamentos_count: number;
  avaliacoes_realizadas_count: number;
}

export default function HerbalifeTeam() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downlines, setDownlines] = useState<DownlineStats[]>([]);

  useEffect(() => {
    loadDownlines();
  }, []);

  async function loadDownlines() {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_downline_stats');

      if (error) throw error;

      setDownlines(data || []);
    } catch (error) {
      console.error("Erro ao carregar equipe:", error);
      setDownlines([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Minha Equipe Herbalife</Text>
          <Text style={styles.subtitle}>Consultores independentes vinculados a você</Text>
        </View>

        {downlines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>👥</Text>
            <Text style={styles.emptyTitle}>Nenhum consultor vinculado</Text>
            <Text style={styles.emptySubtitle}>Quando consultores se vincularem a você, eles aparecerão aqui.</Text>
          </View>
        ) : (
          <FlatList
            data={downlines}
            keyExtractor={(item) => item.downline_trainer_id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.downline_name ? item.downline_name.substring(0, 2).toUpperCase() : "CO"}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.downline_name || "Sem nome"}</Text>
                    <Text style={styles.cardEmail}>{item.downline_email || "Sem e-mail"}</Text>
                  </View>
                </View>
                
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{item.agendamentos_count}</Text>
                    <Text style={styles.statLabel}>Agendamentos</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{item.avaliacoes_realizadas_count}</Text>
                    <Text style={styles.statLabel}>Avaliações Realizadas</Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  scrollContent: { padding: 24, paddingBottom: 60, paddingTop: Platform.OS === "ios" ? 60 : 40 },
  
  header: { marginBottom: 24 },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: "#4f46e5", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 32, fontWeight: "900", color: "#0f172a", marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#64748b", lineHeight: 22 },

  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyText: { fontSize: 64, marginBottom: 16, opacity: 0.3 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: "#64748b", textAlign: "center", paddingHorizontal: 32, lineHeight: 22 },

  card: { backgroundColor: "#fff", padding: 24, borderRadius: 24, borderWidth: 1, borderColor: "#e2e8f0", shadowColor: "#64748b", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, marginBottom: 16 },
  
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#e0e7ff", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  avatarText: { fontSize: 18, fontWeight: "900", color: "#4f46e5", letterSpacing: 0.5 },
  cardInfo: { flex: 1, marginLeft: 16 },
  cardName: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  cardEmail: { fontSize: 14, color: "#64748b" },

  statsRow: { flexDirection: "row", backgroundColor: "#f8fafc", borderRadius: 16, padding: 16 },
  statBox: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 28, fontWeight: "900", color: "#4f46e5", marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: "700", color: "#64748b", textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: "#cbd5e1", marginHorizontal: 16 },
});
