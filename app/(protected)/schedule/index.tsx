import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { supabase } from "../../../lib/supabase";

export default function ScheduleList() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single();
      if (!trainer) return;

      // Busca todos os agendamentos a partir de hoje
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, appointment_date, appointment_time, types, notes,
          clients (name)
        `)
        .eq('trainer_id', trainer.id)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);

    } catch (err) {
      console.log("Erro ao buscar agenda:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = (id: string, clientName: string) => {
    Alert.alert(
      "Cancelar Agendamento",
      `Tem certeza que deseja cancelar a avaliação de ${clientName}?`,
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Cancelar", 
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('appointments').delete().eq('id', id);
            if (!error) {
              setAppointments(prev => prev.filter(app => app.id !== id));
            } else {
              alert("Erro ao cancelar.");
            }
          }
        }
      ]
    );
  };

  const formatDateBR = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString + 'T00:00:00'); // Força fuso neutro
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Voltar ao Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Minha Agenda</Text>
        <Text style={styles.subtitle}>Próximas avaliações marcadas</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🏖️</Text>
            <Text style={styles.emptyText}>Agenda livre!</Text>
            <Text style={styles.emptySub}>Nenhum agendamento futuro encontrado.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.dateHeader}>
              <Text style={styles.dateText}>{formatDateBR(item.appointment_date)}</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.timeArea}>
                <Text style={styles.timeText}>{item.appointment_time}</Text>
              </View>
              <View style={styles.infoArea}>
                <Text style={styles.clientName}>{item.clients?.name}</Text>
                
                <View style={styles.typesRow}>
                  {item.types && item.types.includes('composition') && <Text style={styles.typeTag}>⚖️ Corporal</Text>}
                  {item.types && item.types.includes('conditioning') && <Text style={styles.typeTag}>🏃 Condicionamento</Text>}
                </View>

                {item.notes ? <Text style={styles.notesText}>Obs: {item.notes}</Text> : null}
              </View>
              
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.clients?.name)}>
                <Text style={styles.deleteEmoji}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? 40 : 20, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  backBtn: { marginBottom: 12 },
  backText: { color: "#2563eb", fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },

  card: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden" },
  dateHeader: { backgroundColor: "#f1f5f9", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  dateText: { fontSize: 13, fontWeight: "700", color: "#475569", textTransform: "capitalize" },
  
  cardBody: { flexDirection: "row", padding: 16, alignItems: "center" },
  timeArea: { backgroundColor: "#eff6ff", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginRight: 16, borderWidth: 1, borderColor: "#bfdbfe" },
  timeText: { fontSize: 16, fontWeight: "800", color: "#1d4ed8" },
  
  infoArea: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: "800", color: "#1e293b", marginBottom: 6 },
  typesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeTag: { fontSize: 11, backgroundColor: "#f8fafc", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#e2e8f0", color: "#475569", fontWeight: "600" },
  notesText: { fontSize: 12, color: "#94a3b8", marginTop: 8, fontStyle: "italic" },

  deleteBtn: { padding: 10, backgroundColor: "#fef2f2", borderRadius: 8, marginLeft: 10, borderWidth: 1, borderColor: "#fecaca" },
  deleteEmoji: { fontSize: 16 },

  emptyBox: { alignItems: "center", justifyContent: "center", marginTop: 50, padding: 30, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed" },
  emptyText: { fontSize: 20, fontWeight: "800", color: "#1e293b" },
  emptySub: { fontSize: 14, color: "#64748b", marginTop: 6, textAlign: "center" }
});

