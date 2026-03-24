import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

type StrengthTest = { id: string; exercise: string; load: string; reps: string; rm: string };
type EnduranceTest = { id: string; type: string; distance: string; time: string; reps: string; vo2: string };
type MobilityTest = { id: string; name: string; score: string; notes: string };

export default function ConditioningAssessment() {
  // 🔴 Agora recebemos o ID do Aluno direto do Dashboard
  const { client_id } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [clientName, setClientName] = useState("");

  // Funções de Data
  const formatDateBR = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `${d}/${m}/${y} ${h}:${min}`;
  };

  const parseDateBRToISO = (str: string) => {
    try {
      const [datePart, timePart] = str.split(' ');
      const [d, m, y] = datePart.split('/');
      const [h, min] = timePart.split(':');
      return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min)).toISOString();
    } catch (e) {
      return new Date().toISOString();
    }
  };

  const [assessmentDate, setAssessmentDate] = useState(formatDateBR(new Date()));

  function handleDateChange(text: string) {
    let v = text.replace(/\D/g, "");
    if (v.length > 12) v = v.substring(0, 12);
    v = v.replace(/^(\d{2})(\d)/, "$1/$2");
    v = v.replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
    v = v.replace(/^(\d{2})\/(\d{2})\/(\d{4})(\d)/, "$1/$2/$3 $4");
    v = v.replace(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2})(\d)/, "$1/$2/$3 $4:$5");
    setAssessmentDate(v);
  }

  const [openSection, setOpenSection] = useState<"strength" | "endurance" | "mobility" | null>("strength");

  const [strengthTests, setStrengthTests] = useState<StrengthTest[]>([]);
  const [enduranceTests, setEnduranceTests] = useState<EnduranceTest[]>([]);
  const [mobilityTests, setMobilityTests] = useState<MobilityTest[]>([]);

  const strengthOptions = ["Flexão", "Supino", "Agachamento", "Bíceps", "Abdominal"];
  const enduranceOptions = ["Corrida", "Burpee (1 min)", "Abdominal (1 min)", "Agachamento (1 min)"];
  const mobilityOptions = [
    "Toque chão (Pernas esticadas)", 
    "Agachamentos (Profundidade)", 
    "Cotovelos altos (Clean/Front Squat)", 
    "Ombros/Escápulas (Barra Overhead)"
  ];

  // Busca o nome do aluno ao abrir a tela
  useEffect(() => {
    if (client_id) {
      supabase.from("clients").select("name").eq("id", client_id).single()
        .then(({ data }) => { if (data) setClientName(data.name); });
    }
  }, [client_id]);

  const addStrength = (exercise: string) => setStrengthTests([...strengthTests, { id: Date.now().toString(), exercise, load: "", reps: "", rm: "" }]);
  const addEndurance = (type: string) => setEnduranceTests([...enduranceTests, { id: Date.now().toString(), type, distance: "", time: "", reps: "", vo2: "" }]);
  const addMobility = (name: string) => setMobilityTests([...mobilityTests, { id: Date.now().toString(), name, score: "", notes: "" }]);

  const updateStrength = (id: string, field: keyof StrengthTest, value: string) => setStrengthTests(strengthTests.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateEndurance = (id: string, field: keyof EnduranceTest, value: string) => setEnduranceTests(enduranceTests.map(t => t.id === id ? { ...t, [field]: value } : t));
  const updateMobility = (id: string, field: keyof MobilityTest, value: string) => setMobilityTests(mobilityTests.map(t => t.id === id ? { ...t, [field]: value } : t));

  const handleSaveAll = async () => {
    if (!client_id) {
      setMessage("Erro: ID do Aluno não encontrado.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Pega o ID do treinador autenticado
      const { data: { user } } = await supabase.auth.getUser();
      let trainerId = null;
      if (user) {
        const { data: trainer } = await supabase.from('trainers').select('id').eq('user_id', user.id).single();
        if (trainer) trainerId = trainer.id;
      }

      // 1. Cria o "Evento" de Avaliação principal independente
      const isoDate = parseDateBRToISO(assessmentDate);
      const { data: newAssessment, error: assessError } = await supabase
        .from("physical_assessments")
        .insert([{ 
          client_id, 
          date: isoDate,
          trainer_id: trainerId,
          assessor_name: user?.email || "Treinador"
        }])
        .select()
        .single();

      if (assessError) throw assessError;
      const assessment_id = newAssessment.id;

      // 2. Cria a pasta de condicionamento amarrada a este evento
      const { data: condTest, error: condError } = await supabase
        .from("conditioning_tests")
        .insert([{ assessment_id }])
        .select()
        .single();

      if (condError) throw condError;
      const conditioning_test_id = condTest.id;

      // 3. Salva os testes
      if (strengthTests.length > 0) {
        const strengthData = strengthTests.map(t => ({
          conditioning_test_id, exercise_name: t.exercise, load_kg: t.load ? parseFloat(t.load) : null, repetitions: t.reps ? parseInt(t.reps) : null, rm_estimated: t.rm ? parseFloat(t.rm) : null,
        }));
        await supabase.from("strength_tests").insert(strengthData);
      }

      if (enduranceTests.length > 0) {
        const enduranceData = enduranceTests.map(t => ({
          conditioning_test_id, test_type: t.type, distance_m: t.distance ? parseFloat(t.distance) : null, time_seconds: t.time ? parseInt(t.time) : null, repetitions: t.reps ? parseInt(t.reps) : null, vo2_estimated: t.vo2 ? parseFloat(t.vo2) : null,
        }));
        await supabase.from("endurance_tests").insert(enduranceData);
      }

      if (mobilityTests.length > 0) {
        const mobilityData = mobilityTests.map(t => ({
          conditioning_test_id, test_name: t.name, score: t.score ? parseInt(t.score) : null, notes: t.notes, 
        }));
        await supabase.from("mobility_tests").insert(mobilityData);
      }

      setMessage("✅ Testes físicos salvos com sucesso!");
      setTimeout(() => { router.back(); }, 1500); 

    } catch (error: any) {
      setMessage("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMobilityOptions = (item: MobilityTest) => {
    if (item.name === "Cotovelos altos (Clean/Front Squat)" || item.name === "Ombros/Escápulas (Barra Overhead)") {
      return (
        <View style={styles.quickSelectRow}>
          <TouchableOpacity style={[styles.quickButton, item.notes === "Sim" && styles.quickButtonActive]} onPress={() => updateMobility(item.id, "notes", "Sim")}>
            <Text style={[styles.quickButtonText, item.notes === "Sim" && styles.quickButtonTextActive]}>Sim</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickButton, item.notes === "Não" && styles.quickButtonActive]} onPress={() => updateMobility(item.id, "notes", "Não")}>
            <Text style={[styles.quickButtonText, item.notes === "Não" && styles.quickButtonTextActive]}>Não</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.name === "Agachamentos (Profundidade)") {
      return (
        <View style={{ flexDirection: "column", gap: 8, marginTop: 8 }}>
          <TouchableOpacity style={[styles.quickButton, item.notes === "Quadril acima da linha dos joelhos" && styles.quickButtonActive]} onPress={() => updateMobility(item.id, "notes", "Quadril acima da linha dos joelhos")}>
            <Text style={[styles.quickButtonText, item.notes === "Quadril acima da linha dos joelhos" && styles.quickButtonTextActive]}>Quadril acima da linha dos joelhos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickButton, item.notes === "Quadril na linha dos joelhos" && styles.quickButtonActive]} onPress={() => updateMobility(item.id, "notes", "Quadril na linha dos joelhos")}>
            <Text style={[styles.quickButtonText, item.notes === "Quadril na linha dos joelhos" && styles.quickButtonTextActive]}>Quadril na linha dos joelhos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickButton, item.notes === "Quadril abaixo da linha dos joelhos" && styles.quickButtonActive]} onPress={() => updateMobility(item.id, "notes", "Quadril abaixo da linha dos joelhos")}>
            <Text style={[styles.quickButtonText, item.notes === "Quadril abaixo da linha dos joelhos" && styles.quickButtonTextActive]}>Quadril abaixo da linha dos joelhos</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.name === "Toque chão (Pernas esticadas)") {
      return (
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Distância da mão até o chão (ex: 5cm, Tocou)" value={item.notes} onChangeText={(v) => updateMobility(item.id, "notes", v)} />
        </View>
      );
    }
    
    return null;
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#f8fafc" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={styles.title}>Testes Físicos</Text>
          <Text style={styles.subtitle}>Registre a performance de forma independente.</Text>
        </View>

        {/* 🔴 CABEÇALHO DO ALUNO COM DATA E HORA (Idêntico ao da Bioimpedância) */}
        <View style={styles.clientHeaderBox}>
          <Text style={styles.clientNameLabel}>Aluno(a):</Text>
          <Text style={styles.clientNameValue}>{clientName || "Carregando..."}</Text>
          
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold', marginBottom: 4 }}>DATA / HORA DA AVALIAÇÃO</Text>
            <TextInput 
              style={styles.dateInput}
              value={assessmentDate}
              onChangeText={handleDateChange}
              placeholder="DD/MM/AAAA HH:mm"
              keyboardType="numeric"
              maxLength={16}
            />
          </View>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {/* --- FORÇA --- */}
        <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpenSection(openSection === "strength" ? null : "strength")}>
          <Text style={styles.accordionTitle}>💪 Testes de Força</Text>
          <Text>{openSection === "strength" ? "▼" : "▶"}</Text>
        </TouchableOpacity>
        {openSection === "strength" && (
          <View style={styles.accordionBody}>
            <View style={styles.chipContainer}>
              {strengthOptions.map(opt => (
                <TouchableOpacity key={opt} style={styles.chip} onPress={() => addStrength(opt)}><Text style={styles.chipText}>+ {opt}</Text></TouchableOpacity>
              ))}
            </View>
            {strengthTests.map((item) => (
              <View key={item.id} style={styles.testCard}>
                <Text style={styles.testCardTitle}>{item.exercise}</Text>
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Carga (kg)" keyboardType="numeric" value={item.load} onChangeText={(v) => updateStrength(item.id, "load", v)} />
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Reps" keyboardType="numeric" value={item.reps} onChangeText={(v) => updateStrength(item.id, "reps", v)} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="1RM Est." keyboardType="numeric" value={item.rm} onChangeText={(v) => updateStrength(item.id, "rm", v)} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- RESISTÊNCIA / CÁRDIO --- */}
        <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpenSection(openSection === "endurance" ? null : "endurance")}>
          <Text style={styles.accordionTitle}>🏃 Resistência Cárdio</Text>
          <Text>{openSection === "endurance" ? "▼" : "▶"}</Text>
        </TouchableOpacity>
        {openSection === "endurance" && (
          <View style={styles.accordionBody}>
            <View style={styles.chipContainer}>
              {enduranceOptions.map(opt => (
                <TouchableOpacity key={opt} style={styles.chip} onPress={() => addEndurance(opt)}><Text style={styles.chipText}>+ {opt}</Text></TouchableOpacity>
              ))}
            </View>
            {enduranceTests.map((item) => (
              <View key={item.id} style={styles.testCard}>
                <Text style={styles.testCardTitle}>{item.type}</Text>
                {item.type === "Corrida" ? (
                  <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Distância (m)" keyboardType="numeric" value={item.distance} onChangeText={(v) => updateEndurance(item.id, "distance", v)} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Tempo (seg)" keyboardType="numeric" value={item.time} onChangeText={(v) => updateEndurance(item.id, "time", v)} />
                  </View>
                ) : (
                  <View style={styles.row}>
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Quantidade (Reps em 1 minuto)" keyboardType="numeric" value={item.reps} onChangeText={(v) => updateEndurance(item.id, "reps", v)} />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* --- MOBILIDADE --- */}
        <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpenSection(openSection === "mobility" ? null : "mobility")}>
          <Text style={styles.accordionTitle}>🧘 Mobilidade</Text>
          <Text>{openSection === "mobility" ? "▼" : "▶"}</Text>
        </TouchableOpacity>
        {openSection === "mobility" && (
          <View style={styles.accordionBody}>
            <View style={styles.chipContainer}>
              {mobilityOptions.map(opt => (
                <TouchableOpacity key={opt} style={styles.chip} onPress={() => addMobility(opt)}><Text style={styles.chipText}>+ {opt}</Text></TouchableOpacity>
              ))}
            </View>
            {mobilityTests.map((item) => (
              <View key={item.id} style={styles.testCard}>
                <Text style={styles.testCardTitle}>{item.name}</Text>
                {renderMobilityOptions(item)}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAll} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Salvar Testes</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 16, marginTop: 40 },
  title: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4 },
  
  clientHeaderBox: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: "#e2e8f0", elevation: 1 },
  clientNameLabel: { fontSize: 12, color: "#64748b", fontWeight: "700", textTransform: "uppercase" },
  clientNameValue: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginTop: 2 },
  dateInput: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#cbd5e1", padding: 10, borderRadius: 8, fontSize: 14, color: "#0f172a", textAlign: "center", width: 160 },

  message: { backgroundColor: "#dbeafe", color: "#1e40af", padding: 12, borderRadius: 8, marginBottom: 16, fontWeight: "600", textAlign: "center" },
  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1, borderWidth: 1, borderColor: "#e2e8f0" },
  accordionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  accordionBody: { paddingBottom: 16 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16, marginTop: 8 },
  chip: { backgroundColor: "#eff6ff", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#bfdbfe" },
  chipText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  testCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#f1f5f9" },
  testCardTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  input: { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14 },
  quickSelectRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  quickButton: { flex: 1, backgroundColor: "#f1f5f9", paddingVertical: 12, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  quickButtonActive: { backgroundColor: "#2563eb", borderColor: "#1d4ed8" },
  quickButtonText: { color: "#475569", fontWeight: "600", fontSize: 13, textAlign: "center" },
  quickButtonTextActive: { color: "#fff" },
  saveButton: { backgroundColor: "#2563eb", height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 24, elevation: 3 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

