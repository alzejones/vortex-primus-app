import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../../lib/supabase";

export default function NewAppointment() {
  const { client_id } = useLocalSearchParams();
  const [clientName, setClientName] = useState("Carregando aluno...");
  const [loading, setLoading] = useState(false);

  // Estados do Formulário
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Gera os próximos 15 dias para o Carrossel
  const [upcomingDays, setUpcomingDays] = useState<Date[]>([]);
  
  // 🔴 NOVO: Horários disponíveis de 30 em 30 minutos
  const availableTimes = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", 
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "16:00", "16:30", 
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
  ];

  useEffect(() => {
    // Busca o nome do aluno
    if (client_id) {
      const loadClient = async () => {
        const { data } = await supabase.from("clients").select("name").eq("id", client_id).single();
        if (data) setClientName(data.name);
      };
      loadClient();
    }

    // Gera o array de dias (Hoje + 14 dias)
    const days = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    setUpcomingDays(days);
  }, [client_id]);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const getDayName = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();
  };

  async function handleSave() {
    if (selectedTypes.length === 0) {
      alert("Selecione pelo menos um tipo de avaliação.");
      return;
    }
    if (!selectedDate || !selectedTime) {
      alert("Selecione a data e o horário.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user?.id).single();

      // Formatar a data para o Supabase (YYYY-MM-DD)
      const formattedDate = selectedDate.toISOString().split('T')[0];

      const { error } = await supabase.from("appointments").insert([{
        client_id,
        trainer_id: trainer?.id,
        appointment_date: formattedDate,
        appointment_time: selectedTime,
        types: selectedTypes,
        notes: notes,
        status: 'scheduled'
      }]);

      if (error) throw error;
      
      router.back();

    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Agendar Avaliação</Text>
        <Text style={styles.subtitle}>Aluno: {clientName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 1. TIPO DE AVALIAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que será avaliado?</Text>
          <View style={styles.cardsRow}>
            <TouchableOpacity 
              style={[styles.typeCard, selectedTypes.includes("composition") && styles.typeCardActive]}
              onPress={() => toggleType("composition")}
              activeOpacity={0.7}
            >
              <Text style={styles.cardEmoji}>⚖️</Text>
              <Text style={[styles.cardTitle, selectedTypes.includes("composition") && styles.cardTitleActive]}>Corporal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.typeCard, selectedTypes.includes("conditioning") && styles.typeCardActive]}
              onPress={() => toggleType("conditioning")}
              activeOpacity={0.7}
            >
              <Text style={styles.cardEmoji}>🏃</Text>
              <Text style={[styles.cardTitle, selectedTypes.includes("conditioning") && styles.cardTitleActive]}>Física (Cross)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. DATA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Qual o melhor dia?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
            {upcomingDays.map((date, index) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.dateBox, isSelected && styles.dateBoxActive]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateTextActive]}>{getDayName(date)}</Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateTextActive]}>{date.getDate()}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. HORÁRIO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>E o horário?</Text>
          <View style={styles.timeGrid}>
            {availableTimes.map((time) => (
              <TouchableOpacity 
                key={time} 
                style={[styles.timeBox, selectedTime === time && styles.timeBoxActive]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>{time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. OBSERVAÇÕES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações (Opcional)</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ex: Trazer roupa de treino, chegar 10 min antes..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>{loading ? "Agendando..." : "CONFIRMAR AGENDAMENTO"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: "#4f46e5", fontWeight: "700", fontSize: 16 },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a", marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: "#64748b", fontWeight: "600" },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b", marginBottom: 16 },

  cardsRow: { flexDirection: "row", gap: 12 },
  typeCard: { flex: 1, backgroundColor: "#fff", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  typeCardActive: { borderColor: "#3b82f6", backgroundColor: "#eff6ff", borderWidth: 2 },
  cardEmoji: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#475569", textAlign: "center" },
  cardTitleActive: { color: "#1d4ed8" },

  dateBox: { backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", minWidth: 70 },
  dateBoxActive: { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  dateDay: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 4 },
  dateNumber: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  dateTextActive: { color: "#fff" },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeBox: { width: "22%", backgroundColor: "#fff", paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center" },
  timeBoxActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  timeText: { fontSize: 15, fontWeight: "700", color: "#334155" },
  timeTextActive: { color: "#fff" },

  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 16, fontSize: 16, color: "#1e293b", textAlignVertical: "top" },

  footer: { padding: 20, paddingBottom: Platform.OS === "ios" ? 40 : 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  saveBtn: { backgroundColor: "#0f172a", paddingVertical: 18, borderRadius: 16, alignItems: "center", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 16, letterSpacing: 1 },
});

