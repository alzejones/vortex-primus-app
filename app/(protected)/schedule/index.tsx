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
  appointment_date: string; 
  appointment_time: string; 
  types: string[];          
  status: string;
  whatsapp_sent?: boolean; // 🔴 NOVO: Controle de envio
  clients: {
    name: string;
    phone: string;
  };
}

export default function ScheduleIndex() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugMsg, setDebugMsg] = useState("");

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trainer } = await supabase
        .from("trainers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!trainer) return;

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, client_id, appointment_date, appointment_time, types, status, whatsapp_sent,
          clients (name, phone)
        `)
        .eq("trainer_id", trainer.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) {
        setDebugMsg("❌ Erro no BD: " + error.message);
        setAppointments([]);
      } else {
        setDebugMsg(""); 
        setAppointments(data as unknown as Appointment[]);
      }
    } catch (error: any) {
      setDebugMsg("❌ Erro fatal: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔴 NOVO: Função para traduzir os termos do banco para Português na tela
  const translateType = (type: string) => {
    const lower = type.toLowerCase();
    if (lower === "composition") return "Composição Corporal";
    if (lower === "conditioning") return "Condicionamento";
    return type; // Se for outro nome, mostra o original
  };

  const sendWhatsAppConfirmation = async (appt: Appointment) => {
    const phone = appt.clients?.phone;
    const name = appt.clients?.name?.split(" ")[0] || "Aluno";
    
    if (!phone) {
      Alert.alert("Sem contato", "Este aluno não tem um número de WhatsApp registrado.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    
    const dataSegura = appt.appointment_date || "2026-01-01";
    const [year, month, day] = dataSegura.split("-");
    const formattedDate = `${day}/${month}`;
    const formattedTime = appt.appointment_time ? appt.appointment_time.substring(0, 5) : "";

    // Verifica se é avaliação corporal
    const isCorporal = appt.types && appt.types.some(t => t.toLowerCase() === "composition" || t.toLowerCase() === "corporal");

    let message = "";
    if (isCorporal) {
      // 🔴 NOVO: Mensagem atualizada com as regras de jejum
      message = `Olá, *${name}*! 🚀\nPassando para confirmar a nossa *Avaliação de Composição Corporal*!\n\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n\n⚠️ *Importante:*\n• 2 horas em jejum de comida (inclusive água).\n• 2 horas sem atividade física.\n\nPor favor, responda com um 👍 para confirmar a sua presença. Até lá! 💪`;
    } else {
      message = `Olá, *${name}*! 🚀\nPassando para confirmar o nosso *Teste de Condicionamento*!\n\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n\n💡 *Dicas para o seu teste:*\n• Traga o seu melhor calçado esportivo.\n• Venha bem hidratado(a) e com muita energia!\n\nPor favor, responda com um 👍 para confirmar a sua presença. Até lá! 💪`;
    }

    const url = `whatsapp://send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Erro", "O WhatsApp não está instalado neste dispositivo.");
      } else {
        // 🔴 NOVO: Marca como enviado no banco de dados e atualiza a tela instantaneamente
        await supabase
          .from("appointments")
          .update({ whatsapp_sent: true })
          .eq("id", appt.id);
          
        setAppointments((prev) => 
          prev.map((a) => (a.id === appt.id ? { ...a, whatsapp_sent: true } : a))
        );

        await Linking.openURL(url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderItem = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.clients?.name || "Aluno Excluído"}</Text>
        <View style={styles.badge}>
          {/* 🔴 NOVO: Traduz os arrays para português antes de exibir */}
          <Text style={styles.badgeText}>
            {item.types ? item.types.map(translateType).join(", ") : "Avaliação"}
          </Text>
        </View>
      </View>
      
      <View style={styles.dateTimeRow}>
        <Text style={styles.dateTimeText}>📅 {item.appointment_date ? sqlToDate(item.appointment_date) : ""}</Text>
        <Text style={styles.dateTimeText}>⏰ {item.appointment_time ? item.appointment_time.substring(0, 5) : ""}</Text>
      </View>

      {/* 🔴 NOVO: Muda o estilo do botão se já foi enviado */}
      <TouchableOpacity 
        style={[styles.whatsappButton, item.whatsapp_sent && styles.whatsappButtonSent]} 
        onPress={() => sendWhatsAppConfirmation(item)}
      >
        <Text style={[styles.whatsappButtonText, item.whatsapp_sent && styles.whatsappButtonTextSent]}>
          {item.whatsapp_sent ? "✅ Confirmação Enviada" : "💬 Confirmar via WhatsApp"}
        </Text>
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

      {debugMsg !== "" && (
        <Text style={styles.errorText}>{debugMsg}</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 50 }} />
      ) : appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Nenhum agendamento encontrado.</Text>
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

const sqlToDate = (sqlStr: string) => {
  if (!sqlStr) return "";
  const [year, month, day] = sqlStr.split("-");
  return `${day}/${month}/${year}`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: Platform.OS === "ios" ? 50 : 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },
  addButton: { backgroundColor: "#10b981", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  
  errorText: { color: "#ef4444", fontWeight: "bold", textAlign: "center", marginHorizontal: 20, marginTop: 10, backgroundColor: "#fee2e2", padding: 10, borderRadius: 8 },

  listContent: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  clientName: { fontSize: 18, fontWeight: "bold", color: "#111827", flex: 1 },
  
  badge: { backgroundColor: "#f8fafc", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: "#cbd5e1", flexShrink: 1, marginLeft: 10 },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#334155", textAlign: "right" },
  
  dateTimeRow: { flexDirection: "row", marginBottom: 16 },
  dateTimeText: { fontSize: 14, color: "#6b7280", fontWeight: "500", marginRight: 16 },
  
  whatsappButton: { backgroundColor: "#22c55e", padding: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", borderWidth: 1, borderColor: "#22c55e" },
  whatsappButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  
  // 🔴 NOVO: Estilos para quando a mensagem já foi enviada
  whatsappButtonSent: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  whatsappButtonTextSent: { color: "#15803d" },
  
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyStateText: { color: "#6b7280", fontSize: 16 },
});
