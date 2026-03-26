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
  
  // Horários disponíveis (exemplo padrão de Box/Academia)
  const availableTimes = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", 
    "12:00", "16:00", "17:00", "18:00", "19:00", "20:00"
  ];

  useEffect(() => {
    // Busca o nome do aluno
    if (client_id) {
      supabase.from("clients").select("name").eq("id", client_id).single()
        .then(({ data }) => { if (data) setClientName(data.name); });
    } else {
      setClientName("Nenhum aluno selecionado");
    }

    // Gera o array de datas (hoje + 14 dias)
    const dates = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    setUpcomingDays(dates);
    setSelectedDate(dates[0]); // Seleciona hoje por padrão
  }, [client_id]);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const getDayName = (date: Date) => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return days[date.getDay()];
  };

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();
  };

  const handleSave = async () => {
    if (selectedTypes.length === 0) return alert("Selecione pelo menos um tipo de avaliação.");
    if (!selectedDate || !selectedTime) return alert("Selecione a data e o horário.");

    setLoading(true);
    
    try {
      // 1. Pega o ID do treinador logado
      const { data: { user } } = await supabase.auth.getUser();
      let trainerId = null;
      if (user) {
        const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single();
        if (trainer) trainerId = trainer.id;
      }

      // 2. Formata a data para o padrão do banco (YYYY-MM-DD)
      const isoDate = selectedDate.toISOString().split('T')[0];

      // 3. Salva no banco de dados real
      const { error } = await supabase.from('appointments').insert([{
        trainer_id: trainerId,
        client_id: client_id,
        appointment_date: isoDate,
        appointment_time: selectedTime,
        types: selectedTypes,
        notes: notes,
        status: 'Agendado'
      }]);

      if (error) throw error;

      alert("✅ Agendamento realizado com sucesso!");
      router.back();

    } catch (err: any) {
      alert("Erro ao salvar: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.container}>
        
        {/* CABEÇALHO FIXO */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Novo Agendamento</Text>
          <Text style={styles.subtitle}>Para: <Text style={{ color: "#2563eb", fontWeight: "700" }}>{clientName}</Text></Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* 1. SELEÇÃO DO TIPO DE AVALIAÇÃO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. O que vamos avaliar?</Text>
            <Text style={styles.sectionSubtitle}>Você pode selecionar mais de um para o mesmo horário.</Text>
            
            <View style={styles.cardsRow}>
              <TouchableOpacity 
                style={[styles.typeCard, selectedTypes.includes("composition") && styles.typeCardActive]}
                onPress={() => toggleType("composition")}
              >
                <Text style={styles.cardEmoji}>⚖️</Text>
                <Text style={[styles.cardTitle, selectedTypes.includes("composition") && styles.cardTitleActive]}>
                  Composição Corporal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.typeCard, selectedTypes.includes("conditioning") && styles.typeCardActive]}
                onPress={() => toggleType("conditioning")}
              >
                <Text style={styles.cardEmoji}>🏃‍♂️</Text>
                <Text style={[styles.cardTitle, selectedTypes.includes("conditioning") && styles.cardTitleActive]}>
                  Condicionamento Físico
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. SELEÇÃO DA DATA (CARROSSEL HORIZONTAL) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Escolha o dia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
              {upcomingDays.map((date, index) => {
                const active = isSameDay(selectedDate, date);
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.dateBox, active && styles.dateBoxActive]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dateDay, active && styles.dateTextActive]}>{getDayName(date)}</Text>
                    <Text style={[styles.dateNumber, active && styles.dateTextActive]}>{date.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 3. SELEÇÃO DO HORÁRIO (GRID) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Escolha o horário</Text>
            <View style={styles.timeGrid}>
              {availableTimes.map((time, index) => {
                const active = selectedTime === time;
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.timeBox, active && styles.timeBoxActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeText, active && styles.timeTextActive]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. OBSERVAÇÕES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Pedir para o aluno vir em jejum..."
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>

        </ScrollView>

        {/* BOTÃO FLUTUANTE DE SALVAR */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, (!selectedTime || selectedTypes.length === 0) && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={!selectedTime || selectedTypes.length === 0 || loading}
          >
            <Text style={styles.saveBtnText}>
              {loading ? "Agendando..." : "Confirmar Agendamento"}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? 40 : 20, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  backButton: { marginBottom: 12 },
  backText: { color: "#64748b", fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: "#475569", marginTop: 4 },
  
  scrollContent: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1e293b", marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, color: "#64748b", marginBottom: 16 },
  
  cardsRow: { flexDirection: "row", gap: 12 },
  typeCard: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 16, borderWidth: 2, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  typeCardActive: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  cardEmoji: { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#475569", textAlign: "center" },
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

  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 12, padding: 16, fontSize: 15, color: "#1e293b", height: 100, textAlignVertical: "top" },
  
  footer: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#fff", padding: 20, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  saveBtn: { backgroundColor: "#16a34a", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  saveBtnDisabled: { backgroundColor: "#94a3b8" },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" }
});

