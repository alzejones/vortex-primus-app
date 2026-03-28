import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

interface Appointment {
  id: string;
  client_id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  clients: {
    name: string;
    phone: string;
  };
}

export default function ScheduleIndex() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugMsg, setDebugMsg] = useState(""); // 🔴 Detetor de erros

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      setLoading(true);
      setDebugMsg("Procurando sessão...");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDebugMsg("Usuário não logado.");
        return;
      }

      setDebugMsg("Buscando treinador...");
      const { data: trainer } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!trainer) {
        setDebugMsg("Treinador não encontrado.");
        return;
      }

      setDebugMsg("Buscando agendamentos...");
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, client_id, date, time, type, status,
          clients (name, phone)
        `)
        .eq("trainer_id", trainer.id)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) {
        setDebugMsg("❌ Erro no BD: " + error.message);
        setAppointments([]);
      } else {
        setDebugMsg(""); // Limpa o erro se deu certo
        setAppointments(data as unknown as Appointment[]);
      }
    } catch (error: any) {
      setDebugMsg("❌ Erro fatal: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const sendWhatsAppConfirmation = (appt: Appointment) => {
    const phone = appt.clients?.phone;
    const name = appt.clients?.name?.split(" ")[0] || "Aluno";
    
    if (!phone) {
      Alert.alert("Sem contacto", "Este aluno não tem um número de telemóvel registado.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const [year, month, day] = appt.date.split("-");
    const formattedDate = `${day}/${month}`;
    const formattedTime = appt.time.substring(0, 5);

    let message = "";
    if (appt.type === "Corporal" || appt.type === "Composição Corporal") {
      message = `Olá, *${name}*! 🚀\nPassando para confirmar a nossa *Avaliação de Composição Corporal*!\n\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n\n💡 *Dicas para o seu teste:*\n• Evite comer ou beber em excesso 2h antes.\n• Venha com roupas leves (calções/top) para facilitar as medidas.\n\nPor favor, responda com um 👍 para confirmar a sua presença. Até lá! 💪`;
    } else {
      message = `Olá, *${name}*! 🚀\nPassando para confirmar o nosso *Teste de Condicionamento*!\n\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n\n💡 *Dicas para o seu teste:*\n• Traga o seu melhor calçado desportivo.\n• Venha bem hidratado(a) e com muita energia!\n\nPor favor, responda com um 👍 para confirmar a sua presença. Até lá! 💪`;
    }

    const url = `whatsapp://send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (!supported) Alert.alert("Erro", "O WhatsApp não está instalado.");
      else return Linking.openURL(url);
    }).catch((err) => console.error(err));
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.clients?.name || "Aluno Excluído"}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.type}</Text>
        </View>
      </View>
      
      <View style={styles.dateTimeRow}>
        <Text style={styles.dateTimeText}>📅 {item.date}</Text>
        <Text style={styles.dateTimeText}>⏰ {item.time.substring(0, 5)}</Text>
      </View>

      <TouchableOpacity style={styles.whatsappButton} onPress={() => sendWhatsAppConfirmation(item)}>
        <Text style={styles.whatsappButtonText}>💬 Enviar Confirmação</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert("Em breve", "Novo Agendamento")}>
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* 🔴 MARCADOR DE VERSÃO E DETETOR DE ERRO */}
      <Text style={styles.versionMarker}>[ VERSÃO SMART WHATSAPP ]</Text>
      {debugMsg !== "" && (
        <Text style={styles.errorText}>{debugMsg}</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 50 }} />
      ) : appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Nenhum agendamento encontrado na tabela.</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: Platform.OS === "ios" ? 50 : 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },
  addButton: { backgroundColor: "#10b981", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  
  versionMarker: { color: "#2563eb", fontWeight: "900", textAlign: "center", marginTop: 10, fontSize: 12 },
  errorText: { color: "#ef4444", fontWeight: "bold", textAlign: "center", marginHorizontal: 20, marginTop: 10, backgroundColor: "#fee2e2", padding: 10, borderRadius: 8 },

  listContent: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  clientName: { fontSize: 18, fontWeight: "bold", color: "#111827", flex: 1 },
  badge: { backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#cbd5e1" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  dateTimeRow: { flexDirection: "row", marginBottom: 16 },
  dateTimeText: { fontSize: 14, color: "#6b7280", fontWeight: "500", marginRight: 16 },
  whatsappButton: { backgroundColor: "#22c55e", padding: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center" },
  whatsappButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyStateText: { color: "#6b7280", fontSize: 16 },
});
