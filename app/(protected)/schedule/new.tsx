import { LinearGradient } from "expo-linear-gradient";
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
import { GradientPrimary } from "../../../utils/gradients";
import { T } from "../../../utils/theme";

export default function NewAppointment() {
  const { client_id } = useLocalSearchParams();
  const [clientName, setClientName] = useState("Carregando aluno...");
  const [loading, setLoading] = useState(false);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [upcomingDays, setUpcomingDays] = useState<Date[]>([]);

  const availableTimes = [
    "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"
  ];

  useEffect(() => {
    if (client_id) {
      const loadClient = async () => {
        const { data } = await supabase.from("clients").select("name").eq("id", client_id).single();
        if (data) setClientName(data.name);
      };
      loadClient();
    }

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

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Trazer roupa de treino, chegar 10 min antes..."
            placeholderTextColor={T.t3}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          <LinearGradient {...GradientPrimary} style={styles.saveBtnGradient}>
            <Text style={styles.saveBtnText}>{loading ? "Agendando..." : "CONFIRMAR AGENDAMENTO"}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addClientBtn}
          onPress={() => router.push("/(protected)/client-create?from=schedule" as any)}
        >
          <Text style={styles.addClientBtnText}>＋ Cadastrar novo aluno</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: T.card,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: T.blue, fontWeight: "700", fontSize: 16 },
  title: { fontSize: 28, fontWeight: "900", color: T.t1, marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: T.t3, fontWeight: "600" },

  scrollContent: { padding: 20, paddingBottom: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: T.t1, marginBottom: 16 },

  cardsRow: { flexDirection: "row", gap: 12 },
  typeCard: {
    flex: 1,
    backgroundColor: T.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  typeCardActive: { borderColor: T.blue, backgroundColor: T.blueGlow, borderWidth: 2 },
  cardEmoji: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: T.t2, textAlign: "center" },
  cardTitleActive: { color: T.blue },

  dateBox: {
    backgroundColor: T.card,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    minWidth: 70,
  },
  dateBoxActive: { backgroundColor: T.surface, borderColor: T.blue },
  dateDay: { fontSize: 12, fontWeight: "700", color: T.t3, textTransform: "uppercase", marginBottom: 4 },
  dateNumber: { fontSize: 20, fontWeight: "800", color: T.t1 },
  dateTextActive: { color: T.blue },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeBox: {
    width: "22%",
    backgroundColor: T.card,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
  },
  timeBoxActive: { backgroundColor: T.blue, borderColor: T.blue },
  timeText: { fontSize: 15, fontWeight: "700", color: T.t2 },
  timeTextActive: { color: T.white },

  input: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: T.t1,
    textAlignVertical: "top",
  },

  footer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: T.card,
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  saveBtn: { borderRadius: 16, overflow: "hidden" },
  saveBtnGradient: { paddingVertical: 18, alignItems: "center", borderRadius: 16 },
  saveBtnText: { color: T.white, fontWeight: "900", fontSize: 16, letterSpacing: 1 },
  addClientBtn: { marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface, alignItems: "center" },
  addClientBtnText: { color: T.blue, fontWeight: "700", fontSize: 15 },
});
