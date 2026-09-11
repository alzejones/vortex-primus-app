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
import { useTheme } from "../../../contexts/ThemeContext";
import { supabase } from "../../../lib/supabase";
import { GradientPrimary } from "../../../utils/gradients";
import { T } from "../../../utils/theme";

export default function NewAppointment() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { client_id, suggested_type, reset_enrollment_id } = useLocalSearchParams();
  const [clientName, setClientName] = useState("Carregando aluno...");
  const [loading, setLoading] = useState(false);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [upcomingDays, setUpcomingDays] = useState<Date[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

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

    if (suggested_type && typeof suggested_type === 'string' && !selectedTypes.includes(suggested_type)) {
      setSelectedTypes([suggested_type]);
    }

    const days = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    setUpcomingDays(days);
  }, [client_id]);

  useEffect(() => {
    if (!selectedDate) {
      setBookedTimes([]);
      return;
    }

    const loadBookedTimes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: trainer } = await supabase.from("trainers").select("id").eq("user_id", user?.id).single();
      
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      const { data } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("trainer_id", trainer?.id)
        .eq("appointment_date", formattedDate)
        .neq("status", "cancelled");

      if (data) {
        const times = data.map((a) => a.appointment_time.substring(0, 5));
        setBookedTimes(times);
        
        if (selectedTime && times.includes(selectedTime)) {
          setSelectedTime(null);
        }
      }
    };

    loadBookedTimes();
  }, [selectedDate]);

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

      if (error) {
        if (error.code === '23505') {
          alert("Esse horário acabou de ser ocupado por outro agendamento. Escolha outro horário.");
          
          const { data } = await supabase
            .from("appointments")
            .select("appointment_time")
            .eq("trainer_id", trainer?.id)
            .eq("appointment_date", formattedDate)
            .neq("status", "cancelled");
          
          if (data) {
            setBookedTimes(data.map((a) => a.appointment_time.substring(0, 5)));
          }
          return;
        }
        throw error;
      }

      if (reset_enrollment_id) {
        const { error: updateError } = await supabase
          .from("reset_protocol_enrollments")
          .update({ day6_scheduled_at: new Date().toISOString() })
          .eq("id", reset_enrollment_id);

        if (updateError) {
          console.error("Erro ao marcar 6º dia como agendado:", updateError);
        }
      }

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
              style={[styles.typeCard, selectedTypes.includes("Comp.Corporal") && styles.typeCardActive]}
              onPress={() => toggleType("Comp.Corporal")}
              activeOpacity={0.7}
            >
              <Text style={styles.cardEmoji}>⚖️</Text>
              <Text style={[styles.cardTitle, selectedTypes.includes("Comp.Corporal") && styles.cardTitleActive]}>Comp. Corporal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeCard, selectedTypes.includes("Condicionamento") && styles.typeCardActive]}
              onPress={() => toggleType("Condicionamento")}
              activeOpacity={0.7}
            >
              <Text style={styles.cardEmoji}>🏃</Text>
              <Text style={[styles.cardTitle, selectedTypes.includes("Condicionamento") && styles.cardTitleActive]}>Condicionamento</Text>
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
            {availableTimes.map((time) => {
              const isBooked = bookedTimes.includes(time);
              const isSelected = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeBox,
                    isSelected && styles.timeBoxActive,
                    isBooked && styles.timeBoxDisabled
                  ]}
                  onPress={() => !isBooked && setSelectedTime(time)}
                  disabled={isBooked}
                >
                  <Text style={[
                    styles.timeText,
                    isSelected && styles.timeTextActive,
                    isBooked && styles.timeTextDisabled
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações (Opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Trazer roupa de treino, chegar 10 min antes..."
            placeholderTextColor={theme.colors.textMuted}
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

const createStyles = (theme: import("@/contexts/ThemeContext").AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    padding: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: theme.colors.primary, fontWeight: "700", fontSize: 16 },
  title: { fontSize: 28, fontWeight: "900", color: theme.colors.textPrimary, marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: theme.colors.textMuted, fontWeight: "600" },

  scrollContent: { padding: 20, paddingBottom: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 16 },

  cardsRow: { flexDirection: "row", gap: 12 },
  typeCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  typeCardActive: { borderColor: T.blue, backgroundColor: T.blueGlow, borderWidth: 2 },
  cardEmoji: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.textSecondary, textAlign: "center" },
  cardTitleActive: { color: T.blue },

  dateBox: {
    backgroundColor: theme.colors.card,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    minWidth: 70,
  },
  dateBoxActive: { backgroundColor: theme.colors.card, borderColor: theme.colors.primary },
  dateDay: { fontSize: 12, fontWeight: "700", color: theme.colors.textMuted, textTransform: "uppercase", marginBottom: 4 },
  dateNumber: { fontSize: 20, fontWeight: "800", color: theme.colors.textPrimary },
  dateTextActive: { color: theme.colors.primary },

  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeBox: {
    width: "22%",
    backgroundColor: theme.colors.card,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  timeBoxActive: { backgroundColor: T.blue, borderColor: T.blue },
  timeBoxDisabled: { opacity: 0.4 },
  timeText: { fontSize: 15, fontWeight: "700", color: theme.colors.textSecondary },
  timeTextActive: { color: T.white },
  timeTextDisabled: { color: theme.colors.textMuted },

  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlignVertical: "top",
  },

  footer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveBtn: { borderRadius: 16, overflow: "hidden" },
  saveBtnGradient: { paddingVertical: 18, alignItems: "center", borderRadius: 16 },
  saveBtnText: { color: T.white, fontWeight: "900", fontSize: 16, letterSpacing: 1 },
  addClientBtn: { marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card, alignItems: "center" },
  addClientBtnText: { color: theme.colors.primary, fontWeight: "700", fontSize: 15 },
});
