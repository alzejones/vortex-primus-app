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

// Interface para tipar os dados que vêm do banco
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

      // Busca os agendamentos e os dados do cliente correspondente
      // Nota: Ajuste o nome da tabela "appointments" se a sua se chamar de forma diferente
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
        // Se a tabela ainda não existir, não quebra a app, apenas mostra vazio
        console.log("Aviso (Agenda):", error.message);
        setAppointments([]);
      } else {
        setAppointments(data as unknown as Appointment[]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // 🔴 A MÁGICA: GERADOR INTELIGENTE DE WHATSAPP
  const sendWhatsAppConfirmation = (appt: Appointment) => {
    const phone = appt.clients?.phone;
    const name = appt.clients?.name?.split(" ")[0] || "Aluno(a)"; // Pega apenas o primeiro nome
    
    if (!phone) {
      Alert.alert("Sem contacto", "Este aluno não tem um número de telemóvel registado.");
      return;
    }

    // Limpa o número para deixar apenas os dígitos
    const cleanPhone = phone.replace(/\D/g, "");
    
    // Formata a data (de YYYY-MM-DD para DD/MM)
    const [year, month, day] = appt.date.split("-");
    const formattedDate = `${day}/${month}`;
    const formattedTime = appt.time.substring(0, 5); // Pega apenas HH:MM

    let message = "";

    // Adapta o texto dependendo do tipo de avaliação
    if (appt.type === "Corporal" || appt.type === "Composição Corporal") {
      message = `Olá, *${name}*! 🚀\nPassando para confirmar a nossa *Avaliação de Composição Corporal*!\n\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n\n💡 *Dicas para o seu teste:*\n• Evite comer ou beber em excesso 2h antes.\n• Venha com roupas leves (calções/top) para facilitar as medidas.\n\nPor favor, responda com um 👍 para confirmar a sua presença, ou avise-me caso precise de reagendar. Até lá! 💪\n\n- Equipa MyBox Irajá`;
    } else {
      // Mensagem para avaliação física / Cross
      message = `Olá, *${name}*! 🚀\nPassando para confirmar o nosso *Teste de Condicionamento (Cross)*!\n\n📅 *Data:* ${formattedDate}\n⏰ *Horário:* ${formattedTime}\n\n💡 *Dicas para o seu teste:*\n• Traga o seu melhor calçado desportivo.\n• Venha bem hidratado(a) e com muita energia!\n\nPor favor, responda com um 👍 para confirmar a sua presença, ou avise-me caso precise de reagendar. Até lá! 💪\n\n- Equipa MyBox Irajá`;
    }

    // Cria o link universal do WhatsApp
    // O 55 no início assume que os números são do Brasil. Ajuste se necessário.
    const url = `whatsapp://send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          Alert.alert("Erro", "O WhatsApp não parece estar instalado neste dispositivo.");
        } else {
          return Linking.openURL(url);
        }
      })
      .catch((err) => console.error("Erro ao abrir WhatsApp", err));
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
        <Text style={styles.dateTimeText}>📅 {sqlToDate(item.date)}</Text>
        <Text style={styles.dateTimeText}>⏰ {item.time.substring(0, 5)}</Text>
      </View>

      <TouchableOpacity 
        style={styles.whatsappButton} 
        onPress={() => sendWhatsAppConfirmation(item)}
      >
        <Text style={styles.whatsappButtonText}>💬 Enviar Confirmação</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agenda</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => Alert.alert("Em breve", "Ecrã de novo agendamento.")}>
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#111827" style={{ marginTop: 50 }} />
      ) : appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Nenhuma avaliação agendada.</Text>
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

// Utilitário rápido de data
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
  
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyStateText: { color: "#6b7280", fontSize: 16 },
});

